import { SignIn } from '@clerk/nextjs';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SignInPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '2rem'
    }}>
      <div className="glass" style={{
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-neon)',
        border: '1px solid var(--border-light)'
      }}>
        <SignIn
          path={`/inst/${slug}/sign-in`}
          signUpUrl={`/inst/${slug}/sign-up`}
          forceRedirectUrl={`/inst/${slug}/dashboard?sync=true`}
        />
      </div>
    </div>
  );
}
