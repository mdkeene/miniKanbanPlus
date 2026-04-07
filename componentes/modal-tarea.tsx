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
    setProyectos(obtenerProyectos());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[30px] border border-white/70 bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              {propiedades.modo === "crear" ? "Nueva tarea" : "Edición completa"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {propiedades.modo === "crear"
                ? "Crear una nueva tarea"
                : propiedades.tarea.identificador}
            </h2>
          </div>
          <button
            type="button"
            onClick={propiedades.onCerrar}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <EtiquetaCampo titulo="Título">
            <input
              value={formulario.titulo}
              onChange={(evento) => actualizarCampo("titulo", evento.target.value)}
              className="campo-formulario"
              maxLength={limitesSeguridad.tituloMaximo}
              placeholder="Ejemplo: Preparar reunión de dirección"
            />
          </EtiquetaCampo>

          <EtiquetaCampo titulo="Estado">
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
          </EtiquetaCampo>

          <EtiquetaCampo titulo="Tipo">
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
          </EtiquetaCampo>

          <EtiquetaCampo titulo="Prioridad">
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
          </EtiquetaCampo>

          <EtiquetaCampo titulo="Fecha deseable de fin">
            <input
              type="date"
              value={formulario.fechaDeseableFin}
              onChange={(evento) =>
                actualizarCampo("fechaDeseableFin", evento.target.value)
              }
              className="campo-formulario"
            />
          </EtiquetaCampo>

          <EtiquetaCampo titulo="Complejidad (Puntos)">
            <select
              value={formulario.complejidad}
              onChange={(evento) =>
                actualizarCampo("complejidad", parseInt(evento.target.value) as any)
              }
              className="campo-formulario"
            >
              {[1, 2, 3, 5, 8].map((v) => (
                <option key={v} value={v}>
                  {v} {v === 1 ? "punto" : "puntos"}
                </option>
              ))}
            </select>
          </EtiquetaCampo>

          <EtiquetaCampo titulo="Enlace">
            <input
              value={formulario.enlace}
              onChange={(evento) => actualizarCampo("enlace", evento.target.value)}
              className="campo-formulario"
              maxLength={2048}
              placeholder="https://..."
            />
          </EtiquetaCampo>

          <EtiquetaCampo titulo="Proyecto">
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
          </EtiquetaCampo>

          <EtiquetaCampo titulo="Persona responsable">
            <select
              value={formulario.personaAsignadaId}
              onChange={(evento) =>
                actualizarCampo("personaAsignadaId", evento.target.value)
              }
              className="campo-formulario"
            >
              {propiedades.personas.map((persona) => (
                <option key={persona.identificador} value={persona.identificador}>
                  {persona.nombre} · {persona.area}
                </option>
              ))}
            </select>
          </EtiquetaCampo>
        </div>

        <div className="mt-4">
          <EtiquetaCampo titulo="Observaciones">
            <textarea
              value={formulario.observaciones}
              onChange={(evento) =>
                actualizarCampo("observaciones", evento.target.value)
              }
              className="campo-formulario min-h-32 resize-none"
              maxLength={limitesSeguridad.observacionesMaximas}
              placeholder="Anota contexto, acuerdos o próximos pasos..."
            />
          </EtiquetaCampo>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {propiedades.modo === "editar" ? (
              <button
                type="button"
                onClick={() => propiedades.onEliminar(propiedades.tarea.identificador)}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900 transition hover:bg-rose-100"
              >
                Eliminar tarea
              </button>
            ) : null}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={propiedades.onCerrar}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {propiedades.modo === "crear" ? "Crear tarea" : "Guardar cambios"}
            </button>
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
