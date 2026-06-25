'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { School, ArrowRight, Sparkles, Search, PlusCircle, Check } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  
  // Registration state
  const [instName, setInstName] = useState('');
  const [instSlug, setInstSlug] = useState('');
  const [instColor, setInstColor] = useState('#8b5cf6');
  const [registering, setRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');

  // Access state
  const [searchSlug, setSearchSlug] = useState('');
  const [searching, setSearching] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName || !instSlug) return;
    
    setRegistering(true);
    setRegError('');
    
    try {
      const res = await fetch('/api/institutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: instName,
          slug: instSlug.toLowerCase().trim().replace(/\s+/g, '-'),
          theme_color: instColor
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register institute');
      }

      setRegSuccess(true);
      setTimeout(() => {
        router.push(`/inst/${data.slug}`);
      }, 1500);
    } catch (err: any) {
      setRegError(err.message || 'An error occurred');
    } finally {
      setRegistering(false);
    }
  };

  const handleGoToInstitute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSlug) return;
    setSearching(true);
    router.push(`/inst/${searchSlug.toLowerCase().trim()}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative'
    }}>
      {/* Decorative Glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />

      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 1.25rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          color: '#c084fc',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          <Sparkles size={16} />
          Create Your PhysicsWallah Style App
        </div>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '1rem',
          fontFamily: 'var(--font-family-heading)'
        }}>
          Launch Your <span className="text-gradient-purple">Online Academy</span>
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          maxWidth: '540px',
          margin: '0 auto',
          fontSize: '1.125rem',
          lineHeight: 1.5
        }}>
          Give your educational institute its own custom portal with course managers, quizzes, student analytics, and a premium learning interface.
        </p>
      </header>

      <main style={{
        width: '100%',
        maxWidth: '850px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '2rem',
        zIndex: 1
      }}>
        {/* Register Box */}
        <section className="glass" style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'rgba(250, 204, 21, 0.15)',
                color: 'var(--color-primary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(250, 204, 21, 0.2)'
              }}>
                <PlusCircle size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Register Institute</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Create a separate workspace tenant</p>
              </div>
            </div>

            {regSuccess ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                color: 'var(--color-success)',
                margin: '2rem 0'
              }}>
                <div style={{ display: 'inline-flex', padding: '0.5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', marginBottom: '1rem' }}>
                  <Check size={32} />
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Institute Registered!</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Redirecting to your new domain space...</p>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Institute Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physics Champions"
                    className="form-input"
                    value={instName}
                    onChange={(e) => {
                      setInstName(e.target.value);
                      // Auto-fill slug
                      setInstSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URL Slug</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>/inst/</span>
                    <input
                      type="text"
                      required
                      placeholder="physics-champions"
                      className="form-input"
                      value={instSlug}
                      onChange={(e) => setInstSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Brand Color Accent</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      className="form-input"
                      style={{ width: '60px', padding: '2px', height: '40px', cursor: 'pointer' }}
                      value={instColor}
                      onChange={(e) => setInstColor(e.target.value)}
                    />
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Choose your brand identity</span>
                  </div>
                </div>

                {regError && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {regError}
                  </p>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={registering}>
                  {registering ? 'Creating...' : 'Launch Institute'}
                  <ArrowRight size={18} />
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Enter Existing Box */}
        <section className="glass" style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: 'var(--color-secondary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <School size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access Institute</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Enter an existing institute portal</p>
              </div>
            </div>

            <form onSubmit={handleGoToInstitute}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Institute Slug</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. physics-champions"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={searchSlug}
                    onChange={(e) => setSearchSlug(e.target.value)}
                  />
                  <Search size={18} style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)'
                  }} />
                </div>
              </div>

              <button type="submit" className="btn btn-outline" style={{ width: '100%' }} disabled={searching}>
                {searching ? 'Navigating...' : 'Enter Institute'}
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-light)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)'
          }}>
            <strong>Tip:</strong> Join as a student, teacher, or admin. Each institute operates on isolated student profiles, classes, and course materials.
          </div>
        </section>
      </main>
    </div>
  );
}
