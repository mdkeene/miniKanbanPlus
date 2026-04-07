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
};

const bordesPrioridad: Record<PrioridadTarea, string> = {
  BAJA: "border-l-slate-200",
  MEDIA: "border-l-sky-400",
  ALTA: "border-l-amber-400",
  URGENTE: "border-l-rose-500"
};

function BarrasComplejidad({ puntos }: { puntos: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: Math.min(puntos, 8) }).map((_, i) => (
        <div key={i} className={`h-3 w-1 rounded-full ${
          puntos <= 3 ? "bg-emerald-400" : puntos <= 5 ? "bg-sky-500" : "bg-amber-500"
        }`} />
      ))}
    </div>
  );
}

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
  alCambiarSeleccion
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
      className={`group relative rounded-2xl border border-slate-200 border-l-4 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
        estaArrastrando ? "scale-[0.95] opacity-40" : "opacity-100"
      } ${arrastrable ? "cursor-grab active:cursor-grabbing" : "cursor-default"} ${
        seleccionada ? "ring-2 ring-sky-500 ring-offset-2" : ""
      } ${bordesPrioridad[tarea.prioridad]}`}
    >
      <div className="flex flex-col gap-2">
        {/* Cabecera: ID y Complejidad */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={seleccionada}
              onChange={(e) => alCambiarSeleccion(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded-md border-slate-300 text-sky-500 transition focus:ring-sky-500/20 cursor-pointer"
            />
            <span className="text-[10px] font-bold tracking-tight text-slate-400">
              {tarea.identificador}
            </span>
          </div>
          <BarrasComplejidad puntos={tarea.complejidad} />
        </div>

        {/* Título o Edición */}
        <div className="min-h-[40px]">
          {edicionRapida ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <input
                value={tituloTemporal}
                onChange={(evento) => setTituloTemporal(evento.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-sky-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") guardarTitulo();
                  if (e.key === "Escape") setEdicionRapida(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={guardarTitulo}
                  className="rounded-lg bg-slate-900 px-3 py-1 text-[10px] font-bold text-white hover:bg-slate-800"
                >
                  Listo
                </button>
                <button
                  onClick={() => setEdicionRapida(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <h3 className="text-[12px] font-black leading-tight text-slate-900 transition-colors group-hover:text-sky-600">
                {tarea.titulo}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  {tarea.tipo}
                </span>
                {tarea.fechaDeseableFin && (
                  <>
                    <span className="text-[9px] text-slate-300">•</span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {formatearFechaCorta(tarea.fechaDeseableFin)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar flotante */}
      {personaAsignada && (
        <div className="absolute bottom-3 right-3 transition-transform group-hover:scale-110">
          <AvatarPersona
            nombre={personaAsignada.nombre}
            foto={personaAsignada.foto}
            tamano="mini"
          />
        </div>
      )}

      {/* Botón de edición rápida invisible hasta hover */}
      {!edicionRapida && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEdicionRapida(true);
          }}
          className="absolute right-3 top-7 flex h-7 w-7 items-center justify-center rounded-full bg-white opacity-0 shadow-sm border border-slate-100 transition-all hover:bg-slate-50 group-hover:opacity-100"
        >
          <span className="text-xs">✎</span>
        </button>
      )}
    </article>
  );
}
