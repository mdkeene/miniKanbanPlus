import type { BorradorPersona, Persona, Tarea } from "@/tipos/tareas";
import {
  limpiarTextoPlano,
  limitesSeguridad,
  limitarColeccion,
  normalizarUrlImagen
} from "@/lib/seguridad";

export const almacenamientoPersonas = "miniKanbanPlus.personas.v3";

type GamaColor = {
  fondoA: string;
  fondoB: string;
  texto: string;
};

const gamasColor: GamaColor[] = [
  { fondoA: "#0ea5e9", fondoB: "#38bdf8", texto: "#f8fafc" },
  { fondoA: "#f59e0b", fondoB: "#fcd34d", texto: "#1f2937" },
  { fondoA: "#10b981", fondoB: "#6ee7b7", texto: "#052e16" },
  { fondoA: "#ec4899", fondoB: "#f9a8d4", texto: "#4a044e" },
  { fondoA: "#6366f1", fondoB: "#a5b4fc", texto: "#eef2ff" }
];

export function generarIdentificadorPersona() {
  return `PR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function obtenerIniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const iniciales = partes.slice(0, 2).map((parte) => parte[0]?.toUpperCase() ?? "");
  return iniciales.join("") || "P";
}

export function crearFotoAvatar(nombre: string, indiceColor = 0) {
  const gama = gamasColor[indiceColor % gamasColor.length];
  const iniciales = obtenerIniciales(nombre);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="fondo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${gama.fondoA}" />
          <stop offset="100%" stop-color="${gama.fondoB}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="42" fill="url(#fondo)" />
      <circle cx="120" cy="38" r="24" fill="rgba(255,255,255,0.22)" />
      <circle cx="32" cy="122" r="34" fill="rgba(255,255,255,0.15)" />
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
        font-family="Avenir Next, Trebuchet MS, sans-serif" font-size="54" font-weight="700"
        fill="${gama.texto}">
        ${iniciales}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function crearBorradorPersona(): BorradorPersona {
  return {
    nombre: "",
    area: "",
    foto: "",
    color: "#0ea5e9",
    rol: "usuario",
    clave: ""
  };
}

export function crearPersonaDesdeBorrador(
  borrador: BorradorPersona,
  indiceColor: number
): Persona {
  const nombre = limpiarTextoPlano(borrador.nombre, limitesSeguridad.nombreMaximo);

  return {
    identificador: generarIdentificadorPersona(),
    nombre,
    area: limpiarTextoPlano(borrador.area, limitesSeguridad.areaMaxima),
    foto: normalizarUrlImagen(borrador.foto) || crearFotoAvatar(nombre, indiceColor),
    color: borrador.color || gamasColor[indiceColor % gamasColor.length].fondoA,
    rol: borrador.rol || "usuario",
    clave: borrador.clave || ""
  };
}

export const personasEjemplo: Persona[] = [
  {
    identificador: "PR-ADMIN",
    nombre: "Dirección",
    area: "Administración",
    foto: "",
    color: "#0ea5e9",
    rol: "admin"
  },
  {
    identificador: "PR-1001",
    nombre: "Laura",
    area: "Diseño Gráfico",
    foto: crearFotoAvatar("Laura", 0),
    color: "#0ea5e9",
    rol: "usuario"
  },
  {
    identificador: "PR-1002",
    nombre: "Carlos",
    area: "Desarrollo",
    foto: crearFotoAvatar("Carlos", 1),
    color: "#f59e0b",
    rol: "usuario"
  },
  {
    identificador: "PR-1003",
    nombre: "Elena",
    area: "Lanzamiento y QA",
    foto: crearFotoAvatar("Elena", 4),
    color: "#8b5cf6",
    rol: "usuario"
  },
  {
    identificador: "PR-1004",
    nombre: "Marcos",
    area: "Marketing",
    foto: crearFotoAvatar("Marcos", 2),
    color: "#10b981",
    rol: "usuario"
  },
  {
    identificador: "PR-1005",
    nombre: "Sofía",
    area: "Publicidad",
    foto: crearFotoAvatar("Sofía", 3),
    color: "#ec4899",
    rol: "usuario"
  }
];


export function obtenerPersonas(): Persona[] {
  if (typeof window === "undefined") return [personasEjemplo[0]];
  const raw = window.localStorage.getItem(almacenamientoPersonas);
  if (!raw) return [personasEjemplo[0]];
  try {
    return JSON.parse(raw) as Persona[];
  } catch {
    return [personasEjemplo[0]];
  }
}

export function guardarPersonas(personas: Persona[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(almacenamientoPersonas, JSON.stringify(personas));
  }
}

export function guardarPersona(persona: Persona) {
  const personas = obtenerPersonas();
  const indice = personas.findIndex(p => p.identificador === persona.identificador);
  if (indice >= 0) {
    personas[indice] = persona;
  } else {
    personas.push(persona);
  }
  guardarPersonas(personas);
}

export function eliminarPersona(identificador: string) {
  const personas = obtenerPersonas().filter(p => p.identificador !== identificador);
  guardarPersonas(personas);
}

export function obtenerPersonaAleatoria(personas: Persona[]) {
  if (personas.length === 0) return null;
  const indice = Math.floor(Math.random() * personas.length);
  return personas[indice] ?? null;
}

export function obtenerIdentificadorPersonaAleatorio(personas: Persona[]) {
  return obtenerPersonaAleatoria(personas)?.identificador ?? "";
}

export function sincronizarTareasConPersonas(tareas: Tarea[], personas: Persona[]) {
  const identificadores = new Set(personas.map((persona) => persona.identificador));

  return tareas.map((tarea) => {
    if (tarea.personaAsignadaId && identificadores.has(tarea.personaAsignadaId)) {
      return tarea;
    }

    return {
      ...tarea,
      personaAsignadaId: obtenerIdentificadorPersonaAleatorio(personas)
    };
  });
}

export function buscarPersonaPorId(id: string): Persona | undefined {
  return obtenerPersonas().find((p) => p.identificador === id);
}

export function normalizarPersonas(personas: Persona[]) {
  return limitarColeccion(personas, limitesSeguridad.personasMaximas).map(
    (persona, indice) => {
      const nombre = limpiarTextoPlano(persona?.nombre, limitesSeguridad.nombreMaximo);
      const area = limpiarTextoPlano(persona?.area, limitesSeguridad.areaMaxima);

      return {
        identificador: limpiarTextoPlano(
          persona?.identificador,
          limitesSeguridad.nombreMaximo
        ) || generarIdentificadorPersona(),
        nombre: nombre || `Persona ${indice + 1}`,
        area: area || "Área no definida",
        foto:
          normalizarUrlImagen(persona?.foto) || crearFotoAvatar(nombre || "Persona", indice),
        color: persona?.color || gamasColor[indice % gamasColor.length].fondoA,
        rol: persona?.rol || "usuario",
        clave: persona?.clave || ""
      };
    }
  );
}

export function obtenerGamaColorRandom() {
  return gamasColor[Math.floor(Math.random() * gamasColor.length)].fondoA;
}
