import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { School, BookOpen, GraduationCap, PlayCircle, Users, ArrowRight, UserCheck } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InstituteHome({ params }: PageProps) {
  const { slug } = await params;
  const { userId } = await auth();

  // 1. Fetch Institute details
  const { data: institute } = await supabase
    .from('institutes')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!institute) {
    return notFound();
  }

  // 2. Fetch published courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('institute_id', institute.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--color-primary)',
            color: '#000',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700
          }}>
            <School size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-family-heading)' }}>
            {institute.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {userId ? (
            <Link href={`/inst/${slug}/dashboard`} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              Go to Dashboard
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link href={`/inst/${slug}/sign-in`} style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
                Sign In
              </Link>
              <Link href={`/inst/${slug}/sign-up`} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                Join Class
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Banner Section */}
      <section style={{
        padding: '5rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
          opacity: 0.1,
          zIndex: -1
        }} />

        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          marginBottom: '1rem',
          fontFamily: 'var(--font-family-heading)'
        }}>
          Learn from the best at <br />
          <span style={{ color: 'var(--color-primary)' }}>{institute.name}</span>
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          maxWidth: '600px',
          margin: '0 auto 2.5rem auto',
          fontSize: '1.125rem',
          lineHeight: 1.6
        }}>
          Access dynamic lectures, interactive quizzes, study resources, and connect directly with expert teachers. Your success starts here.
        </p>

        {!userId && (
          <Link href={`/inst/${slug}/sign-up`} className="btn btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
            Start Learning Now
            <ArrowRight size={20} />
          </Link>
        )}
      </section>

      {/* Stats Summary bar */}
      <section style={{ padding: '2rem 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '2rem', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BookOpen size={24} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{courses?.length || 0}+</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Premium Courses</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GraduationCap size={24} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>24/7</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Self-paced Learning</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PlayCircle size={24} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>100%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>HD Video Lectures</div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Feed Section */}
      <section style={{ maxWidth: '1100px', width: '100%', margin: '4rem auto', padding: '0 2rem', flex: 1 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Our <span style={{ color: 'var(--color-primary)' }}>Courses</span>
        </h2>

        {!courses || courses.length === 0 ? (
          <div className="glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: 'var(--radius-lg)' }}>
            <BookOpen size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Courses Available Yet</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>The teachers are preparing courses. Check back soon!</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {courses.map((course) => (
              <div key={course.id} className="glass glass-hover" style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  height: '160px',
                  background: course.thumbnail_url 
                    ? `url(${course.thumbnail_url}) center/cover no-repeat` 
                    : 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
                  position: 'relative'
                }}>
                  <span className="badge badge-purple" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                    Live Classes
                  </span>
                </div>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{course.title}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.4, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description || 'Access comprehensive video lectures, resources, notes, and quiz sets for full preparation.'}
                    </p>
                  </div>

                  <Link href={`/inst/${slug}/dashboard`} className="btn btn-outline" style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}>
                    Start Studying
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="glass" style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        &copy; {new Date().getFullYear()} {institute.name}. Powered by ClassApp.
      </footer>
    </div>
  );
}
