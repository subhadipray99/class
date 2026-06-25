'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Users, BookOpen, PlayCircle, Award, 
  Settings, Layout, ArrowLeft, Loader2, 
  Plus, Trash2, CheckCircle2, ShieldX, 
  ChevronRight, Save, PlusCircle, FileText,
  Eye, EyeOff
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

interface Lecture {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
}

interface Resource {
  id: string;
  lecture_id: string;
  title: string;
  file_url: string;
}

interface Quiz {
  id: string;
  lecture_id: string;
  title: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function AdminDashboard({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'lectures' | 'users'>('overview');

  // Database Data States
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Selection states for hierarchies
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');

  // Course Form States
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseThumb, setNewCourseThumb] = useState('');
  const [courseActionLoading, setCourseActionLoading] = useState(false);

  // Lecture Form States
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureDesc, setNewLectureDesc] = useState('');
  const [newLectureVideo, setNewLectureVideo] = useState('');
  const [lectureActionLoading, setLectureActionLoading] = useState(false);

  // Resource Form States
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [resourceActionLoading, setResourceActionLoading] = useState(false);

  // Quiz Form States
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [quizActionLoading, setQuizActionLoading] = useState(false);

  // Question Form States
  const [newQText, setNewQText] = useState('');
  const [newQOpts, setNewQOpts] = useState(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [questionActionLoading, setQuestionActionLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  // 1. Authorize User
  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkAuthorization = async () => {
      try {
        const token = await (await fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instituteSlug: slug })
        })).json();
        
        if (token && (token.role === 'admin' || token.role === 'teacher')) {
          setProfile(token);
          setAuthorized(true);
          // Initial Data Fetch
          fetchAdminData(token.institute_id);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        console.error(err);
        setAuthorized(false);
      } finally {
        setLoadingAuth(false);
      }
    };

    checkAuthorization();
  }, [user, isLoaded, slug]);

  const fetchAdminData = async (instId: string) => {
    try {
      const db = getSupabaseClient();
      
      // Fetch Courses
      const { data: cData } = await db.from('courses').select('*').eq('institute_id', instId).order('created_at', { ascending: false });
      setCourses(cData || []);

      // Fetch Profiles/Users
      const { data: pData } = await db.from('profiles').select('*').eq('institute_id', instId).order('created_at', { ascending: false });
      setProfiles(pData || []);

      if (cData && cData.length > 0) {
        setSelectedCourseId(cData[0].id);
        fetchLectures(cData[0].id);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const fetchLectures = async (courseId: string) => {
    if (!courseId) return;
    try {
      const db = getSupabaseClient();
      const { data } = await db.from('lectures').select('*').eq('course_id', courseId).order('order_index', { ascending: true });
      setLectures(data || []);
      if (data && data.length > 0) {
        setSelectedLectureId(data[0].id);
        fetchLectureDetails(data[0].id);
      } else {
        setSelectedLectureId('');
        setResources([]);
        setQuizzes([]);
        setQuizQuestions([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLectureDetails = async (lectureId: string) => {
    if (!lectureId) return;
    try {
      const db = getSupabaseClient();
      
      // Fetch Resources
      const { data: rData } = await db.from('resources').select('*').eq('lecture_id', lectureId);
      setResources(rData || []);

      // Fetch Quizzes
      const { data: qData } = await db.from('quizzes').select('*').eq('lecture_id', lectureId);
      setQuizzes(qData || []);

      if (qData && qData.length > 0) {
        // Fetch Questions for first quiz
        const { data: qnsData } = await db.from('quiz_questions').select('*').eq('quiz_id', qData[0].id).order('created_at', { ascending: true });
        setQuizQuestions(qnsData || []);
      } else {
        setQuizQuestions([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Form Submissions
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newCourseTitle) return;
    setCourseActionLoading(true);

    try {
      const db = getSupabaseClient();
      const { data, error } = await db.from('courses').insert({
        title: newCourseTitle,
        description: newCourseDesc,
        thumbnail_url: newCourseThumb,
        institute_id: profile.institute_id,
        is_published: false
      }).select().single();

      if (error) throw error;

      setCourses([data, ...courses]);
      setNewCourseTitle('');
      setNewCourseDesc('');
      setNewCourseThumb('');
      if (!selectedCourseId) {
        setSelectedCourseId(data.id);
        fetchLectures(data.id);
      }
    } catch (err: any) {
      alert(err.message || 'Error adding course');
    } finally {
      setCourseActionLoading(false);
    }
  };

  const togglePublishCourse = async (course: Course) => {
    try {
      const db = getSupabaseClient();
      const { error } = await db.from('courses').update({
        is_published: !course.is_published
      }).eq('id', course.id);

      if (error) throw error;

      setCourses(courses.map(c => c.id === course.id ? { ...c, is_published: !c.is_published } : c));
    } catch (err: any) {
      alert(err.message || 'Error updating course status');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course and all its lectures/quizzes?')) return;
    try {
      const db = getSupabaseClient();
      const { error } = await db.from('courses').delete().eq('id', id);
      if (error) throw error;

      setCourses(courses.filter(c => c.id !== id));
      if (selectedCourseId === id) {
        setSelectedCourseId('');
        setLectures([]);
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting course');
    }
  };

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newLectureTitle) return;
    setLectureActionLoading(true);

    try {
      const db = getSupabaseClient();
      const { data, error } = await db.from('lectures').insert({
        title: newLectureTitle,
        description: newLectureDesc,
        video_url: newLectureVideo,
        course_id: selectedCourseId,
        order_index: lectures.length + 1
      }).select().single();

      if (error) throw error;

      setLectures([...lectures, data]);
      setNewLectureTitle('');
      setNewLectureDesc('');
      setNewLectureVideo('');
      if (!selectedLectureId) {
        setSelectedLectureId(data.id);
        fetchLectureDetails(data.id);
      }
    } catch (err: any) {
      alert(err.message || 'Error adding lecture');
    } finally {
      setLectureActionLoading(false);
    }
  };

  const handleDeleteLecture = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;
    try {
      const db = getSupabaseClient();
      const { error } = await db.from('lectures').delete().eq('id', id);
      if (error) throw error;

      setLectures(lectures.filter(l => l.id !== id));
      if (selectedLectureId === id) {
        setSelectedLectureId('');
        setResources([]);
        setQuizzes([]);
        setQuizQuestions([]);
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting lecture');
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLectureId || !newResourceTitle || !newResourceUrl) return;
    setResourceActionLoading(true);

    try {
      const db = getSupabaseClient();
      const { data, error } = await db.from('resources').insert({
        title: newResourceTitle,
        file_url: newResourceUrl,
        lecture_id: selectedLectureId
      }).select().single();

      if (error) throw error;

      setResources([...resources, data]);
      setNewResourceTitle('');
      setNewResourceUrl('');
    } catch (err: any) {
      alert(err.message || 'Error adding resource');
    } finally {
      setResourceActionLoading(false);
    }
  };

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLectureId || !newQuizTitle) return;
    setQuizActionLoading(true);

    try {
      const db = getSupabaseClient();
      const { data, error } = await db.from('quizzes').insert({
        title: newQuizTitle,
        lecture_id: selectedLectureId
      }).select().single();

      if (error) throw error;

      setQuizzes([...quizzes, data]);
      setNewQuizTitle('');
    } catch (err: any) {
      alert(err.message || 'Error adding quiz');
    } finally {
      setQuizActionLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quizzes.length === 0 || !newQText) return;
    setQuestionActionLoading(true);

    try {
      const db = getSupabaseClient();
      const { data, error } = await db.from('quiz_questions').insert({
        quiz_id: quizzes[0].id,
        question_text: newQText,
        options: newQOpts,
        correct_answer: newQCorrect
      }).select().single();

      if (error) throw error;

      setQuizQuestions([...quizQuestions, data]);
      setNewQText('');
      setNewQOpts(['', '', '', '']);
      setNewQCorrect(0);
    } catch (err: any) {
      alert(err.message || 'Error adding question');
    } finally {
      setQuestionActionLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'teacher' | 'student') => {
    try {
      const db = getSupabaseClient();
      const { error } = await db.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;

      setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p));
    } catch (err: any) {
      alert(err.message || 'Error changing role');
    }
  };

  if (!isLoaded || loadingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 size={40} className="text-gradient-purple" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Verifying admin authorization...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', maxWidth: '420px' }}>
          <ShieldX size={48} style={{ color: 'var(--color-danger)', marginBottom: '1rem', display: 'inline-block' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            You do not have administrative permissions to view the panel of this institute.
          </p>
          <Link href={`/inst/${slug}/dashboard`} className="btn btn-primary">
            Back to Student Portal
          </Link>
        </div>
      </div>
    );
  }

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
          <Link href={`/inst/${slug}/dashboard`} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-light)'
          }}>
            <ArrowLeft size={14} />
          </Link>
          <span style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} style={{ color: 'var(--color-primary)' }} />
            Admin Panel
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.75rem', background: 'rgba(250,204,21,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(250,204,21,0.2)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
            Institute Owner Space
          </span>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{profile?.name}</div>
        </div>
      </header>

      {/* Main Panel Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', flex: 1 }}>
        
        {/* Sidebar Nav */}
        <aside className="glass" style={{ borderRight: '1px solid var(--border-light)', padding: '1.5rem 1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === 'overview' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'overview' ? 600 : 400
              }}
            >
              <Layout size={16} />
              Academy Overview
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === 'courses' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: activeTab === 'courses' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'courses' ? 600 : 400
              }}
            >
              <BookOpen size={16} />
              Manage Courses ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab('lectures')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === 'lectures' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: activeTab === 'lectures' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'lectures' ? 600 : 400
              }}
            >
              <PlayCircle size={16} />
              Course Syllabus
            </button>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === 'users' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: activeTab === 'users' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'users' ? 600 : 400
              }}
            >
              <Users size={16} />
              Manage Users ({profiles.length})
            </button>
          </div>
        </aside>

        {/* Tab Body Panel */}
        <main style={{ padding: '2.5rem', overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-family-heading)' }}>
                Welcome back to your dashboard!
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
                Quick metrics for your educational institute
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                  <Users size={24} style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Students</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{profiles.filter(p => p.role === 'student').length}</div>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                  <BookOpen size={24} style={{ color: 'var(--color-secondary)', marginBottom: '0.75rem' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Courses Created</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{courses.length}</div>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                  <Users size={24} style={{ color: 'var(--color-success)', marginBottom: '0.75rem' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Faculty / Teachers</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{profiles.filter(p => p.role === 'teacher' || p.role === 'admin').length}</div>
                </div>
              </div>

              <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Syllabus Coverage</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Manage and structure your curriculum. Add lectures, study notes, assignments, and test series quizzes inside the **Course Syllabus** tab. Let students prepare dynamically!
                </p>
                <button onClick={() => setActiveTab('lectures')} className="btn btn-primary">
                  Go to Syllabus Builder
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE COURSES */}
          {activeTab === 'courses' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
                
                {/* Courses List */}
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Academy Course Catalog</h3>
                  
                  {courses.length === 0 ? (
                    <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No courses added yet. Fill the registration form to create one.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {courses.map(course => (
                        <div key={course.id} className="glass" style={{
                          padding: '1.25rem',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1.5rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '90px',
                              height: '56px',
                              borderRadius: 'var(--radius-sm)',
                              background: course.thumbnail_url 
                                ? `url(${course.thumbnail_url}) center/cover no-repeat` 
                                : 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
                              border: '1px solid var(--border-light)'
                            }} />
                            <div>
                              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{course.title}</h4>
                              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {course.description || 'No description provided.'}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                              onClick={() => togglePublishCourse(course)}
                              className={`btn ${course.is_published ? 'btn-outline' : 'btn-primary'}`}
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              {course.is_published ? <EyeOff size={12} /> : <Eye size={12} />}
                              {course.is_published ? 'Unpublish' : 'Publish'}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="btn btn-outline"
                              style={{ padding: '0.4rem', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Course Form */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PlusCircle size={18} style={{ color: 'var(--color-primary)' }} />
                    Add New Course
                  </h4>
                  <form onSubmit={handleAddCourse}>
                    <div className="form-group">
                      <label className="form-label">Course Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Class 11 Physics Full Batch"
                        className="form-input"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        rows={3}
                        placeholder="Detail the course syllabus..."
                        className="form-input"
                        value={newCourseDesc}
                        onChange={(e) => setNewCourseDesc(e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Thumbnail URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        className="form-input"
                        value={newCourseThumb}
                        onChange={(e) => setNewCourseThumb(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={courseActionLoading}>
                      {courseActionLoading ? 'Saving...' : 'Create Course'}
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: MANAGE LECTURES & SYLLABUS */}
          {activeTab === 'lectures' && (
            <div>
              {/* Select Course dropdown */}
              <div className="glass" style={{ padding: '1.25rem 2rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Select Course:</span>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    fetchLectures(e.target.value);
                  }}
                  className="form-input"
                  style={{ maxWidth: '320px', padding: '0.5rem' }}
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {selectedCourseId ? (
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
                  
                  {/* Lectures List Column */}
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Course Lectures</h4>
                    
                    {lectures.length === 0 ? (
                      <div className="glass" style={{ padding: '2rem 1rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>No lectures added yet.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {lectures.map((lecture, idx) => (
                          <button
                            key={lecture.id}
                            onClick={() => {
                              setSelectedLectureId(lecture.id);
                              fetchLectureDetails(lecture.id);
                            }}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              background: selectedLectureId === lecture.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.01)',
                              border: '1px solid',
                              borderColor: selectedLectureId === lecture.id ? 'var(--color-secondary)' : 'var(--border-light)',
                              color: selectedLectureId === lecture.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%'
                            }}
                          >
                            <span style={{ fontSize: '0.85rem', fontWeight: selectedLectureId === lecture.id ? 600 : 400, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginRight: '0.5rem' }}>
                              {idx + 1}. {lecture.title}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLecture(lecture.id);
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', opacity: 0.8 }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Add Lecture Form */}
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', marginTop: '1.5rem' }}>
                      <h5 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Add Lecture</h5>
                      <form onSubmit={handleAddLecture}>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <input
                            type="text"
                            required
                            placeholder="Lecture Title"
                            className="form-input"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            value={newLectureTitle}
                            onChange={(e) => setNewLectureTitle(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <input
                            type="text"
                            placeholder="Video Link (YouTube/MP4)"
                            className="form-input"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            value={newLectureVideo}
                            onChange={(e) => setNewLectureVideo(e.target.value)}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} disabled={lectureActionLoading}>
                          {lectureActionLoading ? 'Saving...' : 'Add Lecture'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Lecture Details Column: Resources & Quizzes */}
                  <div>
                    {selectedLectureId ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        
                        {/* Resources Box */}
                        <div>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={18} style={{ color: 'var(--color-secondary)' }} />
                            Lecture Materials
                          </h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {resources.length === 0 ? (
                              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>No download materials attached.</p>
                            ) : (
                              resources.map(res => (
                                <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{res.title}</span>
                                  <button
                                    onClick={async () => {
                                      const db = getSupabaseClient();
                                      await db.from('resources').delete().eq('id', res.id);
                                      setResources(resources.filter(r => r.id !== res.id));
                                    }}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          <form onSubmit={handleAddResource} className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Attach File</h5>
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                              <input
                                type="text"
                                required
                                placeholder="File Name (e.g. Physics Ch-1 Notes)"
                                className="form-input"
                                style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                                value={newResourceTitle}
                                onChange={(e) => setNewResourceTitle(e.target.value)}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                              <input
                                type="text"
                                required
                                placeholder="File Download URL"
                                className="form-input"
                                style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                                value={newResourceUrl}
                                onChange={(e) => setNewResourceUrl(e.target.value)}
                              />
                            </div>
                            <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }} disabled={resourceActionLoading}>
                              {resourceActionLoading ? 'Attaching...' : 'Add Material'}
                            </button>
                          </form>
                        </div>

                        {/* Quiz Builder Box */}
                        <div>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award size={18} style={{ color: 'var(--color-primary)' }} />
                            Class Quiz Builder
                          </h4>

                          {quizzes.length === 0 ? (
                            /* Add Quiz Form */
                            <form onSubmit={handleAddQuiz} className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                                Build an interactive test series check for this lecture session.
                              </p>
                              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                <input
                                  type="text"
                                  required
                                  placeholder="Quiz Title (e.g. Checkpoint 1.1)"
                                  className="form-input"
                                  value={newQuizTitle}
                                  onChange={(e) => setNewQuizTitle(e.target.value)}
                                />
                              </div>
                              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem' }} disabled={quizActionLoading}>
                                {quizActionLoading ? 'Creating...' : 'Initialize Quiz'}
                              </button>
                            </form>
                          ) : (
                            /* Quiz Questions List & Form */
                            <div>
                              <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>{quizzes[0].title}</span>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Delete this quiz?')) return;
                                    const db = getSupabaseClient();
                                    await db.from('quizzes').delete().eq('id', quizzes[0].id);
                                    setQuizzes([]);
                                    setQuizQuestions([]);
                                  }}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>

                              {/* Question List */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                                {quizQuestions.length === 0 ? (
                                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>No questions built yet.</p>
                                ) : (
                                  quizQuestions.map((q, idx) => (
                                    <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifySelf: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{idx + 1}. {q.question_text}</span>
                                      <button
                                        onClick={async () => {
                                          const db = getSupabaseClient();
                                          await db.from('quiz_questions').delete().eq('id', q.id);
                                          setQuizQuestions(quizQuestions.filter(qn => qn.id !== q.id));
                                        }}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Add Question Form */}
                              <form onSubmit={handleAddQuestion} className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                <h5 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Add MCQ Question</h5>
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Question Text"
                                    className="form-input"
                                    style={{ padding: '0.35rem', fontSize: '0.75rem' }}
                                    value={newQText}
                                    onChange={(e) => setNewQText(e.target.value)}
                                  />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                  {newQOpts.map((opt, optIdx) => (
                                    <input
                                      key={optIdx}
                                      type="text"
                                      required
                                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                      className="form-input"
                                      style={{ padding: '0.35rem', fontSize: '0.75rem' }}
                                      value={opt}
                                      onChange={(e) => {
                                        const copy = [...newQOpts];
                                        copy[optIdx] = e.target.value;
                                        setNewQOpts(copy);
                                      }}
                                    />
                                  ))}
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Correct Option:</label>
                                  <select
                                    value={newQCorrect}
                                    onChange={(e) => setNewQCorrect(parseInt(e.target.value))}
                                    className="form-input"
                                    style={{ padding: '0.2rem', fontSize: '0.7rem', width: '60px' }}
                                  >
                                    <option value={0}>A</option>
                                    <option value={1}>B</option>
                                    <option value={2}>C</option>
                                    <option value={3}>D</option>
                                  </select>
                                </div>
                                <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }} disabled={questionActionLoading}>
                                  {questionActionLoading ? 'Saving...' : 'Save Question'}
                                </button>
                              </form>
                            </div>
                          )}
                        </div>

                      </div>
                    ) : (
                      <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Select a lecture from the left sidebar to edit resource sheets and tests.</p>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Please select a course to build its dynamic syllabus.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MANAGE USERS */}
          {activeTab === 'users' && (
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Educational Institute Directory</h3>
              
              <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Email Address</th>
                      <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Status Role</th>
                      <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Modify permissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.875rem' }}>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{p.email}</td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${p.role === 'admin' ? 'badge-gold' : p.role === 'teacher' ? 'badge-purple' : 'badge-outline'}`} style={{ textTransform: 'capitalize' }}>
                            {p.role}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {profile?.id !== p.id ? (
                            <select
                              value={p.role}
                              onChange={(e) => handleChangeRole(p.id, e.target.value as any)}
                              className="form-input"
                              style={{ padding: '0.25rem', fontSize: '0.75rem', width: '110px' }}
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Self (No change)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}
