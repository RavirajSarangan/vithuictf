-- Profile-only auto-provision on signup; student rows are created by the app layer
-- so public registration can store username, index number, course, etc.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role := 'student';
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
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
