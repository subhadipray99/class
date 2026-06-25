import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Play, ArrowLeft, Calendar, BookOpen } from 'lucide-react';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      
      {/* Header */}
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        borderBottom: '2px solid var(--color-black)',
        background: 'var(--bg-surface)'
      }}>
        <Link href={`/inst/${slug}/dashboard`} className="btn btn-outline" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          padding: 0,
          borderRadius: 'var(--radius-sm)'
        }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
            Course Directory
          </span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-black)' }}>{course.title}</h1>
        </div>
      </header>

      {/* Main Panel */}
      <main style={{ maxWidth: '900px', width: '100%', margin: '3rem auto', padding: '0 2rem', flex: 1 }}>
        
        {/* Banner Card */}
        <section className="glass" style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--color-black)',
          boxShadow: '0 8px 0 var(--color-black)',
          marginBottom: '3rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2.5rem',
          alignItems: 'center',
          backgroundImage: 'linear-gradient(135deg, rgba(255, 107, 0, 0.04) 0%, transparent 100%)',
          background: '#ffffff'
        }}>
          <div style={{
            width: '230px',
            height: '145px',
            borderRadius: 'var(--radius-md)',
            background: course.thumbnail_url 
              ? `url(${course.thumbnail_url}) center/cover no-repeat` 
              : 'linear-gradient(135deg, #ffd6b3 0%, #ffebcc 100%)',
            border: '2px solid var(--color-black)'
          }} />

          <div style={{ flex: 1, minWidth: '280px' }}>
            <span className="badge badge-orange" style={{ marginBottom: '1rem', border: '2px solid var(--color-black)' }}>
              Full Batch
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.75rem' }}>{course.title}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.925rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {course.description || 'Access comprehensive video lectures, resources, notes, and quiz sets for full preparation.'}
            </p>
            <div style={{ display: 'flex', gap: '1.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={16} style={{ color: 'var(--color-orange)' }} />
                {lectures?.length || 0} Lectures
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} style={{ color: 'var(--color-blue)' }} />
                Self-paced Syllabus
              </span>
            </div>
          </div>
        </section>

        {/* Lectures List */}
        <section>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '1.5rem' }}>
            Batch Schedule & Lectures
          </h3>

          {!lectures || lectures.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-black)', background: '#ffffff' }}>
              <Play size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.5rem' }}>No lectures uploaded yet</h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>The instructor is finalizing the study materials.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {lectures.map((lecture, idx) => (
                <div key={lecture.id} className="glass glass-hover" style={{
                  padding: '1.5rem 1.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--color-black)',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '240px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 107, 0, 0.08)',
                      color: 'var(--color-orange)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      border: '2px solid var(--color-black)',
                      boxShadow: '2px 2px 0 var(--color-black)'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.25rem' }}>{lecture.title}</h4>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {lecture.description || 'Watch the lecture video and download reference study materials.'}
                      </p>
                    </div>
                  </div>

                  <Link href={`/inst/${slug}/courses/${courseId}/lectures/${lecture.id}`} className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
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
