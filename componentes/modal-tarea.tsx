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

type PropiedadesBase = {
  personas: Persona[];
  onCerrar: () => void;
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
};

type PropiedadesModalTarea = PropiedadesCrear | PropiedadesEditar;

const opcionesTipo: TipoTarea[] = [
  "Reunion",
  "Analisis",
  "Planificacion",
  "Seguimiento",
  "Documentacion",
  "Coordinacion",
  "Ejecución"
];
const opcionesPrioridad: PrioridadTarea[] = ["BAJA", "MEDIA", "ALTA", "URGENTE"];

const etiquetasEstado: Record<EstadoKanban, string> = {
  DEFINIDO: "Definido",
  EN_CURSO: "En curso",
  BLOQUEADO: "Bloqueado",
  TERMINADO: "Terminado"
};

export function ModalTarea(propiedades: PropiedadesModalTarea) {
  const estadoInicial =
    propiedades.modo === "crear"
      ? propiedades.borrador
      : {
          titulo: propiedades.tarea.titulo,
          tipo: propiedades.tarea.tipo,
          prioridad: propiedades.tarea.prioridad,
          complejidad: propiedades.tarea.complejidad,
          fechaDeseableFin: propiedades.tarea.fechaDeseableFin,
          observaciones: propiedades.tarea.observaciones,
          enlace: propiedades.tarea.enlace,
          estado: propiedades.tarea.estado,
          personaAsignadaId: propiedades.tarea.personaAsignadaId,
          semanaId: propiedades.tarea.semanaId,
          proyectoId: propiedades.tarea.proyectoId
        };

  const [formulario, setFormulario] = useState<BorradorTarea>(estadoInicial);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      const p = await obtenerProyectos();
      setProyectos(p);
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

    if (propiedades.personas.length > 0 && !formulario.personaAsignadaId) {
      setError("Debes asignar una persona responsable.");
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-[40px] border border-white/60 bg-white shadow-2xl animate-in zoom-in-95 duration-200 lg:max-h-[92vh]">
        {/* Header del Modal */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-700">
                {propiedades.modo === "crear" ? "Nueva tarea" : `Edición: ${propiedades.tarea.identificador}`}
              </span>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                {propiedades.modo === "crear" ? "Captura los detalles" : "Actualizar información"}
              </h2>
            </div>
            <button
              type="button"
              onClick={propiedades.onCerrar}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl text-slate-400 transition hover:border-slate-300 hover:text-slate-950"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="etiqueta-campo">Título de la tarea</label>
              <input
                value={formulario.titulo}
                onChange={(evento) => actualizarCampo("titulo", evento.target.value)}
                className="campo-formulario !text-lg"
                maxLength={limitesSeguridad.tituloMaximo}
                placeholder="¿Qué hay que hacer?"
                autoFocus
              />
            </div>

            <div>
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

            <div>
              <label className="etiqueta-campo">Tipo de Actividad</label>
              <select
                value={formulario.tipo}
                onChange={(evento) =>
                  actualizarCampo("tipo", evento.target.value as TipoTarea)
                }
                className="campo-formulario"
              >
                {opcionesTipo.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="etiqueta-campo">Prioridad</label>
              <select
                value={formulario.prioridad}
                onChange={(evento) =>
                  actualizarCampo(
                    "prioridad",
                    evento.target.value as PrioridadTarea
                  )
                }
                className="campo-formulario"
              >
                {opcionesPrioridad.map((prioridad) => (
                  <option key={prioridad} value={prioridad}>
                    {prioridad}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="etiqueta-campo">Complejidad</label>
              <select
                value={formulario.complejidad}
                onChange={(evento) =>
                  actualizarCampo("complejidad", parseInt(evento.target.value) as any)
                }
                className="campo-formulario"
              >
                {[1, 2, 3, 5, 8].map((v) => (
                  <option key={v} value={v}>
                    {v} {v === 1 ? "Punto (Muy fácil)" : "Puntos"}
                  </option>
                ))}
              </select>
            </div>

            <div>
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

            <div>
              <label className="etiqueta-campo">Persona Responsable</label>
              <select
                value={formulario.personaAsignadaId}
                onChange={(evento) =>
                  actualizarCampo("personaAsignadaId", evento.target.value)
                }
                className="campo-formulario font-bold"
              >
                {propiedades.personas.map((persona) => (
                  <option key={persona.identificador} value={persona.identificador}>
                    {persona.nombre} ({persona.area})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="etiqueta-campo">Proyecto Relacionado</label>
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
              <label className="etiqueta-campo">Enlace de Referencia</label>
              <input
                value={formulario.enlace}
                onChange={(evento) => actualizarCampo("enlace", evento.target.value)}
                className="campo-formulario"
                maxLength={2048}
                placeholder="https://cloud.folder.com/..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="etiqueta-campo">Observaciones y Notas</label>
              <textarea
                value={formulario.observaciones}
                onChange={(evento) =>
                  actualizarCampo("observaciones", evento.target.value)
                }
                className="campo-formulario min-h-[160px] resize-none"
                maxLength={limitesSeguridad.observacionesMaximas}
                placeholder="Escribe aquí los detalles importantes..."
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-[24px] bg-rose-50 p-5 text-center text-rose-700 font-bold border border-rose-100 animate-bounce">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {propiedades.modo === "editar" && (
                <button
                  type="button"
                  onClick={() => propiedades.onEliminar(propiedades.tarea.identificador)}
                  className="w-full rounded-2xl bg-rose-50 px-6 py-4 text-sm font-black text-rose-600 transition hover:bg-rose-100 sm:w-auto"
                >
                  🗑️ Eliminar Tarea
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={propiedades.onCerrar}
                className="rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardar}
                className="rounded-2xl bg-slate-950 px-10 py-4 text-sm font-black text-white shadow-2xl shadow-slate-900/20 transition hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0"
              >
                {propiedades.modo === "crear" ? "Crear Tarea" : "Guardar Cambios"}
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
