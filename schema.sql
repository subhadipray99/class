-- Multi-Tenant Course Creation Database Schema (Classplus & PhysicsWallah Style)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Tables First (If not exist)
CREATE TABLE IF NOT EXISTS public.institutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  theme_color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student')) DEFAULT 'student',
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (email, institute_id)
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 2. RLS Helper Functions (SECURITY DEFINER bypasses RLS, avoiding infinite recursion loops)
CREATE OR REPLACE FUNCTION public.get_user_institute()
RETURNS UUID AS $$
  SELECT institute_id FROM public.profiles WHERE id = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;


-- 3. Enable RLS on All Tables
ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;


-- 4. Clean Up and Recreate RLS Policies (Prevents duplicate errors on schema runs)

-- Institutes Policies
DROP POLICY IF EXISTS "Allow public read access to institutes" ON public.institutes;
DROP POLICY IF EXISTS "Allow insert/update access to institutes" ON public.institutes;

CREATE POLICY "Allow public read access to institutes" ON public.institutes FOR SELECT USING (true);
CREATE POLICY "Allow insert/update access to institutes" ON public.institutes FOR ALL USING (true);

-- Profiles Policies
DROP POLICY IF EXISTS "Allow users to read profiles in the same institute" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert/update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins/teachers to manage profiles in their institute" ON public.profiles;

CREATE POLICY "Allow users to read profiles in the same institute" ON public.profiles
  FOR SELECT USING (id = auth.uid()::text OR institute_id = public.get_user_institute());

CREATE POLICY "Allow users to insert/update their own profile" ON public.profiles
  FOR ALL USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);

CREATE POLICY "Allow admins/teachers to manage profiles in their institute" ON public.profiles
  FOR ALL USING (institute_id = public.get_user_institute() AND public.get_user_role() IN ('admin', 'teacher'));

-- Courses Policies
DROP POLICY IF EXISTS "Allow students/teachers to read published courses in their institute" ON public.courses;
DROP POLICY IF EXISTS "Allow admins/teachers to manage courses in their institute" ON public.courses;

CREATE POLICY "Allow students/teachers to read published courses in their institute" ON public.courses
  FOR SELECT USING (institute_id = public.get_user_institute() AND (is_published = true OR public.get_user_role() IN ('admin', 'teacher')));

CREATE POLICY "Allow admins/teachers to manage courses in their institute" ON public.courses
  FOR ALL USING (institute_id = public.get_user_institute() AND public.get_user_role() IN ('admin', 'teacher'));

-- Lectures Policies
DROP POLICY IF EXISTS "Allow access to lectures for enrolled students/teachers" ON public.lectures;
DROP POLICY IF EXISTS "Allow admins/teachers to manage lectures" ON public.lectures;

CREATE POLICY "Allow access to lectures for enrolled students/teachers" ON public.lectures
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = public.lectures.course_id AND c.institute_id = public.get_user_institute()));

CREATE POLICY "Allow admins/teachers to manage lectures" ON public.lectures
  FOR ALL USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = public.lectures.course_id AND c.institute_id = public.get_user_institute()) AND public.get_user_role() IN ('admin', 'teacher'));

-- Resources Policies
DROP POLICY IF EXISTS "Allow read access to resources for enrolled users" ON public.resources;
DROP POLICY IF EXISTS "Allow admins/teachers to manage resources" ON public.resources;

CREATE POLICY "Allow read access to resources for enrolled users" ON public.resources
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.lectures l JOIN public.courses c ON c.id = l.course_id WHERE l.id = public.resources.lecture_id AND c.institute_id = public.get_user_institute()));

CREATE POLICY "Allow admins/teachers to manage resources" ON public.resources
  FOR ALL USING (EXISTS (SELECT 1 FROM public.lectures l JOIN public.courses c ON c.id = l.course_id WHERE l.id = public.resources.lecture_id AND c.institute_id = public.get_user_institute()) AND public.get_user_role() IN ('admin', 'teacher'));

-- Quizzes Policies
DROP POLICY IF EXISTS "Allow read access to quizzes for enrolled users" ON public.quizzes;
DROP POLICY IF EXISTS "Allow admins/teachers to manage quizzes" ON public.quizzes;

CREATE POLICY "Allow read access to quizzes for enrolled users" ON public.quizzes
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.lectures l JOIN public.courses c ON c.id = l.course_id WHERE l.id = public.quizzes.lecture_id AND c.institute_id = public.get_user_institute()));

CREATE POLICY "Allow admins/teachers to manage quizzes" ON public.quizzes
  FOR ALL USING (EXISTS (SELECT 1 FROM public.lectures l JOIN public.courses c ON c.id = l.course_id WHERE l.id = public.quizzes.lecture_id AND c.institute_id = public.get_user_institute()) AND public.get_user_role() IN ('admin', 'teacher'));

-- Quiz Questions Policies
DROP POLICY IF EXISTS "Allow read access to questions for enrolled users" ON public.quiz_questions;
DROP POLICY IF EXISTS "Allow admins/teachers to manage questions" ON public.quiz_questions;

CREATE POLICY "Allow read access to questions for enrolled users" ON public.quiz_questions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.lectures l ON l.id = q.lecture_id JOIN public.courses c ON c.id = l.course_id WHERE q.id = public.quiz_questions.quiz_id AND c.institute_id = public.get_user_institute()));

CREATE POLICY "Allow admins/teachers to manage questions" ON public.quiz_questions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.lectures l ON l.id = q.lecture_id JOIN public.courses c ON c.id = l.course_id WHERE q.id = public.quiz_questions.quiz_id AND c.institute_id = public.get_user_institute()) AND public.get_user_role() IN ('admin', 'teacher'));

-- Quiz Attempts Policies
DROP POLICY IF EXISTS "Allow students to manage/read their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Allow admins/teachers to read attempts in their institute" ON public.quiz_attempts;

CREATE POLICY "Allow students to manage/read their own attempts" ON public.quiz_attempts
  FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Allow admins/teachers to read attempts in their institute" ON public.quiz_attempts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.lectures l ON l.id = q.lecture_id JOIN public.courses c ON c.id = l.course_id WHERE q.id = public.quiz_attempts.quiz_id AND c.institute_id = public.get_user_institute()) AND public.get_user_role() IN ('admin', 'teacher'));
