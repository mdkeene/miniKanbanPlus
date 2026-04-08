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

  const persona: Persona = {
    identificador: data.session.user.id,
    nombre: profile?.nombre || data.session.user.email?.split('@')[0] || "Usuario",
    email: data.session.user.email || "",
    area: profile?.area || "General",
    foto: profile?.foto || "",
    rol: (profile?.rol as any) || "usuario",
    color: profile?.color || "#94a3b8"
  };

  // Auto-provision if profile is missing entirely
  if (!profile) {
    await guardarPersona(persona);
  }

  // Auto-provision if profile is missing
  if (!profile) {
    await guardarPersona(persona);
  }

  const sesion: Sesion = {
    usuario: persona,
    token: data.session.access_token
  };

  // Keep a local copy for quick sync checks if needed, 
  // though Supabase manages the main session.
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

  // Get profile data
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  let profile = profileData;

  // Smart Link Check en la sesión continuada
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

  const result: Sesion = {
    usuario: {
      identificador: session.user.id,
      nombre: profile?.nombre || session.user.email?.split('@')[0] || "Usuario",
      email: session.user.email || "",
      area: profile?.area || "General",
      foto: profile?.foto || "",
      rol: (profile?.rol as any) || "usuario",
      color: profile?.color || "#94a3b8"
    },
    token: session.access_token
  };

  // Auto-provision if session exists but profile doesn't (safeguard)
  if (!profile) {
    await guardarPersona(result.usuario);
  }

  return result;
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CLAVE_SESION);
  }
}

/**
 * Verifica si un email está en la lista de perfiles "invitados" por un administrador.
 */
export async function buscarInvitacion(email: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();
  return !!data;
}

/**
 * Registra a un nuevo usuario invitado.
 * Supabase Auth creará el registro y nuestro flujo de 'login' se encargará 
 * de vincularlo con el perfil pre-existente por email.
 */
export async function registrar(email: string, clave: string): Promise<Sesion | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: clave,
  });

  if (error) {
    console.error("Registration error:", error.message);
    throw error;
  }

  // Intentamos login inmediatamente para activar el 'Smart Link' de perfiles
  return await login(email, clave);
}
