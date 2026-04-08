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
  TERMINADO: "Terminado",
  IDEA: "Idea",
  BACKLOG: "Backlog"
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 p-0 sm:p-4 md:p-10 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex h-full w-full flex-col bg-white shadow-2xl overflow-hidden sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-[32px] md:rounded-[40px] border border-white/50 animate-in zoom-in-95 duration-200">
        
        {/* Header Premium (Pinned) */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-white/80 p-5 md:p-6 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-xl shadow-inner">
              🚀
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 leading-none mb-1">
                Batch Productivity
              </p>
              <h2 className="text-lg font-black tracking-tight text-slate-950 md:text-xl leading-none">
                Carga Rápida
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-950 transition-all font-bold"
          >
            ✕
          </button>
        </header>

        {/* Work Area (Independently Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 custom-scrollbar">
          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
             <p className="text-xs font-bold leading-relaxed text-slate-500">
                Pega tus títulos línea a línea. Cada salto de línea creará una tarea nueva con la configuración definida debajo.
             </p>
          </div>

          {/* Text Input Focus Area */}
          <div className="space-y-1.5 focus-within:translate-y-[-2px] transition-transform">
            <label className="etiqueta-campo ml-1 text-[11px]">Títulos (una por línea)</label>
            <textarea
              autoFocus
              value={configuracion.lineas}
              onChange={(evento) => actualizarCampo("lineas", evento.target.value)}
              className="campo-formulario min-h-[140px] md:min-h-[180px] resize-none text-base font-medium bg-slate-50"
              placeholder={`- Revisar KPI generales\n- Coordinar equipo de ventas\n- Preparar demo técnica`}
            />
          </div>

          {/* Configuration Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="etiqueta-campo ml-1 text-[11px]">Tipo de Tarea</label>
              <select
                value={configuracion.tipo}
                onChange={(evento) => actualizarCampo("tipo", evento.target.value as TipoTarea)}
                className="campo-formulario h-11 text-sm"
              >
                {opcionesTipo.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="etiqueta-campo ml-1 text-[11px]">Prioridad Global</label>
              <select
                value={configuracion.prioridad}
                onChange={(evento) => actualizarCampo("prioridad", evento.target.value as PrioridadTarea)}
                className="campo-formulario h-11 text-sm"
              >
                {opcionesPrioridad.map((prioridad) => (
                  <option key={prioridad} value={prioridad}>{prioridad}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="etiqueta-campo ml-1 text-[11px]">Estado Inicial</label>
              <select
                value={configuracion.estado}
                onChange={(evento) => actualizarCampo("estado", evento.target.value as EstadoKanban)}
                className="campo-formulario h-11 text-sm"
              >
                {estadosKanban.map((estado) => (
                  <option key={estado} value={estado}>{etiquetasEstado[estado]}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="etiqueta-campo ml-1 text-[11px]">Fecha Límite</label>
              <input
                type="date"
                value={configuracion.fechaDeseableFin}
                onChange={(evento) => actualizarCampo("fechaDeseableFin", evento.target.value)}
                className="campo-formulario h-11 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions (Pinned) */}
        <footer className="border-t border-slate-100 bg-slate-50/50 p-5 md:p-6 shrink-0">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onCrear(configuracion)}
              disabled={!configuracion.lineas.trim()}
              className="w-full rounded-2xl bg-slate-950 px-8 py-3 text-sm font-black text-white shadow-xl shadow-slate-950/20 transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 sm:w-auto"
            >
              🚀 Procesar {configuracion.lineas.split('\n').filter(l => l.trim()).length} Tareas
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
