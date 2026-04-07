-- 1. Create a function that handles the insertion of a new profile
-- This function will extract the user's ID and Email from the Auth system
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, area, color, rol)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)), 
    'General', 
    '#94a3b8', 
    'usuario'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger that executes the function every time a user is created in Auth
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. (Optional) Run this to provision any existing users who are already in Auth but missing a profile
-- INSERT INTO public.profiles (id, nombre, area, color, rol)
-- SELECT id, COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1)), 'General', '#94a3b8', 'usuario'
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;
