import {
  type BorradorTarea,
  type DestinoArrastre,
  type EstadoKanban,
  type OrdenTablero,
  type Persona,
  type PrioridadTarea,
  type SentidoOrden,
  type Tarea,
  estadosKanban,
  prioridadesTarea,
  tiposTarea
} from "@/tipos/tareas";
import { obtenerIdentificadorPersonaAleatorio } from "@/lib/personas";
import {
  limpiarTextoMultilinea,
  limpiarTextoPlano,
  limitesSeguridad,
  limitarColeccion,
  normalizarEnteroSeguro,
  normalizarUrlNavegable
} from "@/lib/seguridad";

const jerarquiaPrioridad: Record<PrioridadTarea, number> = {
  BAJA: 0,
  MEDIA: 1,
  ALTA: 2,
  URGENTE: 3
};

export const almacenamientoTareas = "miniKanbanPlus.tareas.v3";

export function generarIdentificador() {
  return `TK-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function crearBorradorVacio(
  estado: EstadoKanban = "DEFINIDO",
  personas: Persona[] = [],
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
    personaAsignadaId: obtenerIdentificadorPersonaAleatorio(personas),
    semanaId: semanaId,
    proyectoId: undefined
  };
}

export function crearTareaDesdeBorrador(
  borrador: BorradorTarea,
  indiceOrden: number
): Tarea {
  const titulo = limpiarTextoPlano(borrador.titulo, limitesSeguridad.tituloMaximo);

  return {
    identificador: generarIdentificador(),
    fechaCreacion: new Date().toISOString(),
    indiceOrden,
    titulo,
    tipo: tiposTarea.includes(borrador.tipo) ? borrador.tipo : "Planificacion",
    prioridad: prioridadesTarea.includes(borrador.prioridad)
      ? borrador.prioridad
      : "MEDIA",
    complejidad: borrador.complejidad || 1,
    fechaDeseableFin: normalizarFechaDia(borrador.fechaDeseableFin),
    observaciones: limpiarTextoMultilinea(
      borrador.observaciones,
      limitesSeguridad.observacionesMaximas
    ),
    enlace: normalizarUrlNavegable(borrador.enlace),
    estado: estadosKanban.includes(borrador.estado) ? borrador.estado : "DEFINIDO",
    personaAsignadaId: limpiarTextoPlano(borrador.personaAsignadaId, 40),
    semanaId: borrador.semanaId,
    proyectoId: borrador.proyectoId
  };
}

export function normalizarTareasPersistidas(tareas: Tarea[]) {
  return limitarColeccion(tareas, limitesSeguridad.tareasMaximas).map((tarea) => ({
    identificador:
      limpiarTextoPlano(tarea?.identificador, 40) || generarIdentificador(),
    fechaCreacion: normalizarFechaIso(tarea?.fechaCreacion),
    titulo:
      limpiarTextoPlano(tarea?.titulo, limitesSeguridad.tituloMaximo) ||
      "Tarea sin título",
    tipo: tiposTarea.includes(tarea?.tipo) ? tarea.tipo : "Planificacion",
    prioridad: prioridadesTarea.includes(tarea?.prioridad)
      ? tarea.prioridad
      : "MEDIA",
    complejidad: tarea?.complejidad || 1,
    fechaDeseableFin: normalizarFechaDia(tarea?.fechaDeseableFin),
    observaciones: limpiarTextoMultilinea(
      tarea?.observaciones,
      limitesSeguridad.observacionesMaximas
    ),
    enlace: normalizarUrlNavegable(tarea?.enlace),
    estado: estadosKanban.includes(tarea?.estado) ? tarea.estado : "DEFINIDO",
    personaAsignadaId: limpiarTextoPlano(tarea?.personaAsignadaId, 40),
    indiceOrden: normalizarEnteroSeguro(tarea?.indiceOrden),
    semanaId: tarea?.semanaId || "",
    proyectoId: tarea?.proyectoId
  }));
}

export function obtenerSiguienteIndice(tareas: Tarea[], estado: EstadoKanban) {
  return tareas.filter((tarea) => tarea.estado === estado).length;
}

export function normalizarIndices(tareas: Tarea[]) {
  const contadores: Record<EstadoKanban, number> = {
    DEFINIDO: 0,
    EN_CURSO: 0,
    BLOQUEADO: 0,
    TERMINADO: 0
  };

  return tareas
    .map((tarea) => ({ ...tarea }))
    .sort((a, b) => {
      if (a.estado === b.estado) {
        return a.indiceOrden - b.indiceOrden;
      }

      return a.estado.localeCompare(b.estado);
    })
    .map((tarea) => {
      const indiceOrden = contadores[tarea.estado];
      contadores[tarea.estado] += 1;

      return { ...tarea, indiceOrden };
    });
}

export function moverTarea(
  tareas: Tarea[],
  identificador: string,
  destino: DestinoArrastre
) {
  const origen = tareas.find((tarea) => tarea.identificador === identificador);

  if (!origen) {
    return tareas;
  }

  const resto = tareas
    .filter((tarea) => tarea.identificador !== identificador)
    .map((tarea) => ({ ...tarea }));

  const grupoDestino = resto
    .filter((tarea) => tarea.estado === destino.estado)
    .sort((a, b) => a.indiceOrden - b.indiceOrden);

  const indiceAjustado =
    origen.estado === destino.estado && origen.indiceOrden < destino.indice
      ? destino.indice - 1
      : destino.indice;

  const indiceNormalizado = Math.max(
    0,
    Math.min(indiceAjustado, grupoDestino.length)
  );

  const tareaMovida: Tarea = {
    ...origen,
    estado: destino.estado,
    ...(destino.personaId !== undefined ? { personaAsignadaId: destino.personaId } : {})
  };

  grupoDestino.splice(indiceNormalizado, 0, tareaMovida);

  const otrosEstados = resto.filter((tarea) => tarea.estado !== destino.estado);
  const recombinadas = [...otrosEstados, ...grupoDestino];

  return normalizarIndices(recombinadas);
}

export function ordenarTareas(
  tareas: Tarea[],
  criterio: OrdenTablero,
  sentido: SentidoOrden
) {
  const multiplicador = sentido === "asc" ? 1 : -1;
  const copia = [...tareas];

  return copia.sort((a, b) => {
    if (criterio === "manual") {
      if (a.estado === b.estado) {
        return (a.indiceOrden - b.indiceOrden) * multiplicador;
      }

      return 0;
    }

    const valor =
      criterio === "titulo"
        ? a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" })
        : criterio === "tipo"
          ? a.tipo.localeCompare(b.tipo, "es", { sensitivity: "base" })
          : criterio === "prioridad"
            ? jerarquiaPrioridad[a.prioridad] - jerarquiaPrioridad[b.prioridad]
            : criterio === "fechaDeseable"
              ? compararFechas(a.fechaDeseableFin, b.fechaDeseableFin)
              : compararFechas(a.fechaCreacion, b.fechaCreacion);

    if (valor !== 0) {
      return valor * multiplicador;
    }

    return a.indiceOrden - b.indiceOrden;
  });
}

function compararFechas(fechaA: string, fechaB: string) {
  if (!fechaA && !fechaB) {
    return 0;
  }

  if (!fechaA) {
    return 1;
  }

  if (!fechaB) {
    return -1;
  }

  return new Date(fechaA).getTime() - new Date(fechaB).getTime();
}

function normalizarFechaIso(valor: unknown) {
  if (typeof valor !== "string") {
    return new Date().toISOString();
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return new Date().toISOString();
  }

  return fecha.toISOString();
}

function normalizarFechaDia(valor: unknown) {
  if (typeof valor !== "string") {
    return "";
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(valor.trim()) ? valor.trim() : "";
}

export function agruparPorEstado(
  tareas: Tarea[],
  estado: EstadoKanban,
  criterio: OrdenTablero,
  sentido: SentidoOrden
) {
  const filtradas = tareas.filter((tarea) => tarea.estado === estado);

  return ordenarTareas(filtradas, criterio, sentido);
}

export function formatearFechaCorta(fechaIso: string) {
  if (!fechaIso) {
    return "";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short"
  }).format(new Date(fechaIso));
}

export function formatearFechaMedia(fechaIso: string) {
  if (!fechaIso) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(fechaIso));
}

import { obtenerSemanaId, obtenerSemanaRelativa } from "@/lib/semanas";

const semanaActual = obtenerSemanaId();
const semanaMenos1 = obtenerSemanaRelativa(semanaActual, -1);
const semanaMenos2 = obtenerSemanaRelativa(semanaActual, -2);

// Date helpers
function getDateOffsetAsIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function getDateOffsetAsYMD(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export const tareasEjemplo: Tarea[] = normalizarIndices([
  // ---- SEMANA ACTUAL (-0) ----
  {
    identificador: "TK-1001",
    fechaCreacion: getDateOffsetAsIso(-1),
    titulo: "Despliegue a producción portal web",
    tipo: "Lanzamiento" as any, 
    prioridad: "ALTA",
    complejidad: 8,
    fechaDeseableFin: getDateOffsetAsYMD(2),
    observaciones: "Subir landing page final de Cliente 1.",
    enlace: "https://ejemplo.com",
    estado: "EN_CURSO",
    personaAsignadaId: "PR-1003", // Elena (Lanzamiento)
    indiceOrden: 0,
    semanaId: semanaActual,
    proyectoId: "PRJ-1001"
  },
  {
    identificador: "TK-1002",
    fechaCreacion: getDateOffsetAsIso(-2),
    titulo: "Ajustar creatividades campaña",
    tipo: "Diseño" as any,
    prioridad: "MEDIA",
    complejidad: 5,
    fechaDeseableFin: getDateOffsetAsYMD(3),
    observaciones: "Ajuste de colores para Cliente B.",
    enlace: "",
    estado: "DEFINIDO",
    personaAsignadaId: "PR-1001", // Laura (Diseño)
    indiceOrden: 0,
    semanaId: semanaActual,
    proyectoId: "PRJ-1002"
  },
  {
    identificador: "TK-1003",
    fechaCreacion: getDateOffsetAsIso(0),
    titulo: "Facturación cliente A",
    tipo: "Planificacion",
    prioridad: "URGENTE",
    complejidad: 2,
    fechaDeseableFin: getDateOffsetAsYMD(1),
    observaciones: "Emitir facturas pendientes del trimestre.",
    enlace: "",
    estado: "EN_CURSO",
    personaAsignadaId: "PR-ADMIN", // Dirección
    indiceOrden: 1,
    semanaId: semanaActual,
    proyectoId: "PRJ-1003"
  },
  
  // ---- SEMANA PASADA (-1) ----
  {
    identificador: "TK-1004",
    fechaCreacion: getDateOffsetAsIso(-8),
    titulo: "Desarrollo del Backend Cliente 1",
    tipo: "Desarrollo" as any,
    prioridad: "ALTA",
    complejidad: 8,
    fechaDeseableFin: getDateOffsetAsYMD(-4),
    observaciones: "Implementación de API.",
    enlace: "",
    estado: "TERMINADO",
    personaAsignadaId: "PR-1002", // Carlos (Dev)
    indiceOrden: 0,
    semanaId: semanaMenos1,
    proyectoId: "PRJ-1001"
  },
  {
    identificador: "TK-1005",
    fechaCreacion: getDateOffsetAsIso(-9),
    titulo: "Auditoría SEO Cliente B",
    tipo: "Marketing" as any,
    prioridad: "MEDIA",
    complejidad: 3,
    fechaDeseableFin: getDateOffsetAsYMD(-5),
    observaciones: "Revisar palabras clave.",
    enlace: "",
    estado: "TERMINADO",
    personaAsignadaId: "PR-1004", // Marcos (Marketing)
    indiceOrden: 1,
    semanaId: semanaMenos1,
    proyectoId: "PRJ-1002"
  },
  {
    identificador: "TK-1006",
    fechaCreacion: getDateOffsetAsIso(-7),
    titulo: "Lanzar anuncios MetaAds",
    tipo: "Publicidad" as any,
    prioridad: "MEDIA",
    complejidad: 3,
    fechaDeseableFin: getDateOffsetAsYMD(-3),
    observaciones: "Presupuesto inicial $500.",
    enlace: "",
    estado: "TERMINADO",
    personaAsignadaId: "PR-1005", // Sofía (Publicidad)
    indiceOrden: 2,
    semanaId: semanaMenos1,
    proyectoId: "PRJ-1002"
  },
  {
    identificador: "TK-1007",
    fechaCreacion: getDateOffsetAsIso(-10),
    titulo: "Renovación líneas de crédito",
    tipo: "Documentacion",
    prioridad: "ALTA",
    complejidad: 2,
    fechaDeseableFin: getDateOffsetAsYMD(-5),
    observaciones: "Renovar con el banco corporativo.",
    enlace: "",
    estado: "TERMINADO",
    personaAsignadaId: "PR-ADMIN", // Dirección
    indiceOrden: 3,
    semanaId: semanaMenos1,
    proyectoId: "PRJ-1003"
  },

  // ---- SEMANA ANTES DE LA PASADA (-2) ----
  {
    identificador: "TK-1008",
    fechaCreacion: getDateOffsetAsIso(-15),
    titulo: "Diseño UX/UI Cliente 1",
    tipo: "Diseño" as any,
    prioridad: "ALTA",
    complejidad: 8,
    fechaDeseableFin: getDateOffsetAsYMD(-11),
    observaciones: "Bocetos y mockups.",
    enlace: "",
    estado: "TERMINADO",
    personaAsignadaId: "PR-1001", // Laura
    indiceOrden: 0,
    semanaId: semanaMenos2,
    proyectoId: "PRJ-1001"
  },
  {
    identificador: "TK-1009",
    fechaCreacion: getDateOffsetAsIso(-16),
    titulo: "Kickoff Cliente B",
    tipo: "Reunion",
    prioridad: "MEDIA",
    complejidad: 2,
    fechaDeseableFin: getDateOffsetAsYMD(-14),
    observaciones: "Reunión inicial de estrategia.",
    enlace: "",
    estado: "TERMINADO",
    personaAsignadaId: "PR-1004", // Marcos
    indiceOrden: 1,
    semanaId: semanaMenos2,
    proyectoId: "PRJ-1002"
  },
  {
    identificador: "TK-1010",
    fechaCreacion: getDateOffsetAsIso(-17),
    titulo: "Facturación cliente B",
    tipo: "Planificacion",
    prioridad: "ALTA",
    complejidad: 1,
    fechaDeseableFin: getDateOffsetAsYMD(-15),
    observaciones: "Pago anticipado del 50%.",
    enlace: "",
    estado: "TERMINADO",
    personaAsignadaId: "PR-ADMIN", // Dirección
    indiceOrden: 2,
    semanaId: semanaMenos2,
    proyectoId: "PRJ-1003"
  },
  {
    identificador: "TK-1011",
    fechaCreacion: getDateOffsetAsIso(0),
    titulo: "Revisión SEO Técnico Semanal",
    tipo: "Revision" as any,
    prioridad: "MEDIA",
    complejidad: 3,
    fechaDeseableFin: getDateOffsetAsYMD(2),
    observaciones: "Análisis de Core Web Vitals en la web del cliente B.",
    enlace: "",
    estado: "EN_CURSO",
    personaAsignadaId: "PR-1004", // Marcos
    indiceOrden: 2,
    semanaId: semanaActual,
    proyectoId: "PRJ-1002"
  },
  {
    identificador: "TK-1012",
    fechaCreacion: getDateOffsetAsIso(-5),
    titulo: "Maquetación de la Home page",
    tipo: "Desarrollo" as any,
    prioridad: "ALTA",
    complejidad: 8,
    fechaDeseableFin: getDateOffsetAsYMD(-1),
    observaciones: "Paso de diseño a HTML/React.",
    enlace: "",
    estado: "TERMINADO",
    personaAsignadaId: "PR-1002", // Carlos
    indiceOrden: 1,
    semanaId: semanaActual,
    proyectoId: "PRJ-1001"
  },
  {
    identificador: "TK-1013",
    fechaCreacion: getDateOffsetAsIso(-14),
    titulo: "Aprobación de Paleta de Colores",
    tipo: "Diseño" as any,
    prioridad: "MEDIA",
    complejidad: 2,
    fechaDeseableFin: getDateOffsetAsYMD(-12),
    observaciones: "Cliente 1 revisó y aprobó la guía de estilo.",
    enlace: "",
    estado: "TERMINADO",
    personaAsignadaId: "PR-1001", // Laura
    indiceOrden: 3,
    semanaId: semanaMenos2,
    proyectoId: "PRJ-1001"
  },
  {
    identificador: "TK-1014",
    fechaCreacion: getDateOffsetAsIso(-8),
    titulo: "Pago de impuestos Q3",
    tipo: "Planificacion",
    prioridad: "URGENTE",
    complejidad: 5,
    fechaDeseableFin: getDateOffsetAsYMD(-6),
    observaciones: "Gestión con el asesor contable.",
    enlace: "",
    estado: "TERMINADO",
    personaAsignadaId: "PR-ADMIN", // Dirección
    indiceOrden: 4,
    semanaId: semanaMenos1,
    proyectoId: "PRJ-1003"
  },
  {
    identificador: "TK-1015",
    fechaCreacion: getDateOffsetAsIso(-2),
    titulo: "Pruebas de estrés y carga",
    tipo: "Lanzamiento" as any,
    prioridad: "ALTA",
    complejidad: 5,
    fechaDeseableFin: getDateOffsetAsYMD(0),
    observaciones: "Asegurar que el backend resiste +10k req/s.",
    enlace: "",
    estado: "BLOQUEADO",
    personaAsignadaId: "PR-1003", // Elena
    indiceOrden: 0,
    semanaId: semanaActual,
    proyectoId: "PRJ-1001"
  }
]);
export function obtenerTareas(): Tarea[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(almacenamientoTareas);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Tarea[];
  } catch {
    return [];
  }
}

export function guardarTareas(tareas: Tarea[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(almacenamientoTareas, JSON.stringify(tareas));
  }
}
