import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. You must be logged in to create an institute.' },
        { status: 401 }
      );
    }

    const { name, slug, theme_color } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Format slug
    const formattedSlug = slug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Check if slug already exists
    const { data: existingInst, error: checkError } = await supabase
      .from('institutes')
      .select('id')
      .eq('slug', formattedSlug)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingInst) {
      return NextResponse.json(
        { error: 'An institute with this URL slug already exists. Please choose a different slug.' },
        { status: 400 }
      );
    }

    // Insert new institute
    const { data, error } = await supabase
      .from('institutes')
      .insert({
        name,
        slug: formattedSlug,
        theme_color: theme_color || '#8b5cf6',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
