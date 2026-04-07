import {
  type BorradorTarea,
  type DestinoArrastre,
  type EstadoKanban,
  type OrdenTablero,
  type Tarea,
  type SentidoOrden,
  estadosKanban,
  prioridadesTarea,
  tiposTarea
} from "@/tipos/tareas";
import { supabase } from "@/lib/supabase";
import {
  limpiarTextoMultilinea,
  limpiarTextoPlano,
  limitesSeguridad,
  normalizarUrlNavegable,
  normalizarEnteroSeguro
} from "@/lib/seguridad";

export const almacenamientoTareas = "miniKanbanPlus.tareas.v3";

export function generarIdentificador() {
  return `TK-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function obtenerTareas(): Promise<Tarea[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('indice_orden', { ascending: true });

  if (error || !data) return [];

  return data.map(t => ({
    identificador: t.id,
    fechaCreacion: t.fecha_creacion,
    titulo: t.titulo,
    tipo: t.tipo as any,
    prioridad: t.prioridad as any,
    complejidad: t.complejidad as any,
    fechaDeseableFin: t.fecha_deseable_fin || "",
    observaciones: t.observaciones || "",
    enlace: t.enlace || "",
    estado: t.estado as any,
    personaAsignadaId: t.persona_asignada_id,
    indiceOrden: t.indice_orden,
    semanaId: t.semana_id,
    proyectoId: t.proyecto_id
  }));
}

export async function guardarTarea(tarea: Tarea) {
  const { error } = await supabase
    .from('tasks')
    .upsert({
      id: tarea.identificador,
      fecha_creacion: tarea.fechaCreacion,
      titulo: tarea.titulo,
      tipo: tarea.tipo,
      prioridad: tarea.prioridad,
      complejidad: tarea.complejidad,
      fecha_deseable_fin: tarea.fechaDeseableFin || null,
      observaciones: tarea.observaciones,
      enlace: tarea.enlace,
      estado: tarea.estado,
      persona_asignada_id: tarea.personaAsignadaId || null,
      indice_orden: tarea.indiceOrden,
      semana_id: tarea.semanaId,
      proyecto_id: tarea.proyectoId || null,
      team_id: '00000000-0000-0000-0000-000000000001'
    });

  if (error) console.error("Error saving task:", error.message);
}

export async function eliminarTarea(identificador: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', identificador);

  if (error) console.error("Error deleting task:", error.message);
}

export async function moverTarea(
  identificador: string,
  destino: DestinoArrastre
) {
  const { error } = await supabase
    .from('tasks')
    .update({ 
      estado: destino.estado,
      indice_orden: destino.indice,
      ...(destino.personaId ? { persona_asignada_id: destino.personaId } : {})
    })
    .eq('id', identificador);

  if (error) console.error("Error moving task:", error.message);
}

export function crearBorradorVacio(
  estado: EstadoKanban = "DEFINIDO",
  semanaId: string = ""
): BorradorTarea {
  return {
    titulo: "",
    tipo: "Planificacion",
    prioridad: "MEDIA",
    complejidad: 1,
    fechaDeseableFin: "",
    observaciones: "",
    enlace: "",
    estado,
    personaAsignadaId: "",
    semanaId: semanaId,
    proyectoId: undefined
  };
}

export function crearTareaDesdeBorrador(
  borrador: BorradorTarea,
  indiceOrden: number
): Tarea {
  return {
    identificador: generarIdentificador(),
    fechaCreacion: new Date().toISOString(),
    titulo: limpiarTextoPlano(borrador.titulo, limitesSeguridad.tituloMaximo),
    tipo: borrador.tipo,
    prioridad: borrador.prioridad,
    complejidad: borrador.complejidad,
    fechaDeseableFin: borrador.fechaDeseableFin,
    observaciones: limpiarTextoMultilinea(
      borrador.observaciones,
      limitesSeguridad.observacionesMaximas
    ),
    enlace: normalizarUrlNavegable(borrador.enlace),
    estado: borrador.estado,
    personaAsignadaId: borrador.personaAsignadaId,
    semanaId: borrador.semanaId,
    proyectoId: borrador.proyectoId,
    indiceOrden
  };
}

export function obtenerSiguienteIndice(tareas: Tarea[], estado: EstadoKanban) {
  const tareasEstado = tareas.filter((t) => t.estado === estado);
  if (tareasEstado.length === 0) return 0;
  return Math.max(...tareasEstado.map((t) => t.indiceOrden)) + 1;
}

export function agruparPorEstado(
  tareas: Tarea[],
  estado: EstadoKanban,
  orden: OrdenTablero = "manual",
  sentido: SentidoOrden = "asc"
): Tarea[] {
  const filtradas = tareas.filter((t) => t.estado === estado);

  if (orden === "manual") {
    return filtradas.sort((a, b) => a.indiceOrden - b.indiceOrden);
  }

  return [...filtradas].sort((a, b) => {
    let comparacion = 0;
    switch (orden) {
      case "titulo":
        comparacion = a.titulo.localeCompare(b.titulo);
        break;
      case "tipo":
        comparacion = a.tipo.localeCompare(b.tipo);
        break;
      case "prioridad":
        comparacion =
          prioridadesTarea.indexOf(a.prioridad) -
          prioridadesTarea.indexOf(b.prioridad);
        break;
      case "fechaDeseable":
        comparacion = a.fechaDeseableFin.localeCompare(b.fechaDeseableFin);
        break;
      case "fechaCreacion":
        comparacion = a.fechaCreacion.localeCompare(b.fechaCreacion);
        break;
    }
    return sentido === "asc" ? comparacion : -comparacion;
  });
}

export function normalizarIndices(tareas: Tarea[], estado: EstadoKanban): Tarea[] {
  return agruparPorEstado(tareas, estado, "manual").map((t, i) => ({
    ...t,
    indiceOrden: i
  }));
}

export function normalizarTareasPersistidas(tareas: any[]): Tarea[] {
  return limitarColeccion(tareas, limitesSeguridad.tareasMaximasTotal).map((t) => ({
    identificador: String(t?.identificador || generarIdentificador()),
    fechaCreacion: String(t?.fechaCreacion || new Date().toISOString()),
    titulo: limpiarTextoPlano(t?.titulo, limitesSeguridad.tituloMaximo) || "Tarea sin título",
    tipo: (tiposTarea.includes(t?.tipo) ? t?.tipo : "Planificacion") as any,
    prioridad: (prioridadesTarea.includes(t?.prioridad) ? t?.prioridad : "MEDIA") as any,
    complejidad: normalizarEnteroSeguro(t?.complejidad, 1) as any,
    fechaDeseableFin: String(t?.fechaDeseableFin || ""),
    observaciones: limpiarTextoMultilinea(t?.observaciones, limitesSeguridad.observacionesMaximas),
    enlace: normalizarUrlNavegable(t?.enlace),
    estado: (estadosKanban.includes(t?.estado) ? t?.estado : "DEFINIDO") as any,
    personaAsignadaId: String(t?.personaAsignadaId || ""),
    indiceOrden: normalizarEnteroSeguro(t?.indiceOrden, 0),
    semanaId: String(t?.semanaId || ""),
    proyectoId: t?.proyectoId ? String(t.proyectoId) : undefined
  }));
}

export const tareasEjemplo: Tarea[] = [];

export function formatearFechaCorta(fechaIso: string) {
  if (!fechaIso) return "";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short"
    }).format(new Date(fechaIso));
  } catch {
    return "";
  }
}

export function formatearFechaMedia(fechaIso: string) {
  if (!fechaIso) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date(fechaIso));
  } catch {
    return "Fecha inválida";
  }
}
