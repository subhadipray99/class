import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authSession = await auth();
    const { userId } = authSession;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User details not found' }, { status: 404 });
    }

    const { instituteSlug, requestedRole } = await request.json();
    if (!instituteSlug) {
      return NextResponse.json({ error: 'Institute slug is required' }, { status: 400 });
    }

    // Connect to Supabase using Clerk JWT token
    const token = await authSession.getToken({ template: 'supabase' });
    const supabaseClient = getSupabaseClient(token);

    // 1. Resolve the Institute ID
    const { data: inst, error: instErr } = await supabaseClient
      .from('institutes')
      .select('id')
      .eq('slug', instituteSlug)
      .maybeSingle();

    if (instErr) {
      return NextResponse.json({ error: instErr.message }, { status: 500 });
    }

    if (!inst) {
      return NextResponse.json({ error: 'Institute not found' }, { status: 404 });
    }

    // 2. Fetch user details
    const email = user.emailAddresses[0]?.emailAddress;
    const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || 'User';

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // 3. Check if a profile already exists
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(existingProfile);
    }

    // 4. Determine user role
    // If they are the first user for this institute, make them 'admin' by default. Otherwise, student (or requested role).
    let finalRole = requestedRole || 'student';
    
    const { count } = await supabaseClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('institute_id', inst.id);

    if (count === 0) {
      finalRole = 'admin'; // First user to join/register the institute becomes the owner/admin
    }

    // 5. Create Profile in Supabase
    const { data: newProfile, error: profileErr } = await supabaseClient
      .from('profiles')
      .insert({
        id: userId,
        email,
        name,
        role: finalRole,
        institute_id: inst.id,
      })
      .select()
      .single();

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json(newProfile);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
