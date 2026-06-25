import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Play, FileText, ArrowLeft, Calendar, FileDown, BookOpen } from 'lucide-react';

interface PageProps {
  params: Promise<{
    slug: string;
    courseId: string;
  }>;
}

export default async function CourseOverview({ params }: PageProps) {
  const { slug, courseId } = await params;

  // 1. Fetch Course details
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();

  if (!course) {
    return notFound();
  }

  // 2. Fetch Lectures for this course
  const { data: lectures } = await supabase
    .from('lectures')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
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
        <Link href={`/inst/${slug}/dashboard`} style={{
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
            Course Directory
          </span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{course.title}</h1>
        </div>
      </header>

      {/* Main Panel */}
      <main style={{ maxWidth: '900px', width: '100%', margin: '2.5rem auto', padding: '0 2rem', flex: 1 }}>
        
        {/* Banner Card */}
        <section className="glass" style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2.5rem',
          alignItems: 'center',
          backgroundImage: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)',
          border: '1px solid rgba(59, 130, 246, 0.15)'
        }}>
          <div style={{
            width: '220px',
            height: '140px',
            borderRadius: 'var(--radius-md)',
            background: course.thumbnail_url 
              ? `url(${course.thumbnail_url}) center/cover no-repeat` 
              : 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
            border: '1px solid var(--border-light)'
          }} />

          <div style={{ flex: 1, minWidth: '280px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
              Full Syllabus
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>{course.title}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {course.description || 'Access comprehensive video lectures, resources, notes, and quiz sets for full preparation.'}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <BookOpen size={16} />
                {lectures?.length || 0} Lectures
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={16} />
                Self-paced Study
              </span>
            </div>
          </div>
        </section>

        {/* Lectures List */}
        <section>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Lectures & study material
          </h3>

          {!lectures || lectures.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: 'var(--radius-lg)' }}>
              <Play size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
              <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>No lectures uploaded yet</h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>The instructor is finalizing the study material.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {lectures.map((lecture, idx) => (
                <div key={lecture.id} className="glass glass-hover" style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '240px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: 'var(--color-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{lecture.title}</h4>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {lecture.description || 'Watch the lecture video and download reference study materials.'}
                      </p>
                    </div>
                  </div>

                  <Link href={`/inst/${slug}/courses/${courseId}/lectures/${lecture.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                    <Play size={14} style={{ fill: 'currentColor' }} />
                    Watch Lecture
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
