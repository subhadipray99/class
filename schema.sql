-- Multi-Tenant Course Creation Database Schema (Classplus & PhysicsWallah Style)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Institutes Table
CREATE TABLE IF NOT EXISTS public.institutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- e.g. 'physics-wallah'
  logo_url TEXT,
  theme_color TEXT DEFAULT '#8b5cf6', -- Custom brand color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Institutes
ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;

-- Institutes Policies (Anyone can read, only super admins or system can create/update)
CREATE POLICY "Allow public read access to institutes" ON public.institutes
  FOR SELECT USING (true);

CREATE POLICY "Allow insert/update access to institutes" ON public.institutes
  FOR ALL USING (true); -- Simplified for setup, can be restricted later


-- 2. Profiles / Users Table (Scoped to Institute)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Clerk User ID (passed via auth.uid()::text)
  email TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student')) DEFAULT 'student',
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (email, institute_id) -- A user email is unique per institute
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow users to read profiles in the same institute" ON public.profiles
  FOR SELECT USING (
    -- User can read if they belong to the same institute
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid()::text AND p.institute_id = public.profiles.institute_id
    )
    OR
    -- Allow user to read their own profile during signup/first-time check
    id = auth.uid()::text
  );

CREATE POLICY "Allow users to insert/update their own profile" ON public.profiles
  FOR ALL USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);

CREATE POLICY "Allow admins/teachers to manage profiles in their institute" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles admin_p
      WHERE admin_p.id = auth.uid()::text 
      AND admin_p.institute_id = public.profiles.institute_id 
      AND admin_p.role IN ('admin', 'teacher')
    )
  );


-- 3. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Courses Policies
CREATE POLICY "Allow students/teachers to read published courses in their institute" ON public.courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()::text AND p.institute_id = public.courses.institute_id
    ) AND (is_published = true OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()::text AND p.institute_id = public.courses.institute_id AND p.role IN ('admin', 'teacher')
    ))
  );

CREATE POLICY "Allow admins/teachers to manage courses in their institute" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()::text AND p.institute_id = public.courses.institute_id AND p.role IN ('admin', 'teacher')
    )
  );


-- 4. Lectures Table
CREATE TABLE IF NOT EXISTS public.lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT, -- YouTube, Vimeo, R2, etc.
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Lectures
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

-- Lectures Policies
CREATE POLICY "Allow access to lectures for enrolled students/teachers" ON public.lectures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.profiles p ON p.institute_id = c.institute_id
      WHERE c.id = public.lectures.course_id AND p.id = auth.uid()::text
    )
  );

CREATE POLICY "Allow admins/teachers to manage lectures" ON public.lectures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.profiles p ON p.institute_id = c.institute_id
      WHERE c.id = public.lectures.course_id AND p.id = auth.uid()::text AND p.role IN ('admin', 'teacher')
    )
  );


-- 5. Resources Table (PDFs, Notes)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Resources Policies
CREATE POLICY "Allow read access to resources for enrolled users" ON public.resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      JOIN public.courses c ON c.id = l.course_id
      JOIN public.profiles p ON p.institute_id = c.institute_id
      WHERE l.id = public.resources.lecture_id AND p.id = auth.uid()::text
    )
  );

CREATE POLICY "Allow admins/teachers to manage resources" ON public.resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      JOIN public.courses c ON c.id = l.course_id
      JOIN public.profiles p ON p.institute_id = c.institute_id
      WHERE l.id = public.resources.lecture_id AND p.id = auth.uid()::text AND p.role IN ('admin', 'teacher')
    )
  );


-- 6. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Quizzes Policies
CREATE POLICY "Allow read access to quizzes for enrolled users" ON public.quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      JOIN public.courses c ON c.id = l.course_id
      JOIN public.profiles p ON p.institute_id = c.institute_id
      WHERE l.id = public.quizzes.lecture_id AND p.id = auth.uid()::text
    )
  );

CREATE POLICY "Allow admins/teachers to manage quizzes" ON public.quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      JOIN public.courses c ON c.id = l.course_id
      JOIN public.profiles p ON p.institute_id = c.institute_id
      WHERE l.id = public.quizzes.lecture_id AND p.id = auth.uid()::text AND p.role IN ('admin', 'teacher')
    )
  );


-- 7. Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- e.g. ["Option A", "Option B", "Option C", "Option D"]
  correct_answer INTEGER NOT NULL, -- index of correct option (0-3)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Quiz Questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Quiz Questions Policies
CREATE POLICY "Allow read access to questions for enrolled users" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lectures l ON l.id = q.lecture_id
      JOIN public.courses c ON c.id = l.course_id
      JOIN public.profiles p ON p.institute_id = c.institute_id
      WHERE q.id = public.quiz_questions.quiz_id AND p.id = auth.uid()::text
    )
  );

CREATE POLICY "Allow admins/teachers to manage questions" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lectures l ON l.id = q.lecture_id
      JOIN public.courses c ON c.id = l.course_id
      JOIN public.profiles p ON p.institute_id = c.institute_id
      WHERE q.id = public.quiz_questions.quiz_id AND p.id = auth.uid()::text AND p.role IN ('admin', 'teacher')
    )
  );


-- 8. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL, -- e.g. [0, 2, 1]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Quiz Attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz Attempts Policies
CREATE POLICY "Allow students to manage/read their own attempts" ON public.quiz_attempts
  FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Allow admins/teachers to read attempts in their institute" ON public.quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lectures l ON l.id = q.lecture_id
      JOIN public.courses c ON c.id = l.course_id
      JOIN public.profiles p ON p.institute_id = c.institute_id
      WHERE q.id = public.quiz_attempts.quiz_id AND p.id = auth.uid()::text AND p.role IN ('admin', 'teacher')
    )
  );
