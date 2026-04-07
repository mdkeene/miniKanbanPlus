import { type Persona, type Sesion, type Usuario } from "@/tipos/tareas";
import { supabase } from "@/lib/supabase";
import { guardarPersona } from "@/lib/personas";

const CLAVE_SESION = "miniKanbanPlus.sesion";

// Default admin as a fallback/template
export const usuarioAdmin: Usuario = {
  identificador: "USR-ADMIN",
  nombre: "Administrador",
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single();

  const persona: Persona = {
    identificador: data.session.user.id,
    nombre: profile?.nombre || data.session.user.email?.split('@')[0] || "Usuario",
    area: profile?.area || "General",
    foto: profile?.foto || "",
    rol: (profile?.rol as any) || "usuario",
    color: profile?.color || "#94a3b8"
  };

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const result: Sesion = {
    usuario: {
      identificador: session.user.id,
      nombre: profile?.nombre || session.user.email?.split('@')[0] || "Usuario",
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
