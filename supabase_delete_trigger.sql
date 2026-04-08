-- 1. Función para manejar el borrado de un usuario en Auth
-- Esta función se activará cuando borres a alguien desde el panel de Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_deleted_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger que escucha al sistema de Autenticación
-- NOTA: Debes ejecutar esto en el SQL Editor de Supabase
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_auth_user();

-- MENSAJE: Con esto, al borrar a alguien de Auth, su perfil de InnovaExport se borra solo.
