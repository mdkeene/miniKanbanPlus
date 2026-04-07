import { type Proyecto, type TareaPeriodica } from "@/tipos/tareas";
import { supabase } from "@/lib/supabase";

export async function obtenerProyectos(): Promise<Proyecto[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
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
    tareasPeriodicas: p.tareas_periodicas || []
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
      tareas_periodicas: proyecto.tareasPeriodicas || []
    });

  if (error) throw error;
}

export async function eliminarProyecto(identificador: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("identificador", identificador);

  if (error) throw error;
}

export async function actualizarTareaPeriodica(
  proyectoId: string,
  tarea: TareaPeriodica
): Promise<void> {
  const proyectos = await obtenerProyectos();
  const proyecto = proyectos.find((p) => p.identificador === proyectoId);
  if (!proyecto) return;

  const index = proyecto.tareasPeriodicas.findIndex(
    (t) => t.identificador === tarea.identificador
  );

  const nuevasTareas = [...proyecto.tareasPeriodicas];
  if (index >= 0) {
    nuevasTareas[index] = tarea;
  } else {
    nuevasTareas.push(tarea);
  }

  await guardarProyecto({ ...proyecto, tareasPeriodicas: nuevasTareas });
}

export async function eliminarTareaPeriodica(
  proyectoId: string,
  tareaId: string
): Promise<void> {
  const proyectos = await obtenerProyectos();
  const proyecto = proyectos.find((p) => p.identificador === proyectoId);
  if (!proyecto) return;

  const nuevasTareas = proyecto.tareasPeriodicas.filter(
    (t) => t.identificador !== tareaId
  );

  await guardarProyecto({ ...proyecto, tareasPeriodicas: nuevasTareas });
}

export function crearProyectoVacio(): Proyecto {
  return {
    identificador: crypto.randomUUID(),
    nombre: "",
    descripcion: "",
    color: "#0ea5e9",
    tareasPeriodicas: []
  };
}

export function crearTareaPeriodicaVacia(): TareaPeriodica {
  return {
    identificador: `TP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    titulo: "",
    tipo: "Planificacion",
    prioridad: "MEDIA",
    complejidad: 1,
    frecuencia: "Semanal",
    activo: true
  };
}

export const proyectosEjemplo: Proyecto[] = [];
