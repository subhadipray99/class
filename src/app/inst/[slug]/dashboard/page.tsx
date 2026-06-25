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
      // Connect to Supabase using public client
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 size={40} className="text-gradient-purple" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', maxWidth: '450px' }}>
          <ShieldAlert size={48} style={{ color: 'var(--color-danger)', marginBottom: '1rem', display: 'inline-block' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Failed to Authenticate</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error}</p>
          <Link href={`/inst/${slug}`} className="btn btn-primary">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isAdminOrTeacher = profile?.role === 'admin' || profile?.role === 'teacher';

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
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            fontFamily: 'var(--font-family-heading)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <GraduationCap style={{ color: 'var(--color-primary)' }} />
            Study Portal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAdminOrTeacher && (
            <Link href={`/inst/${slug}/admin`} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              <Layout size={16} />
              Admin Panel
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '0.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{profile?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{profile?.role}</div>
            </div>
          </div>

          <SignOutButton redirectUrl={`/inst/${slug}`}>
            <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
              <LogOut size={16} />
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2.5rem 2rem', flex: 1 }}>
        
        {/* Welcome Section */}
        <section className="glass" style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2.5rem',
          backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }}>
            <BookOpen size={200} style={{ color: 'var(--color-primary)' }} />
          </div>

          <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>Ready to Learn</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-family-heading)' }}>
            Welcome back, <span className="text-gradient-purple">{profile?.name}</span>!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Pick up right where you left off. Access your recorded classes, lecture notes, downloadable resources, and take active test series quizzes.
          </p>
        </section>

        {/* Search & Filter Header */}
        <section style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Your Enrolled Classes</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Select a class to resume study</p>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <input
              type="text"
              placeholder="Search classes..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)'
            }} />
          </div>
        </section>

        {/* Courses List */}
        {filteredCourses.length === 0 ? (
          <div className="glass" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: 'var(--radius-lg)' }}>
            <BookOpen size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
            <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Courses Found</h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {searchQuery ? 'Try adjusting your search criteria.' : 'Your institute has not added any courses yet.'}
            </p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {filteredCourses.map((course) => (
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
                  <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-purple" style={{ textTransform: 'none', background: 'rgba(0,0,0,0.6)' }}>
                      Active course
                    </span>
                  </div>
                </div>

                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>{course.title}</h4>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.4, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description || 'Access comprehensive video lectures, resources, notes, and quiz sets for full preparation.'}
                    </p>
                  </div>

                  <Link href={`/inst/${slug}/courses/${course.id}`} className="btn btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.875rem' }}>
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
