import { type Proyecto } from "@/tipos/tareas";
import { supabase } from "@/lib/supabase";

export async function obtenerProyectos(): Promise<Proyecto[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("orden_selector", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error al obtener proyectos:", error);
    return [];
  }

  return (data || []).map(p => ({
    identificador: p.identificador,
    nombre: p.nombre,
    descripcion: p.descripcion,
    color: p.color,
    ordenSelector: p.orden_selector || 0
  }));
}

export async function guardarProyecto(proyecto: Proyecto): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .upsert({
      identificador: proyecto.identificador,
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion,
      color: proyecto.color,
      orden_selector: proyecto.ordenSelector || 0
    });

  if (error) {
    console.error("DEBUG: Error saving project:", error.message, error.details);
    alert("Error al guardar proyecto: " + error.message);
    throw error;
  }
}

export async function eliminarProyecto(identificador: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("identificador", identificador);

  if (error) throw error;
}

export function crearProyectoVacio(): Proyecto {
  return {
    identificador: crypto.randomUUID(),
    nombre: "",
    descripcion: "",
    color: "#0ea5e9",
    ordenSelector: 0
  };
}

export const proyectosEjemplo: Proyecto[] = [];
