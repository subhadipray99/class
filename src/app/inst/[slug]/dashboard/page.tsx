'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  BookOpen, PlayCircle, Award, Layout, 
  Settings, LogOut, Loader2, ArrowRight, 
  Search, ShieldAlert, GraduationCap 
} from 'lucide-react';
import Link from 'next/link';

interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  institute_id: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function Dashboard({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState('');

  // 1. Sync Clerk User to Supabase on load
  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      try {
        const res = await fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instituteSlug: slug })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to sync profile');
        }

        setProfile(data);
        fetchCourses(data.institute_id);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error syncing profile');
        setLoading(false);
      } finally {
        setSyncing(false);
      }
    };

    syncUser();
  }, [user, isLoaded, slug]);

  // 2. Fetch courses for the institute
  const fetchCourses = async (instituteId: string) => {
    try {
      const db = getSupabaseClient();
      const { data, error } = await db
        .from('courses')
        .select('*')
        .eq('institute_id', instituteId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (err: any) {
      console.error(err);
      setError('Could not load courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isLoaded || syncing || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'var(--bg-base)' }}>
        <Loader2 size={40} style={{ color: 'var(--color-orange)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
          {syncing ? 'Synchronizing workspace...' : 'Loading courses...'}
        </p>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-base)' }}>
        <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-black)', boxShadow: '0 8px 0 var(--color-black)', textAlign: 'center', maxWidth: '450px', background: '#ffffff' }}>
          <ShieldAlert size={48} style={{ color: 'var(--color-danger)', marginBottom: '1.25rem', display: 'inline-block' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.5rem' }}>Failed to Authenticate</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 550, marginBottom: '1.75rem' }}>{error}</p>
          <Link href={`/inst/${slug}`} className="btn btn-primary">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isAdminOrTeacher = profile?.role === 'admin' || profile?.role === 'teacher';

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
        borderBottom: '2px solid var(--color-black)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: 'var(--color-black)',
            fontFamily: 'var(--font-family-heading)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <GraduationCap style={{ color: 'var(--color-orange)' }} />
            Study Portal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {isAdminOrTeacher && (
            <Link href={`/inst/${slug}/admin`} className="btn btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
              <Layout size={15} />
              Admin Panel
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '0.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-black)' }}>{profile?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{profile?.role}</div>
            </div>
          </div>

          <SignOutButton redirectUrl={`/inst/${slug}`}>
            <button className="btn btn-outline" style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)' }}>
              <LogOut size={16} />
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '3rem 2rem', flex: 1 }}>
        
        {/* Welcome Section */}
        <section className="glass" style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--color-black)',
          boxShadow: '0 8px 0 var(--color-black)',
          marginBottom: '3rem',
          backgroundImage: 'linear-gradient(135deg, rgba(255, 107, 0, 0.05) 0%, transparent 100%)',
          position: 'relative',
          overflow: 'hidden',
          background: '#ffffff'
        }}>
          <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.06 }}>
            <BookOpen size={200} style={{ color: 'var(--color-orange)' }} />
          </div>

          <span className="badge badge-yellow" style={{ marginBottom: '1rem', border: '2px solid var(--color-black)' }}>
            Ready to Learn
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.75rem', fontFamily: 'var(--font-family-heading)' }}>
            Welcome back, <span className="text-gradient-orange">{profile?.name}</span>!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '620px', fontSize: '0.95rem', fontWeight: 550, lineHeight: 1.6 }}>
            Pick up right where you left off. Access your recorded classes, lecture notes, downloadable resources, and take active test series quizzes.
          </p>
        </section>

        {/* Search & Filter Header */}
        <section style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-black)' }}>Your Enrolled Classes</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Select a class to resume study</p>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <input
              type="text"
              placeholder="Search classes..."
              className="form-input"
              style={{ paddingLeft: '2.75rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)'
            }} />
          </div>
        </section>

        {/* Courses List */}
        {filteredCourses.length === 0 ? (
          <div className="glass" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-black)', background: '#ffffff' }}>
            <BookOpen size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', display: 'inline-block' }} />
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.5rem' }}>No Courses Found</h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              {searchQuery ? 'Try adjusting your search criteria.' : 'Your academy has not added any courses yet.'}
            </p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {filteredCourses.map((course) => (
              <div key={course.id} className="glass glass-hover" style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '2px solid var(--color-black)',
                background: '#ffffff'
              }}>
                <div style={{
                  height: '170px',
                  background: course.thumbnail_url 
                    ? `url(${course.thumbnail_url}) center/cover no-repeat` 
                    : 'linear-gradient(135deg, #ffd6b3 0%, #ffebcc 100%)',
                  position: 'relative',
                  borderBottom: '2px solid var(--color-black)'
                }}>
                  <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-outline" style={{ textTransform: 'none', background: '#ffffff', border: '2px solid var(--color-black)' }}>
                      Active
                    </span>
                  </div>
                </div>

                <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.6rem' }}>{course.title}</h4>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '1.75rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description || 'Access comprehensive video lectures, resources, notes, and quiz sets for full preparation.'}
                    </p>
                  </div>

                  <Link href={`/inst/${slug}/courses/${course.id}`} className="btn btn-primary" style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}>
                    Access Classes
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
