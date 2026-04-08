"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  limpiarTextoMultilinea,
  limpiarTextoPlano,
  limitesSeguridad,
  normalizarUrlNavegable
} from "@/lib/seguridad";
import {
  type BorradorTarea,
  type EstadoKanban,
  type Persona,
  type PrioridadTarea,
  type Proyecto,
  type Tarea,
  type TipoTarea,
  estadosKanban
} from "@/tipos/tareas";
import { obtenerProyectos } from "@/lib/proyectos";
import { obtenerSesion } from "@/lib/auth";

type PropiedadesBase = {
  personas: Persona[];
  onCerrar: () => void;
  modoBloqueado?: boolean;
};

type PropiedadesCrear = PropiedadesBase & {
  modo: "crear";
  borrador: BorradorTarea;
  onGuardarNueva: (borrador: BorradorTarea) => void;
};

type PropiedadesEditar = PropiedadesBase & {
  modo: "editar";
  tarea: Tarea;
  onGuardarEdicion: (tarea: Tarea) => void;
  onEliminar: (identificador: string) => void;
  alPromoverASprint?: (tarea: Tarea) => void;
  alMoverABacklog?: (tarea: Tarea) => void;
};

type PropiedadesModalTarea = PropiedadesCrear | PropiedadesEditar;

const opcionesPrioridad: PrioridadTarea[] = ["BAJA", "MEDIA", "ALTA", "URGENTE"];

const etiquetasEstado: Record<EstadoKanban, string> = {
  DEFINIDO: "Definido",
  EN_CURSO: "En curso",
  BLOQUEADO: "Bloqueado",
  TERMINADO: "Terminado",
  IDEA: "Idea (Sin fecha ni responsable)",
  BACKLOG: "Backlog (Priorizado, sin fecha)"
};

export function ModalTarea(propiedades: PropiedadesModalTarea) {
  const [formulario, setFormulario] = useState<BorradorTarea>(() => {
    if (propiedades.modo === "editar") {
      return {
        titulo: propiedades.tarea.titulo,
        prioridad: propiedades.tarea.prioridad,
        fechaDeseableFin: propiedades.tarea.fechaDeseableFin,
        observaciones: propiedades.tarea.observaciones,
        enlace: propiedades.tarea.enlace,
        estado: propiedades.tarea.estado,
        personaAsignadaId: propiedades.tarea.personaAsignadaId,
        semanaId: propiedades.tarea.semanaId,
        proyectoId: propiedades.tarea.proyectoId
      };
    }
    return { ...propiedades.borrador };
  });
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      const [p, sesion] = await Promise.all([
        obtenerProyectos(),
        obtenerSesion()
      ]);
      setProyectos(p);

      // Default assignment logic:
      if (propiedades.modo === "crear" && !formulario.personaAsignadaId && sesion) {
        setFormulario(prev => ({ ...prev, personaAsignadaId: sesion.usuario.identificador }));
      }
    }
    cargar();
  }, []);

  function actualizarCampo<Clave extends keyof BorradorTarea>(
    clave: Clave,
    valor: BorradorTarea[Clave]
  ) {
    setFormulario((valorActual) => ({ ...valorActual, [clave]: valor }));
  }

  function guardar() {
    const titulo = limpiarTextoPlano(formulario.titulo, limitesSeguridad.tituloMaximo);
    const enlace = formulario.enlace.trim();

    if (!titulo) {
      setError("El título es obligatorio.");
      return;
    }

    // Las ideas se permiten sin asignar
    if (formulario.estado !== "IDEA" && propiedades.personas.length > 0 && !formulario.personaAsignadaId) {
      setError("Debes asignar una persona responsable para tareas fuera de IDEAS.");
      return;
    }

    if (enlace && !normalizarUrlNavegable(enlace)) {
      setError("El enlace debe usar https:// o una ruta relativa segura.");
      return;
    }

    const borradorNormalizado = {
      ...formulario,
      titulo,
      enlace,
      observaciones: limpiarTextoMultilinea(
        formulario.observaciones,
        limitesSeguridad.observacionesMaximas
      )
    };

    if (propiedades.modo === "crear") {
      propiedades.onGuardarNueva(borradorNormalizado);
      return;
    }

    propiedades.onGuardarEdicion({
      ...propiedades.tarea,
      ...borradorNormalizado
    });
  }

  const esEditar = propiedades.modo === "editar";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative my-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[calc(100vh-3rem)]">
        
        {/* Header - Anclado */}
        <div className="border-b border-slate-50 bg-slate-50/30 p-6 md:p-8 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-700">
                {esEditar ? `Edición: ${propiedades.tarea.identificador}` : "Nueva tarea"}
              </span>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                {esEditar ? "Actualizar información" : "Captura los detalles"}
              </h2>
              <div className="mt-2 flex gap-2">
                {formulario.esUrgente && (
                  <span className="rounded-lg bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">🚨 TAREA URGENTE</span>
                )}
                {formulario.esSpillover && (
                  <span className="rounded-lg bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">📦 SPILLOVER</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={propiedades.onCerrar}
              className="group flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-950"
            >
              <span className="text-xl font-bold">✕</span>
            </button>
          </div>
        </div>

        {/* Cuerpo - Scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="etiqueta-campo">Título de la tarea</label>
              <input
                value={formulario.titulo}
                onChange={(evento) => actualizarCampo("titulo", evento.target.value)}
                className="campo-formulario !text-lg focus:ring-4 focus:ring-sky-500/5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                disabled={propiedades.modoBloqueado && esEditar}
                maxLength={limitesSeguridad.tituloMaximo}
                placeholder="¿Qué hay que hacer?"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="etiqueta-campo">Estado</label>
              <select
                value={formulario.estado}
                onChange={(evento) =>
                  actualizarCampo("estado", evento.target.value as EstadoKanban)
                }
                className="campo-formulario"
              >
                {estadosKanban.map((estado) => (
                  <option key={estado} value={estado}>
                    {etiquetasEstado[estado]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="etiqueta-campo">Prioridad</label>
              <select
                value={formulario.prioridad}
                onChange={(evento) =>
                  actualizarCampo(
                    "prioridad",
                    evento.target.value as PrioridadTarea
                  )
                }
                className="campo-formulario font-bold"
              >
                {opcionesPrioridad.map((prioridad) => (
                  <option key={prioridad} value={prioridad}>
                    {prioridad}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="etiqueta-campo font-bold text-indigo-600">Persona Responsable</label>
              <select
                value={formulario.personaAsignadaId}
                onChange={(evento) =>
                  actualizarCampo("personaAsignadaId", evento.target.value)
                }
                className="campo-formulario border-indigo-100 bg-indigo-50/5"
              >
                <option value="">(Sin asignar - Solo Ideas)</option>
                {propiedades.personas.map((persona) => (
                  <option key={persona.identificador} value={persona.identificador}>
                    {persona.nombre} ({persona.area})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="etiqueta-campo">Fecha Límite</label>
              <input
                type="date"
                value={formulario.fechaDeseableFin}
                onChange={(evento) =>
                  actualizarCampo("fechaDeseableFin", evento.target.value)
                }
                className="campo-formulario [color-scheme:light]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="etiqueta-campo">Proyecto de Referencia</label>
              <select
                value={formulario.proyectoId || ""}
                onChange={(evento) =>
                  actualizarCampo("proyectoId", evento.target.value || undefined)
                }
                className="campo-formulario"
              >
                <option value="">Sin proyecto específico</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.identificador} value={proyecto.identificador}>
                    {proyecto.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="etiqueta-campo">Enlace Externo (Documentación)</label>
              <input
                value={formulario.enlace}
                onChange={(evento) => actualizarCampo("enlace", evento.target.value)}
                className="campo-formulario"
                maxLength={2048}
                placeholder="https://cloud.folder.com/..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="etiqueta-campo">Observaciones Estratégicas</label>
              <textarea
                value={formulario.observaciones}
                onChange={(evento) =>
                  actualizarCampo("observaciones", evento.target.value)
                }
                className="campo-formulario min-h-[140px] resize-none"
                maxLength={limitesSeguridad.observacionesMaximas}
                placeholder="Escribe aquí los detalles importantes para el equipo..."
              />
            </div>
          </div>

          {error && (
            <div className="mt-8 rounded-2xl bg-rose-50 p-4 text-center text-rose-600 font-bold border border-rose-100">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer - Anclado */}
        <div className="border-t border-slate-100 bg-slate-50/80 p-6 md:p-8 shrink-0 backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {esEditar && (
                <>
                  {!propiedades.modoBloqueado && (
                    <button
                      type="button"
                      onClick={() => propiedades.onEliminar(propiedades.tarea.identificador)}
                      className="flex-1 rounded-2xl bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100 sm:flex-none"
                    >
                      🗑️ Borrar
                    </button>
                  )}
                  {propiedades.tarea.estado === "BACKLOG" && propiedades.alPromoverASprint && (
                    <button
                      type="button"
                      onClick={() => propiedades.alPromoverASprint!(propiedades.tarea)}
                      className="flex-1 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-sky-500/20 transition hover:bg-sky-500 sm:flex-none"
                    >
                      🏎️ Sprint
                    </button>
                  )}
                  {propiedades.tarea.estado !== "IDEA" && propiedades.tarea.estado !== "BACKLOG" && propiedades.alMoverABacklog && (
                    <button
                      type="button"
                      onClick={() => propiedades.alMoverABacklog!(propiedades.tarea)}
                      className="flex-1 rounded-2xl bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-600 transition hover:bg-indigo-100 sm:flex-none"
                    >
                      📦 Backlog
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row shadow-sm">
              <button
                type="button"
                onClick={propiedades.onCerrar}
                className="rounded-2xl border border-slate-200 bg-white px-8 py-3 text-sm font-black text-slate-500 transition hover:border-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardar}
                className="rounded-2xl bg-slate-950 px-10 py-3 text-sm font-black text-white shadow-2xl shadow-slate-900/10 transition hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0"
              >
                {esEditar ? "Guardar Cambios" : "Crear Tarea"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type PropiedadesEtiquetaCampo = {
  titulo: string;
  children: ReactNode;
};

function EtiquetaCampo({ titulo, children }: PropiedadesEtiquetaCampo) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{titulo}</span>
      {children}
    </label>
  );
}
