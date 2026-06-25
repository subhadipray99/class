'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { School, ArrowRight, Sparkles, Search, PlusCircle, Check } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  
  // Registration state
  const [instName, setInstName] = useState('');
  const [instSlug, setInstSlug] = useState('');
  const [instColor, setInstColor] = useState('#ff6b00');
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
      padding: '3rem 1.5rem',
      position: 'relative'
    }}>
      {/* Decorative Glows */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255, 107, 0, 0.05) 0%, transparent 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />

      <header style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.5rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 107, 0, 0.08)',
          border: '2px solid var(--color-black)',
          color: 'var(--color-orange)',
          fontSize: '0.85rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '1.5rem'
        }}>
          <Sparkles size={14} />
          High-Fidelity LMS Creator
        </div>
        <h1 style={{
          fontSize: '3.75rem',
          fontWeight: 800,
          lineHeight: 1.05,
          marginBottom: '1rem',
          fontFamily: 'var(--font-family-heading)',
          color: 'var(--color-black)'
        }}>
          Launch Your <span className="text-gradient-orange">Online Academy</span>
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          maxWidth: '560px',
          margin: '0 auto',
          fontSize: '1.125rem',
          fontWeight: 500,
          lineHeight: 1.5
        }}>
          Deploy your educational institute portal with responsive class planners, smart MCQs, resources, and student managers.
        </p>
      </header>

      <main style={{
        width: '100%',
        maxWidth: '900px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2.5rem',
        zIndex: 1
      }}>
        {/* Register Box */}
        <section className="glass" style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--color-black)',
          boxShadow: '0 8px 0 var(--color-black)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{
                background: 'var(--color-yellow)',
                color: 'var(--color-black)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--color-black)',
                boxShadow: '2px 2px 0 var(--color-black)'
              }}>
                <PlusCircle size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-black)' }}>Register Academy</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Create an isolated student portal</p>
              </div>
            </div>

            {regSuccess ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '2px solid var(--color-black)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--color-success)',
                margin: '2rem 0',
                boxShadow: '4px 4px 0 var(--color-black)'
              }}>
                <div style={{ display: 'inline-flex', padding: '0.5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '2px solid var(--color-black)', marginBottom: '1.25rem' }}>
                  <Check size={28} style={{ color: 'var(--color-black)' }} />
                </div>
                <h3 style={{ fontWeight: 800, color: 'var(--color-black)', marginBottom: '0.5rem' }}>Academy Registered!</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Redirecting to your sub-domain URL...</p>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Academy Name</label>
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
                  <label className="form-label">URL Space</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>/inst/</span>
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
                      style={{ width: '70px', padding: '3px', height: '42px', cursor: 'pointer' }}
                      value={instColor}
                      onChange={(e) => setInstColor(e.target.value)}
                    />
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Choose your academy brand identity</span>
                  </div>
                </div>

                {regError && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                    {regError}
                  </p>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={registering}>
                  {registering ? 'Creating...' : 'Launch Academy'}
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
          border: '2px solid var(--color-black)',
          boxShadow: '0 8px 0 var(--color-black)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{
                background: 'var(--color-blue)',
                color: '#ffffff',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--color-black)',
                boxShadow: '2px 2px 0 var(--color-black)'
              }}>
                <School size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-black)' }}>Access Academy</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Enter your active educational portal</p>
              </div>
            </div>

            <form onSubmit={handleGoToInstitute}>
              <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                <label className="form-label">Academy URL Slug</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. physics-champions"
                    className="form-input"
                    style={{ paddingLeft: '2.75rem' }}
                    value={searchSlug}
                    onChange={(e) => setSearchSlug(e.target.value)}
                  />
                  <Search size={18} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)'
                  }} />
                </div>
              </div>

              <button type="submit" className="btn btn-outline" style={{ width: '100%' }} disabled={searching}>
                {searching ? 'Navigating...' : 'Enter Academy'}
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-base)',
            border: '2px solid var(--color-black)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)'
          }}>
            <strong>Notice:</strong> Students signup inside their corresponding institute URL. Records and courses are secure and isolated per tenant.
          </div>
        </section>
      </main>
    </div>
  );
}
