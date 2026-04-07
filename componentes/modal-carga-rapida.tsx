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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex h-full w-full flex-col bg-white shadow-2xl overflow-y-auto sm:h-auto sm:max-w-2xl sm:rounded-[40px] border border-white/50 animate-in zoom-in-95 duration-200">
        
        {/* Header Premium */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 p-6 backdrop-blur-xl md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl shadow-inner">
              🚀
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
                Productividad Industrial
              </p>
              <h2 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                Carga Rápida de Tareas
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-950 transition-all font-bold"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 p-6 md:p-8 space-y-8">
          <div className="rounded-3xl bg-amber-50/50 p-6 border border-amber-100/50">
             <p className="text-sm font-bold leading-relaxed text-amber-900/70">
                Define una configuración común para todas las tareas y pega los títulos línea a línea. 
                Perfecto para planificaciones semanales intensas.
             </p>
          </div>

          {/* Área de Texto Principal */}
          <div className="space-y-2">
            <label className="etiqueta-campo ml-1">Títulos de Tareas (una por línea)</label>
            <textarea
              autoFocus
              value={configuracion.lineas}
              onChange={(evento) => actualizarCampo("lineas", evento.target.value)}
              className="campo-formulario min-h-[200px] resize-none text-base font-medium"
              placeholder={`- Analizar requisitos del proyecto\n- Diseñar interfaz de usuario\n- Implementar lógica de negocio`}
            />
            <p className="text-[10px] font-bold text-slate-400 text-right px-2">
               Máximo {limitesSeguridad.lineasCargaRapidaMaximas} tareas por carga.
            </p>
          </div>

          {/* Configuración Común */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="etiqueta-campo ml-1">Tipo de Tarea</label>
              <select
                value={configuracion.tipo}
                onChange={(evento) => actualizarCampo("tipo", evento.target.value as TipoTarea)}
                className="campo-formulario"
              >
                {opcionesTipo.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="etiqueta-campo ml-1">Prioridad Global</label>
              <select
                value={configuracion.prioridad}
                onChange={(evento) => actualizarCampo("prioridad", evento.target.value as PrioridadTarea)}
                className="campo-formulario"
              >
                {opcionesPrioridad.map((prioridad) => (
                  <option key={prioridad} value={prioridad}>{prioridad}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="etiqueta-campo ml-1">Estado Initial</label>
              <select
                value={configuracion.estado}
                onChange={(evento) => actualizarCampo("estado", evento.target.value as EstadoKanban)}
                className="campo-formulario"
              >
                {estadosKanban.map((estado) => (
                  <option key={estado} value={estado}>{etiquetasEstado[estado]}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="etiqueta-campo ml-1">Fecha Deseable</label>
              <input
                type="date"
                value={configuracion.fechaDeseableFin}
                onChange={(evento) => actualizarCampo("fechaDeseableFin", evento.target.value)}
                className="campo-formulario"
              />
            </div>
          </div>
        </div>

        {/* Footer Acciones */}
        <footer className="sticky bottom-0 border-t border-slate-100 bg-slate-50/80 p-6 backdrop-blur-md md:p-8">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="w-full rounded-[20px] border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onCrear(configuracion)}
              disabled={!configuracion.lineas.trim()}
              className="w-full rounded-[20px] bg-amber-500 px-8 py-4 text-sm font-black text-white shadow-xl shadow-amber-200 transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50 disabled:grayscale sm:w-auto"
            >
              🚀 Procesar {configuracion.lineas.split('\n').filter(l => l.trim()).length} Tareas
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
