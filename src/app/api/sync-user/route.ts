import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authSession = await auth();
    const { userId } = authSession;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. No Clerk user session found.' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Clerk user details not found.' }, { status: 404 });
    }

    const { instituteSlug, requestedRole } = await request.json();
    if (!instituteSlug) {
      return NextResponse.json({ error: 'Institute slug is required' }, { status: 400 });
    }

    // Connect to Supabase.
    // Try to get the Clerk-Supabase integration token. If it fails or template is not set up,
    // fallback to null and let the client use standard server-side keys.
    let token: string | null = null;
    try {
      token = await authSession.getToken({ template: 'supabase' });
    } catch (tokenErr: any) {
      console.warn('Clerk getToken with supabase template failed. Ensure JWT Template is created in Clerk Dashboard:', tokenErr.message);
    }

    // Initialize Supabase.
    // In server environment, getSupabaseClient will check if the service role key is present.
    const supabaseClient = getSupabaseClient(token);

    // 1. Resolve the Institute ID
    const { data: inst, error: instErr } = await supabaseClient
      .from('institutes')
      .select('id')
      .eq('slug', instituteSlug)
      .maybeSingle();

    if (instErr) {
      console.error('Supabase query error (institutes):', instErr);
      return NextResponse.json({ 
        error: `Supabase Error: ${instErr.message}. Code: ${instErr.code}. Details: ${instErr.details || 'Check if schema.sql was run and API keys are correct.'}` 
      }, { status: 500 });
    }

    if (!inst) {
      return NextResponse.json({ error: `Institute with slug "${instituteSlug}" was not found in the database.` }, { status: 404 });
    }

    // 2. Fetch user details
    const email = user.emailAddresses[0]?.emailAddress;
    const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || 'User';

    if (!email) {
      return NextResponse.json({ error: 'User email address is missing in Clerk.' }, { status: 400 });
    }

    // 3. Check if a profile already exists
    const { data: existingProfile, error: getProfileErr } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (getProfileErr) {
      console.error('Supabase query error (get profile):', getProfileErr);
      return NextResponse.json({ 
        error: `Supabase Error: ${getProfileErr.message}. Code: ${getProfileErr.code}. Check if "profiles" table exists.` 
      }, { status: 500 });
    }

    if (existingProfile) {
      return NextResponse.json(existingProfile);
    }

    // 4. Determine user role
    let finalRole = requestedRole || 'student';
    
    const { count, error: countErr } = await supabaseClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('institute_id', inst.id);

    if (countErr) {
      console.error('Supabase query error (count profiles):', countErr);
      // Don't fail completely, fallback to student if count query fails
    } else if (count === 0) {
      finalRole = 'admin'; // First user to join the institute becomes the owner/admin
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
      console.error('Supabase insert error (profiles):', profileErr);
      return NextResponse.json({ 
        error: `Supabase Error: ${profileErr.message}. Code: ${profileErr.code}. Check database RLS policies.` 
      }, { status: 500 });
    }

    return NextResponse.json(newProfile);
  } catch (error: any) {
    console.error('Internal Server Error in sync-user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
