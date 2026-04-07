export const estadosKanban = [
  "DEFINIDO",
  "EN_CURSO",
  "BLOQUEADO",
  "TERMINADO"
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

export const complejidadesTarea = [1, 2, 3, 5, 8] as const;
export type ComplejidadTarea = (typeof complejidadesTarea)[number];

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
  tipo: TipoTarea;
  prioridad: PrioridadTarea;
  complejidad: ComplejidadTarea;
  fechaDeseableFin: string;
  observaciones: string;
  enlace: string;
  estado: EstadoKanban;
  personaAsignadaId: string;
  indiceOrden: number;
  semanaId: string; // Formato "YYYY-WNN" (ej. 2024-W12)
  proyectoId?: string;
};

export type BorradorTarea = Omit<Tarea, "identificador" | "fechaCreacion" | "indiceOrden">;

export type FrecuenciaTarea = "Semanal" | "Quincenal" | "Mensual";

export type TareaPeriodica = {
  identificador: string;
  titulo: string;
  tipo: TipoTarea;
  prioridad: PrioridadTarea;
  complejidad: ComplejidadTarea;
  frecuencia: "Semanal" | "Quincenal" | "Mensual";
  activo: boolean;
  personaAsignadaId?: string;
};

export type Proyecto = {
  identificador: string;
  nombre: string;
  descripcion: string;
  color: string;
  tareasPeriodicas: TareaPeriodica[];
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
