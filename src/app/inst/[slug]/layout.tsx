import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function InstituteLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  // Fetch the institute details by slug
  const { data: institute, error } = await supabase
    .from('institutes')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !institute) {
    return notFound();
  }

  // Inject dynamic primary theme color from database
  const themeStyle = {
    '--color-primary': institute.theme_color || '#8b5cf6',
  } as React.CSSProperties;

  return (
    <div style={themeStyle} className="min-h-screen">
      {children}
    </div>
  );
}
