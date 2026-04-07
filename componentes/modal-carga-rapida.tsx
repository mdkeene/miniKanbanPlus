"use client";

import { useState } from "react";
import { limitesSeguridad } from "@/lib/seguridad";
import {
  type ConfiguracionCargaRapida,
  type EstadoKanban,
  type PrioridadTarea,
  type TipoTarea,
  estadosKanban
} from "@/tipos/tareas";

type PropiedadesModalCargaRapida = {
  configuracionInicial: ConfiguracionCargaRapida;
  onCerrar: () => void;
  onCrear: (configuracion: ConfiguracionCargaRapida) => void;
};

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

export function ModalCargaRapida({
  configuracionInicial,
  onCerrar,
  onCrear
}: PropiedadesModalCargaRapida) {
  const [configuracion, setConfiguracion] = useState(configuracionInicial);

  function actualizarCampo<Clave extends keyof ConfiguracionCargaRapida>(
    clave: Clave,
    valor: ConfiguracionCargaRapida[Clave]
  ) {
    setConfiguracion((valorActual) => ({ ...valorActual, [clave]: valor }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[30px] border border-white/70 bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              Carga rápida
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Crear varias tareas de una vez
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pega una línea por tarea. También puedes definir el tipo, la
              prioridad, el estado inicial y una fecha deseable común.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Líneas de tareas
            </span>
            <textarea
              value={configuracion.lineas}
              onChange={(evento) => actualizarCampo("lineas", evento.target.value)}
              className="campo-formulario min-h-44 resize-none"
              maxLength={limitesSeguridad.lineasCargaRapidaMaximas * 160}
              placeholder={`- Preparar reunión de coordinación
- Revisar planificación trimestral
- Redactar propuesta inicial`}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Tipo</span>
            <select
              value={configuracion.tipo}
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
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Prioridad
            </span>
            <select
              value={configuracion.prioridad}
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
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Estado inicial
            </span>
            <select
              value={configuracion.estado}
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
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Fecha deseable
            </span>
            <input
              type="date"
              value={configuracion.fechaDeseableFin}
              onChange={(evento) =>
                actualizarCampo("fechaDeseableFin", evento.target.value)
              }
              className="campo-formulario"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onCrear(configuracion)}
            className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Crear tareas
          </button>
        </div>
      </div>
    </div>
  );
}
