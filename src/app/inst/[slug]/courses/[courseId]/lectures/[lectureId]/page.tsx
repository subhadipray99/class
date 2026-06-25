import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import LecturePlayerClient from '@/app/components/LecturePlayerClient';

interface PageProps {
  params: Promise<{
    slug: string;
    courseId: string;
    lectureId: string;
  }>;
}

export default async function LecturePlayerPage({ params }: PageProps) {
  const { slug, courseId, lectureId } = await params;

  // 1. Fetch current lecture details
  const { data: lecture } = await supabase
    .from('lectures')
    .select('*')
    .eq('id', lectureId)
    .maybeSingle();

  if (!lecture) {
    return notFound();
  }

  // 2. Fetch all other lectures in this course for navigation
  const { data: otherLectures } = await supabase
    .from('lectures')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  // 3. Fetch resources attached to this lecture
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('lecture_id', lectureId);

  // 4. Fetch quizzes attached to this lecture
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('lecture_id', lectureId);

  // 5. If quiz exists, fetch its questions
  let questions: any[] = [];
  if (quizzes && quizzes.length > 0) {
    const { data: quizQuestions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizzes[0].id)
      .order('created_at', { ascending: true });
    
    questions = quizQuestions || [];
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <Link href={`/inst/${slug}/courses/${courseId}`} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-hover)',
          border: '1px solid var(--border-light)'
        }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Course Player
          </span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{lecture.title}</h1>
        </div>
      </header>

      {/* Interactive Lecture Player Client */}
      <LecturePlayerClient
        slug={slug}
        courseId={courseId}
        lecture={lecture}
        otherLectures={otherLectures || []}
        resources={resources || []}
        quizzes={quizzes || []}
        questions={questions}
      />
    </div>
  );
}
