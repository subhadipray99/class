import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { School, BookOpen, GraduationCap, PlayCircle, ArrowRight } from 'lucide-react';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Navigation Header */}
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid var(--color-black)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--color-primary)',
            color: '#fff',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--color-black)',
            boxShadow: '2px 2px 0 var(--color-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <School size={18} style={{ color: 'var(--color-black)' }} />
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-black)', fontFamily: 'var(--font-family-heading)' }}>
            {institute.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {userId ? (
            <Link href={`/inst/${slug}/dashboard`} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
              Go to Dashboard
              <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link href={`/inst/${slug}/sign-in`} style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem', fontWeight: 700 }}>
                Sign In
              </Link>
              <Link href={`/inst/${slug}/sign-up`} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                Join Class
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Banner Section */}
      <section style={{
        padding: '6rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255, 107, 0, 0.04) 0%, transparent 100%)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
          opacity: 0.08,
          zIndex: -1
        }} />

        <h1 style={{
          fontSize: '3.75rem',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '1.25rem',
          color: 'var(--color-black)',
          fontFamily: 'var(--font-family-heading)'
        }}>
          Learn from the best at <br />
          <span className="text-gradient-orange">{institute.name}</span>
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          maxWidth: '580px',
          margin: '0 auto 3rem auto',
          fontSize: '1.125rem',
          fontWeight: 500,
          lineHeight: 1.6
        }}>
          Access dynamic lectures, interactive quizzes, study resources, and connect directly with expert teachers. Your success starts here.
        </p>

        {!userId && (
          <Link href={`/inst/${slug}/sign-up`} className="btn btn-secondary" style={{ padding: '0.9rem 2.2rem', fontSize: '1rem' }}>
            Start Learning Now
            <ArrowRight size={18} />
          </Link>
        )}
      </section>

      {/* Stats Summary bar */}
      <section style={{ padding: '2.5rem 0', borderTop: '2px solid var(--color-black)', borderBottom: '2px solid var(--color-black)', background: '#ffffff', boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.01)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '2.5rem', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(255, 107, 0, 0.1)', border: '2px solid var(--color-black)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <BookOpen size={22} style={{ color: 'var(--color-orange)' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-black)' }}>{courses?.length || 0}+</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Premium Courses</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.15)', border: '2px solid var(--color-black)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <GraduationCap size={22} style={{ color: 'var(--color-yellow)' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-black)' }}>24/7</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Self-paced Learning</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(37, 99, 235, 0.1)', border: '2px solid var(--color-black)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <PlayCircle size={22} style={{ color: 'var(--color-blue)' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-black)' }}>100%</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>HD Video Lectures</div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Feed Section */}
      <section style={{ maxWidth: '1100px', width: '100%', margin: '5rem auto', padding: '0 2rem', flex: 1 }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Explore our <span className="text-gradient-orange">Classes</span>
        </h2>

        {!courses || courses.length === 0 ? (
          <div className="glass" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-black)', background: '#ffffff' }}>
            <BookOpen size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }} />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.5rem' }}>No Courses Available Yet</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>The teachers are preparing study plans. Check back soon!</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {courses.map((course) => (
              <div key={course.id} className="glass glass-hover" style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '2px solid var(--color-black)',
                background: '#ffffff'
              }}>
                <div style={{
                  height: '180px',
                  background: course.thumbnail_url 
                    ? `url(${course.thumbnail_url}) center/cover no-repeat` 
                    : 'linear-gradient(135deg, #ffd6b3 0%, #ffebcc 100%)',
                  position: 'relative',
                  borderBottom: '2px solid var(--color-black)'
                }}>
                  <span className="badge badge-orange" style={{ position: 'absolute', top: '1rem', right: '1rem', border: '2px solid var(--color-black)' }}>
                    Live Batch
                  </span>
                </div>
                <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.75rem' }}>{course.title}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '1.75rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description || 'Access comprehensive video lectures, resources, notes, and quiz sets for full preparation.'}
                    </p>
                  </div>

                  <Link href={`/inst/${slug}/dashboard`} className="btn btn-outline" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}>
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
      <footer className="glass" style={{ padding: '2.5rem', textAlign: 'center', borderTop: '2px solid var(--color-black)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
        &copy; {new Date().getFullYear()} {institute.name}. Powered by ClassApp.
      </footer>
    </div>
  );
}
