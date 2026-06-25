-- Backend hardening: bilingual companies, student auto-provision, seed cleanup

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS description_ta TEXT NOT NULL DEFAULT '';

DELETE FROM public.badge_definitions WHERE id = 'perfect-attendance';

-- Auto-create student row when a student account is registered
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role := 'student';
  default_course_id UUID;
  default_course_name TEXT := 'A/L Combined Mathematics';
  display_name TEXT;
BEGIN
  IF NEW.raw_app_meta_data ? 'role' THEN
    assigned_role := (NEW.raw_app_meta_data->>'role')::public.user_role;
  END IF;

  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, display_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    display_name,
    assigned_role,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  IF assigned_role = 'student' THEN
    SELECT id, name INTO default_course_id, default_course_name
    FROM public.courses
    ORDER BY created_at ASC
    LIMIT 1;

    INSERT INTO public.students (
      user_id,
      student_id,
      display_name,
      email,
      course_id,
      course_name,
      grade,
      rank,
      streak,
      points,
      performance
    )
    VALUES (
      NEW.id,
      'ICTF-' || to_char(extract(epoch from now()) * 1000, 'FM999999999999'),
      display_name,
      NEW.email,
      default_course_id,
      COALESCE(default_course_name, 'General'),
      'B',
      50,
      0,
      0,
      0
    );
  END IF;

  RETURN NEW;
END;
$$;
