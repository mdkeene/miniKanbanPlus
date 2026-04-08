export const estadosKanban = [
  "DEFINIDO",
  "EN_CURSO",
  "BLOQUEADO",
  "TERMINADO",
  "IDEA",
  "BACKLOG"
] as const;

export type EstadoKanban = (typeof estadosKanban)[number];

export const prioridadesTarea = ["BAJA", "MEDIA", "ALTA", "URGENTE"] as const;

export type PrioridadTarea = (typeof prioridadesTarea)[number];

export const tiposTarea = [
  "Reunion",
  "Analisis",
  "Planificacion",
  "Seguimiento",
  "Documentacion",
  "Coordinacion",
  "Ejecución"
] as const;

export type TipoTarea = (typeof tiposTarea)[number];

export type OrdenTablero =
  | "manual"
  | "titulo"
  | "tipo"
  | "prioridad"
  | "fechaDeseable"
  | "fechaCreacion";

export type SentidoOrden = "asc" | "desc";

export type RolUsuario = "admin" | "usuario";

export type Persona = {
  identificador: string;
  nombre: string;
  email: string;
  area: string;
  foto: string;
  color?: string; // Color personalizado para avatares
  rol?: RolUsuario;
  clave?: string;
};

export type Usuario = Persona & {
  clave?: string;
};

export type BorradorPersona = Omit<Persona, "identificador">;

export type Tarea = {
  identificador: string;
  fechaCreacion: string;
  titulo: string;
  tipo?: TipoTarea;
  prioridad: PrioridadTarea;
  fechaDeseableFin: string;
  observaciones: string;
  enlace: string;
  estado: EstadoKanban;
  personaAsignadaId: string;
  indiceOrden: number;
  semanaId: string; // Formato "YYYY-WNN" (ej. 2024-W12)
  proyectoId?: string;
  esUrgente?: boolean;
  esSpillover?: boolean;
  esDevuelto?: boolean;

  // Recurrencia
  esRecurrente?: boolean;
  frecuenciaRecurrencia?: "Semanal" | "Quincenal" | "Mensual" | "Anual";
  fechaFinRecurrencia?: string;
};

export type BorradorTarea = Omit<Tarea, "identificador" | "fechaCreacion" | "indiceOrden">;

export type Proyecto = {
  identificador: string;
  nombre: string;
  descripcion: string;
  color: string;
};

export type SemanaInfo = {
  id: string;
  numero: number;
  año: number;
  inicio: string; // ISO Date
  fin: string; // ISO Date
};

export type ConfiguracionCargaRapida = {
  lineas: string;
  tipo: TipoTarea;
  prioridad: PrioridadTarea;
  estado: EstadoKanban;
  fechaDeseableFin: string;
};

export type DestinoArrastre = {
  estado: EstadoKanban;
  indice: number;
  personaId?: string;
};

export type Sesion = {
  usuario: Persona;
  token: string;
};

export type ConfigTablero = {
  locked_in: boolean;
};
