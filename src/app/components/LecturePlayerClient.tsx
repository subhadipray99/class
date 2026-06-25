'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Play, FileText, HelpCircle, 
  Download, RefreshCw,
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

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
    }
    return url;
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 370px', gap: '2.5rem', flex: 1, padding: '2.5rem', background: 'var(--bg-base)' }}>
      
      {/* Left Column: Player & Lecture info */}
      <div>
        {/* Video Frame container */}
        <div className="glass" style={{
          position: 'relative',
          paddingTop: '56.25%', /* 16:9 Aspect Ratio */
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '2px solid var(--color-black)',
          background: '#000',
          boxShadow: '4px 4px 0 var(--color-black)'
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
              <p style={{ fontWeight: 600 }}>No video lecture uploaded for this session.</p>
            </div>
          )}
        </div>

        {/* Lecture Meta */}
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.75rem', fontFamily: 'var(--font-family-heading)' }}>
            {lecture.title}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.975rem', fontWeight: 500, lineHeight: 1.6 }}>
            {lecture.description || 'Watch the lecture video and use the sidebar tabs to download study files or solve attached quizzes.'}
          </p>
        </div>
      </div>

      {/* Right Column: Dynamic Tabs (Resources & Quiz) */}
      <div className="glass" style={{
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--color-black)',
        boxShadow: '4px 4px 0 var(--color-black)',
        display: 'flex',
        flexDirection: 'column',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'hidden',
        background: '#ffffff'
      }}>
        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--color-black)',
          background: 'var(--bg-base)'
        }}>
          <button
            onClick={() => setActiveTab('resources')}
            style={{
              flex: 1,
              padding: '1.25rem 1rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'resources' ? 'var(--color-orange)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'resources' ? '3px solid var(--color-orange)' : 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <FileText size={15} />
            Materials
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            style={{
              flex: 1,
              padding: '1.25rem 1rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'quiz' ? 'var(--color-orange)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'quiz' ? '3px solid var(--color-orange)' : 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Award size={15} />
            Quiz Series
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          
          {/* 1. Resources Tab */}
          {activeTab === 'resources' && (
            <div>
              {resources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                  <FileBadge size={32} style={{ marginBottom: '0.75rem', display: 'inline-block' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No study files attached to this session.</p>
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
                        border: '2px solid var(--color-black)',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <FileText size={18} style={{ color: 'var(--color-orange)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {res.title}
                        </span>
                      </div>
                      <div style={{
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-base)',
                        border: '2px solid var(--color-black)',
                        color: 'var(--color-black)'
                      }}>
                        <Download size={12} />
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Sidebar Lecture Switcher */}
              <div style={{ marginTop: '2.5rem', borderTop: '2px solid var(--color-black)', paddingTop: '2rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-black)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem', fontWeight: 800 }}>
                  Course Schedule
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {otherLectures.map((l, idx) => (
                    <Link
                      key={l.id}
                      href={`/inst/${slug}/courses/${courseId}/lectures/${l.id}`}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        background: l.id === lecture.id ? 'var(--color-yellow)' : 'transparent',
                        border: l.id === lecture.id ? '2px solid var(--color-black)' : '1px solid transparent',
                        color: 'var(--color-black)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Play size={10} style={{ fill: l.id === lecture.id ? 'var(--color-black)' : 'none', color: 'var(--color-black)' }} />
                      <span style={{ fontWeight: l.id === lecture.id ? 800 : 500 }}>{idx + 1}. {l.title}</span>
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
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                  <HelpCircle size={32} style={{ marginBottom: '0.75rem', display: 'inline-block' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No quizzes attached to this lecture.</p>
                </div>
              ) : !quizSubmitted ? (
                /* Quiz Taking Mode */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span className="badge badge-outline" style={{ fontSize: '0.7rem', border: '2px solid var(--color-black)' }}>
                      Question {currentQuestionIdx + 1} of {questions.length}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-black)', lineHeight: 1.4, marginBottom: '1.5rem' }}>
                    {questions[currentQuestionIdx].question_text}
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
                    {questions[currentQuestionIdx].options.map((option, idx) => {
                      const isSelected = selectedAnswers[currentQuestionIdx] === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectAnswer(idx)}
                          style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '2px solid var(--color-black)',
                            background: isSelected ? 'var(--color-yellow)' : '#ffffff',
                            color: 'var(--color-black)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: isSelected ? 800 : 500,
                            boxShadow: isSelected ? '2px 2px 0 var(--color-black)' : 'none',
                            transition: 'var(--transition-fast)',
                            display: 'flex',
                            gap: '0.85rem',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            border: '2px solid var(--color-black)',
                            background: isSelected ? '#ffffff' : 'var(--bg-base)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800,
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
                      style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem' }}
                    >
                      Previous
                    </button>

                    {currentQuestionIdx < questions.length - 1 ? (
                      <button
                        className="btn btn-outline"
                        onClick={handleNextQuestion}
                        disabled={selectedAnswers[currentQuestionIdx] === undefined}
                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem' }}
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(selectedAnswers).length < questions.length}
                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem' }}
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              ) : !reviewMode ? (
                /* Score Summary Screen */
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--color-yellow)',
                    border: '2px solid var(--color-black)',
                    boxShadow: '4px 4px 0 var(--color-black)',
                    color: 'var(--color-black)',
                    marginBottom: '1.5rem'
                  }}>
                    <Award size={36} />
                  </div>
                  <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.5rem' }}>Test Completed</h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 550, marginBottom: '2rem' }}>
                    You scored <strong style={{ color: 'var(--color-orange)', fontSize: '1.1rem' }}>{quizScore}</strong> out of <strong>{questions.length}</strong> correct.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <button onClick={() => setReviewMode(true)} className="btn btn-secondary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }}>
                      Review Answers
                    </button>
                    <button onClick={handleRetryQuiz} className="btn btn-outline" style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }}>
                      <RefreshCw size={12} />
                      Retry Test
                    </button>
                  </div>
                </div>
              ) : (
                /* Review Answers Screen */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-black)' }}>Answer Key</h4>
                    <button onClick={() => setReviewMode(false)} className="btn btn-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                      Back to Score
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {questions.map((q, qIdx) => {
                      const userAns = selectedAnswers[qIdx];
                      const isCorrect = userAns === q.correct_answer;
                      
                      return (
                        <div key={q.id} style={{ borderBottom: '2px solid var(--border-light)', paddingBottom: '1.5rem' }}>
                          <h5 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-black)', lineHeight: 1.4, marginBottom: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>{qIdx + 1}.</span>
                            <span>{q.question_text}</span>
                          </h5>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {q.options.map((opt, oIdx) => {
                              const isCorrectOpt = oIdx === q.correct_answer;
                              const isUserOpt = oIdx === userAns;
                              
                              let border = '2px solid var(--color-black)';
                              let bg = '#ffffff';
                              let color = 'var(--color-black)';
                              let icon = null;

                              if (isCorrectOpt) {
                                border = '2px solid var(--color-success)';
                                bg = 'rgba(16, 185, 129, 0.08)';
                                color = 'var(--color-success)';
                                icon = <Check size={12} style={{ marginLeft: 'auto', strokeWidth: 3 }} />;
                              } else if (isUserOpt && !isCorrect) {
                                border = '2px solid var(--color-danger)';
                                bg = 'rgba(239, 68, 68, 0.08)';
                                color = 'var(--color-danger)';
                                icon = <X size={12} style={{ marginLeft: 'auto', strokeWidth: 3 }} />;
                              }

                              return (
                                <div
                                  key={oIdx}
                                  style={{
                                    padding: '0.7rem 0.85rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border,
                                    background: bg,
                                    color,
                                    fontWeight: (isCorrectOpt || isUserOpt) ? 700 : 500,
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                  }}
                                >
                                  <div style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    border: '2px solid',
                                    borderColor: isCorrectOpt ? 'var(--color-success)' : isUserOpt ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                    background: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
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
