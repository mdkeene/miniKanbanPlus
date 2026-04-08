"use client";

import { useState } from "react";
import { AvatarPersona } from "@/componentes/avatar-persona";
import { formatearFechaCorta } from "@/lib/tareas";
import type { Persona, PrioridadTarea, Tarea } from "@/tipos/tareas";

type PropiedadesTarjetaTarea = {
  tarea: Tarea;
  personaAsignada: Persona | null;
  arrastrable: boolean;
  estaArrastrando: boolean;
  onAbrir: () => void;
  onEditarTitulo: (identificador: string, titulo: string) => void;
  onIniciarArrastre: () => void;
  onFinalizarArrastre: () => void;
  seleccionada: boolean;
  alCambiarSeleccion: (seleccionada: boolean) => void;
  modoBloqueado?: boolean;
};

const bordesPrioridad: Record<PrioridadTarea, string> = {
  BAJA: "border-l-slate-200",
  MEDIA: "border-l-sky-400",
  ALTA: "border-l-amber-400",
  URGENTE: "border-l-rose-500"
};


export function TarjetaTarea({
  tarea,
  personaAsignada,
  arrastrable,
  estaArrastrando,
  onAbrir,
  onEditarTitulo,
  onIniciarArrastre,
  onFinalizarArrastre,
  seleccionada,
  alCambiarSeleccion,
  modoBloqueado = false
}: PropiedadesTarjetaTarea) {
  const [edicionRapida, setEdicionRapida] = useState(false);
  const [tituloTemporal, setTituloTemporal] = useState(tarea.titulo);

  function guardarTitulo() {
    onEditarTitulo(tarea.identificador, tituloTemporal);
    setEdicionRapida(false);
  }

  return (
    <article
      draggable={arrastrable && !edicionRapida}
      onDragStart={() => onIniciarArrastre()}
      onDragEnd={onFinalizarArrastre}
      onClick={() => {
        if (!edicionRapida) {
          onAbrir();
        }
      }}
      className={`group relative rounded-[24px] border border-slate-200/60 border-l-[6px] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/50 ${
        estaArrastrando ? "scale-[0.95] opacity-40" : "opacity-100"
      } ${arrastrable ? "cursor-grab active:cursor-grabbing" : "cursor-default"} ${
        seleccionada ? "ring-4 ring-sky-500/20 border-sky-500" : ""
      } ${bordesPrioridad[tarea.prioridad]}`}
    >
      <div className="flex flex-col gap-3">
        {/* Cabecera: ID y Complejidad */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={seleccionada}
              onChange={(e) => alCambiarSeleccion(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="h-4.5 w-4.5 rounded-lg border-2 border-slate-200 text-sky-600 transition focus:ring-sky-500/20 cursor-pointer"
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400/80">
              {tarea.identificador}
            </span>
          </div>
          <div className="flex gap-1 items-center">
            {(tarea.esUrgente || tarea.prioridad === 'URGENTE') && (
              <div className="relative group/siren">
                <img 
                  src={[
                    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjZidDRpajlhbjYwZ3p0bGN1eXFpcnN6djN4emFqNGhoemV2NDFqaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/snEeOh54kCFxe/giphy.gif",
                    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWFpYjFiNDV0cWtmanF5MDZheDQxZTM5NGtzZHdmMzZqYmhvcmgweiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/4fpYYc2GGxIB10f0t6/giphy.gif",
                    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDlqOWlzcjZsY204OXRrZzc5cDIyZzF0dTB0YjI3eW9mZ2hneXd6OCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mLOhDIEtkM92K3qtOM/giphy.gif"
                  ][Math.abs(tarea.identificador.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 3]} 
                  alt="Siren" 
                  className="h-8 w-8 rounded-lg object-cover shadow-sm border border-rose-200"
                />
              </div>
            )}
            {tarea.esUrgente && (
              <span className="flex h-5 items-center rounded-lg bg-rose-500 px-1.5 text-[8px] font-black text-white shadow-sm shadow-rose-200">
                🚨 URGENTE
              </span>
            )}
            {tarea.esSpillover && (
              <span className="flex h-5 items-center rounded-lg bg-amber-500 px-1.5 text-[8px] font-black text-white shadow-sm shadow-amber-200">
                📦 SPILLOVER
              </span>
            )}
            {tarea.esDevuelto && (
              <span className="flex h-5 items-center rounded-lg bg-indigo-500 px-1.5 text-[8px] font-black text-white shadow-sm shadow-indigo-200">
                ↩️ DEVUELTO
              </span>
            )}
          </div>
        </div>

        {/* Título o Edición */}
        <div className="flex-1 min-h-[40px]">
          {edicionRapida ? (
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              <input
                value={tituloTemporal}
                onChange={(evento) => setTituloTemporal(evento.target.value)}
                className="w-full rounded-2xl border-2 border-sky-100 bg-sky-50/30 px-4 py-2 text-sm font-bold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") guardarTitulo();
                  if (e.key === "Escape") setEdicionRapida(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={guardarTitulo}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black text-white hover:bg-slate-800 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEdicionRapida(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[11px] font-black text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <h3 className="text-[13px] font-black leading-[1.4] text-slate-950 transition-colors group-hover:text-sky-600 line-clamp-3">
              {tarea.titulo}
            </h3>
          )}
        </div>

        {/* Footer: Tags, Fecha y Avatar */}
        <div className="flex items-end justify-between mt-1 gap-2">
          <div className="flex flex-wrap items-center gap-2 max-w-[70%]">
            {tarea.fechaDeseableFin && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                  📅 {formatearFechaCorta(tarea.fechaDeseableFin)}
                </span>
              </div>
            )}
          </div>

          {personaAsignada && (
            <div className="shrink-0 transition-all duration-300 group-hover:scale-110">
              <AvatarPersona
                nombre={personaAsignada.nombre}
                foto={personaAsignada.foto}
                tamano="mini"
              />
            </div>
          )}
        </div>
      </div>

      {/* Botón de edición rápida */}
      {!edicionRapida && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEdicionRapida(true);
          }}
          className="absolute right-3 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white opacity-0 shadow-sm border border-slate-100 text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100 group-hover:opacity-100 disabled:hidden"
          disabled={modoBloqueado}
        >
          <span className="text-xs">✎</span>
        </button>
      )}
    </article>
  );
}
