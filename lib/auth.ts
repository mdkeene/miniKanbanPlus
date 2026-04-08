import { type Persona, type Sesion, type Usuario } from "@/tipos/tareas";
import { supabase } from "@/lib/supabase";
import { guardarPersona } from "@/lib/personas";

const CLAVE_SESION = "miniKanbanPlus.sesion";

// Default admin as a fallback/template
// Default admin as a fallback/template
export const usuarioAdmin: Persona = {
  identificador: "USR-ADMIN",
  nombre: "Administrador",
  email: "admin@miniKanbanPlus.com",
  area: "Sistemas",
  foto: "",
  rol: "admin",
  color: "#0ea5e9"
};

export async function login(email: string, clave: string): Promise<Sesion | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: clave,
  });

  if (error || !data.session) {
    console.error("Login error:", error?.message);
    return null;
  }

  // Fetch the profile from our custom 'profiles' table
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single();

  let profile = profileData;

  // Smart Link: Si no hay perfil por ID, buscar por Email
  if (!profile && data.session.user.email) {
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', data.session.user.email)
      .single();

    if (profileByEmail) {
      // Vincular el perfil manualmente creado con el UID de Auth
      await supabase
        .from('profiles')
        .update({ id: data.session.user.id })
        .eq('id', profileByEmail.id);
      
      profile = { ...profileByEmail, id: data.session.user.id };
    }
  }

  // SECURITY CHECK: Si después de todo no hay perfil, es que NO está invitado.
  if (!profile) {
    console.warn("Acceso denegado: Perfil no encontrado para este usuario.");
    await supabase.auth.signOut();
    return null;
  }

  // DOUBLE-CHECK FIREWALL: Comparación estricta de emails para evitar typos
  const emailAuth = data.session.user.email?.toLowerCase();
  const emailInvitado = profile.email?.toLowerCase();

  if (emailAuth !== emailInvitado) {
    console.error("ALERTA DE SEGURIDAD: Email de Auth no coincide con Email de Invitación.", { emailAuth, emailInvitado });
    await supabase.auth.signOut();
    return null;
  }

  const persona: Persona = {
    identificador: data.session.user.id,
    nombre: profile.nombre || "Usuario",
    email: data.session.user.email || "",
    area: profile.area || "General",
    foto: profile.foto || "",
    rol: (profile.rol as any) || "usuario",
    color: profile.color || "#94a3b8"
  };

  const sesion: Sesion = {
    usuario: persona,
    token: data.session.access_token
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  }
  
  return sesion;
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CLAVE_SESION);
    }
    return null;
  }

  // Get profile data - CRITICAL CHECK
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  let profile = profileData;

  // Smart Link Check en la sesión continuada (por si se acaba de registrar)
  if (!profile && session.user.email) {
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (profileByEmail) {
      await supabase
        .from('profiles')
        .update({ id: session.user.id })
        .eq('id', profileByEmail.id);
      profile = { ...profileByEmail, id: session.user.id };
    }
  }

  // SECURITY FIREWALL: Si hay sesión de Auth pero NO hay perfil invitado, expulsión inmediata.
  if (!profile) {
    console.error("Sesión huérfana detectada o no invitado. Expulsando...");
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CLAVE_SESION);
    }
    return null;
  }

  // DOUBLE-CHECK FIREWALL: Comparación estricta de emails
  const emailAuth = session.user.email?.toLowerCase();
  const emailInvitado = profile.email?.toLowerCase();

  if (emailAuth !== emailInvitado) {
    console.error("ALERTA: Se detectó un desajuste de identidad en la sesión.", { emailAuth, emailInvitado });
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CLAVE_SESION);
    }
    return null;
  }

  const result: Sesion = {
    usuario: {
      identificador: session.user.id,
      nombre: profile.nombre || "Usuario",
      email: session.user.email || "",
      area: profile.area || "General",
      foto: profile.foto || "",
      rol: (profile.rol as any) || "usuario",
      color: profile.color || "#94a3b8"
    },
    token: session.access_token
  };

  return result;
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CLAVE_SESION);
  }
}

/**
 * Registra a un nuevo usuario. 
 * Primero crea la cuenta en Auth y luego verifica si tiene un perfil previo
 * creado por Michael para vincularlo.
 */
export async function registrar(email: string, clave: string): Promise<Sesion | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: clave,
  });

  if (error) {
    if (error.message.includes("already registered")) {
      throw new Error("Este email ya está registrado. Intenta iniciar sesión con tu contraseña.");
    }
    throw error;
  }

  if (!data.session) {
    throw new Error("Se requiere confirmación por email o la cuenta no pudo crearse.");
  }

  // Ahora que estamos "logueados", comprobamos si Michael lo invitó (existe en profiles)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (!profile) {
    // SECURITY FIREWALL: No estaba invitado. Borramos su rastro y fuera.
    await supabase.auth.signOut();
    throw new Error("Lo sentimos, este email no ha sido invitado por Michael al sistema.");
  }

  // ÉXITO: Estaba invitado. Vinculamos el perfil con el nuevo UID de Auth.
  await supabase
    .from('profiles')
    .update({ id: data.session.user.id })
    .eq('email', email);

  // Re-login para asegurar que la sesión tiene el perfil vinculado
  return await login(email, clave);
}
