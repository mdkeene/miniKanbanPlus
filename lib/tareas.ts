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
  normalizarEnteroSeguro,
  limitarColeccion
} from "@/lib/seguridad";

export const almacenamientoTareas = "miniKanbanPlus.tareas.v3";

export function generarIdentificador() {
  return `TK-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function normalizarTareaDesdeSupabase(t: any): Tarea {
  return {
    identificador: t.id,
    fechaCreacion: t.fecha_creacion,
    titulo: t.titulo,
    tipo: t.tipo as any,
    prioridad: t.prioridad as any,
    fechaDeseableFin: t.fecha_deseable_fin || "",
    observaciones: t.observaciones || "",
    enlace: t.enlace || "",
    estado: t.estado as any,
    personaAsignadaId: t.persona_asignada_id,
    indiceOrden: t.indice_orden,
    semanaId: t.semana_id,
    proyectoId: t.proyecto_id,
    esUrgente: t.es_urgente,
    esSpillover: t.es_spillover,
    esDevuelto: t.es_devuelto,
    esRecurrente: t.es_recurrente,
    frecuenciaRecurrencia: t.frecuencia_recurrencia,
    fechaFinRecurrencia: t.fecha_fin_recurrencia
  };
}

export async function obtenerTareas(): Promise<Tarea[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('indice_orden', { ascending: true });

  if (error || !data) return [];

  return data.map(normalizarTareaDesdeSupabase);
}

export async function guardarTarea(tarea: Tarea) {
  const { error } = await supabase
    .from('tasks')
    .upsert({
      id: tarea.identificador,
      fecha_creacion: tarea.fechaCreacion,
      titulo: tarea.titulo,
      tipo: tarea.tipo || "Ejecución",
      prioridad: tarea.prioridad,
      fecha_deseable_fin: tarea.fechaDeseableFin || null,
      observaciones: tarea.observaciones,
      enlace: tarea.enlace,
      estado: tarea.estado,
      persona_asignada_id: tarea.personaAsignadaId || null,
      indice_orden: tarea.indiceOrden,
      semana_id: tarea.semanaId,
      proyecto_id: tarea.proyectoId || null,
      team_id: '00000000-0000-0000-0000-000000000001',
      es_urgente: tarea.esUrgente ?? false,
      es_spillover: tarea.esSpillover ?? false,
      es_devuelto: tarea.esDevuelto ?? false,
      es_recurrente: tarea.esRecurrente ?? false,
      frecuencia_recurrencia: tarea.frecuenciaRecurrencia || null,
      fecha_fin_recurrencia: tarea.fechaFinRecurrencia || null
    });

  if (error) {
    console.error("DEBUG: Error saving task:", error.message, error.details, error.hint);
    alert("Error al guardar tarea: " + error.message);
  }
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
    prioridad: "MEDIA",
    fechaDeseableFin: "",
    observaciones: "",
    enlace: "",
    estado,
    personaAsignadaId: "",
    semanaId: semanaId,
    proyectoId: undefined,
    esUrgente: false,
    esSpillover: false
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
    prioridad: borrador.prioridad,
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
    esUrgente: borrador.esUrgente,
    esSpillover: borrador.esSpillover,
    esDevuelto: borrador.esDevuelto,
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
  return limitarColeccion(tareas, limitesSeguridad.tareasMaximas).map((t) => ({
    identificador: String(t?.identificador || generarIdentificador()),
    fechaCreacion: String(t?.fechaCreacion || new Date().toISOString()),
    titulo: limpiarTextoPlano(t?.titulo, limitesSeguridad.tituloMaximo) || "Tarea sin título",
    tipo: (tiposTarea.includes(t?.tipo) ? t?.tipo : "Planificacion") as any,
    prioridad: (prioridadesTarea.includes(t?.prioridad) ? t?.prioridad : "MEDIA") as any,
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
export async function generarOcurrenciasRecurrentes(tareaBase: Tarea) {
  if (!tareaBase.esRecurrente || !tareaBase.frecuenciaRecurrencia || !tareaBase.fechaFinRecurrencia) return;

  const fechaFin = new Date(tareaBase.fechaFinRecurrencia);
  let fechaActual = new Date(tareaBase.fechaDeseableFin || tareaBase.fechaCreacion);

  // Generar tareas hasta la fecha fin
  const nuevasTareas: Tarea[] = [];
  
  while (true) {
    // Avanzar la fecha según frecuencia
    if (tareaBase.frecuenciaRecurrencia === 'Semanal') {
      fechaActual.setDate(fechaActual.getDate() + 7);
    } else if (tareaBase.frecuenciaRecurrencia === 'Quincenal') {
      fechaActual.setDate(fechaActual.getDate() + 14);
    } else if (tareaBase.frecuenciaRecurrencia === 'Mensual') {
      fechaActual.setMonth(fechaActual.getMonth() + 1);
    } else {
      break;
    }

    if (fechaActual > fechaFin) break;

    const nuevaOcurrencia: Tarea = {
      ...tareaBase,
      identificador: generarIdentificador(),
      fechaCreacion: new Date().toISOString(),
      fechaDeseableFin: fechaActual.toISOString().split('T')[0],
      esRecurrente: false, // Las ocurrencias no son recurrentes ellas mismas
      frecuenciaRecurrencia: undefined,
      fechaFinRecurrencia: undefined,
      estado: 'BACKLOG', // Por defecto van al backlog las futuras
      semanaId: 'ESTRATEGIA'
    };
    
    nuevasTareas.push(nuevaOcurrencia);
    if (nuevasTareas.length > 52) break; // Seguridad
  }

  for (const t of nuevasTareas) {
    await guardarTarea(t);
  }
}
