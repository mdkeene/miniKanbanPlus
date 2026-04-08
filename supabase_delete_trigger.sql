-- 1. Función REFORZADA (v3) para manejar el borrado de un usuario en Auth
-- Esta versión incluye fallback dinámico para evitar bloqueos si no hay otros admins
CREATE OR REPLACE FUNCTION public.handle_deleted_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id TEXT;
BEGIN
  -- 1. Buscar el ID del primer administrador disponible
  SELECT id::text INTO target_user_id 
  FROM public.profiles 
  WHERE rol = 'admin' AND id != OLD.id::text 
  LIMIT 1;

  -- 2. FALLBACK: Si no hay otros admins, buscar CUALQUIER otro usuario
  IF target_user_id IS NULL THEN
    SELECT id::text INTO target_user_id 
    FROM public.profiles 
    WHERE id != OLD.id::text 
    LIMIT 1;
  END IF;

  -- 3. Reasignar todas las tareas (se pondrán en NULL si target_user_id sigue siendo null)
  UPDATE public.tasks 
  SET persona_asignada_id = target_user_id
  WHERE persona_asignada_id = OLD.id::text;

  -- 4. Borrar el perfil de la tabla profiles
  DELETE FROM public.profiles WHERE id = OLD.id::text;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Actualizar el trigger
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_auth_user();

-- MENSAJE: Con esta versión reforzada, puedes borrar a cualquier usuario desde 
-- el panel de Supabase Auth sin que las tareas asignadas bloqueen la operación.
