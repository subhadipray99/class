'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Play, FileText, CheckCircle, HelpCircle, 
  Download, ArrowRight, ArrowLeft, RefreshCw,
  Award, Check, X, FileBadge
} from 'lucide-react';

interface Lecture {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
}

interface Resource {
  id: string;
  title: string;
  file_url: string;
}

interface Quiz {
  id: string;
  title: string;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
}

interface LecturePlayerClientProps {
  slug: string;
  courseId: string;
  lecture: Lecture;
  otherLectures: Lecture[];
  resources: Resource[];
  quizzes: Quiz[];
  questions: Question[];
}

export default function LecturePlayerClient({
  slug,
  courseId,
  lecture,
  otherLectures,
  resources,
  quizzes,
  questions
}: LecturePlayerClientProps) {
  const [activeTab, setActiveTab] = useState<'resources' | 'quiz'>('resources');

  // Quiz States
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);

  // Helper to parse YouTube URLs to embed URL
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
    }
    return url; // Return direct source if not YouTube
  };

  const videoUrl = getEmbedUrl(lecture.video_url || '');
  const isYouTube = lecture.video_url && (lecture.video_url.includes('youtube.com') || lecture.video_url.includes('youtu.be'));

  const handleSelectAnswer = (optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIdx]: optionIndex
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_answer) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const handleRetryQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setReviewMode(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', flex: 1, padding: '2rem' }}>
      
      {/* Left Column: Player & Lecture info */}
      <div>
        {/* Video Frame container */}
        <div className="glass" style={{
          position: 'relative',
          paddingTop: '56.25%', /* 16:9 Aspect Ratio */
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-light)',
          background: '#000',
          boxShadow: 'var(--shadow-neon)'
        }}>
          {videoUrl ? (
            isYouTube ? (
              <iframe
                src={videoUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0
                }}
              />
            ) : (
              <video
                src={videoUrl}
                controls
                autoPlay
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            )
          ) : (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              color: 'var(--color-text-muted)'
            }}>
              <HelpCircle size={48} />
              <p>No video lecture uploaded for this session.</p>
            </div>
          )}
        </div>

        {/* Lecture Meta */}
        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-family-heading)' }}>
            {lecture.title}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {lecture.description || 'Watch the lecture video and use the sidebar tabs to download study files or solve attached quizzes.'}
          </p>
        </div>
      </div>

      {/* Right Column: Dynamic Tabs (Resources & Quiz) */}
      <div className="glass" style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'hidden'
      }}>
        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-light)',
          background: 'rgba(255,255,255,0.01)'
        }}>
          <button
            onClick={() => setActiveTab('resources')}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'resources' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'resources' ? '2px solid var(--color-primary)' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <FileText size={16} />
            Study Notes ({resources.length})
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'quiz' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'quiz' ? '2px solid var(--color-primary)' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Award size={16} />
            Quiz Series
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          
          {/* 1. Resources Tab */}
          {activeTab === 'resources' && (
            <div>
              {resources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
                  <FileBadge size={32} style={{ marginBottom: '0.5rem', display: 'inline-block' }} />
                  <p style={{ fontSize: '0.875rem' }}>No resource files attached to this session.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {resources.map((res) => (
                    <a
                      key={res.id}
                      href={res.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass glass-hover"
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <FileText size={18} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {res.title}
                        </span>
                      </div>
                      <div style={{
                        padding: '0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--color-text-primary)'
                      }}>
                        <Download size={14} />
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Sidebar Lecture Switcher */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', fontWeight: 600 }}>
                  Course Schedule
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {otherLectures.map((l, idx) => (
                    <Link
                      key={l.id}
                      href={`/inst/${slug}/courses/${courseId}/lectures/${l.id}`}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        background: l.id === lecture.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                        border: l.id === lecture.id ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent',
                        color: l.id === lecture.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Play size={10} style={{ fill: l.id === lecture.id ? 'var(--color-primary)' : 'none' }} />
                      <span style={{ fontWeight: l.id === lecture.id ? 600 : 400 }}>{idx + 1}. {l.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. Interactive Quiz Tab */}
          {activeTab === 'quiz' && (
            <div>
              {quizzes.length === 0 || questions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
                  <HelpCircle size={32} style={{ marginBottom: '0.5rem', display: 'inline-block' }} />
                  <p style={{ fontSize: '0.875rem' }}>No quizzes attached to this lecture.</p>
                </div>
              ) : !quizSubmitted ? (
                /* Quiz Taking Mode */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                      Question {currentQuestionIdx + 1} of {questions.length}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, marginBottom: '1.25rem' }}>
                    {questions[currentQuestionIdx].question_text}
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {questions[currentQuestionIdx].options.map((option, idx) => {
                      const isSelected = selectedAnswers[currentQuestionIdx] === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectAnswer(idx)}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-light)',
                            background: isSelected ? 'rgba(250, 204, 21, 0.08)' : 'rgba(255,255,255,0.01)',
                            color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: isSelected ? 600 : 400,
                            transition: 'var(--transition-fast)',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <button
                      className="btn btn-outline"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIdx === 0}
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                    >
                      Previous
                    </button>

                    {currentQuestionIdx < questions.length - 1 ? (
                      <button
                        className="btn btn-outline"
                        onClick={handleNextQuestion}
                        disabled={selectedAnswers[currentQuestionIdx] === undefined}
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(selectedAnswers).length < questions.length}
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                      >
                        Submit Test
                      </button>
                    )}
                  </div>
                </div>
              ) : !reviewMode ? (
                /* Score Summary Screen */
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    color: 'var(--color-success)',
                    marginBottom: '1rem'
                  }}>
                    <Award size={36} />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Test Completed</h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    You scored <strong style={{ color: 'var(--color-primary)' }}>{quizScore}</strong> out of <strong>{questions.length}</strong>.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button onClick={() => setReviewMode(true)} className="btn btn-secondary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}>
                      Review Answers
                    </button>
                    <button onClick={handleRetryQuiz} className="btn btn-outline" style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}>
                      <RefreshCw size={14} />
                      Retry Test
                    </button>
                  </div>
                </div>
              ) : (
                /* Review Answers Screen */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Answer Key Review</h4>
                    <button onClick={() => setReviewMode(false)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                      Back to Score
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {questions.map((q, qIdx) => {
                      const userAns = selectedAnswers[qIdx];
                      const isCorrect = userAns === q.correct_answer;
                      
                      return (
                        <div key={q.id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
                          <h5 style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4, marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>{qIdx + 1}.</span>
                            <span>{q.question_text}</span>
                          </h5>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {q.options.map((opt, oIdx) => {
                              const isCorrectOpt = oIdx === q.correct_answer;
                              const isUserOpt = oIdx === userAns;
                              
                              let border = '1px solid var(--border-light)';
                              let bg = 'rgba(255,255,255,0.01)';
                              let color = 'var(--color-text-primary)';
                              let icon = null;

                              if (isCorrectOpt) {
                                border = '1px solid var(--color-success)';
                                bg = 'rgba(16, 185, 129, 0.08)';
                                color = 'var(--color-success)';
                                icon = <Check size={12} style={{ marginLeft: 'auto' }} />;
                              } else if (isUserOpt && !isCorrect) {
                                border = '1px solid var(--color-danger)';
                                bg = 'rgba(239, 68, 68, 0.08)';
                                color = 'var(--color-danger)';
                                icon = <X size={12} style={{ marginLeft: 'auto' }} />;
                              }

                              return (
                                <div
                                  key={oIdx}
                                  style={{
                                    padding: '0.6rem 0.85rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border,
                                    background: bg,
                                    color,
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                  }}
                                >
                                  <div style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    border: '1px solid',
                                    borderColor: isCorrectOpt ? 'var(--color-success)' : isUserOpt ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    flexShrink: 0
                                  }}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </div>
                                  <span>{opt}</span>
                                  {icon}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
