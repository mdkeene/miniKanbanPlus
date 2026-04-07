"use client";

import { useMemo, useState, useEffect } from "react";
import { type Tarea, type Proyecto, type Persona } from "@/tipos/tareas";
import { obtenerTareas } from "@/lib/tareas";
import { obtenerProyectos } from "@/lib/proyectos";
import { obtenerPersonas } from "@/lib/personas";
import { obtenerSemanaActual, calcularRangoSemana } from "@/lib/semanas";

export function TabDashboard() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [tipoPeriodo, setTipoPeriodo] = useState<"semana" | "mes" | "año">("semana");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setTareas(obtenerTareas());
    setProyectos(obtenerProyectos());
    setPersonas(obtenerPersonas());
  }, []);

  const stats = useMemo(() => {
    const ahora = new Date();
    let fechaInicio = new Date(ahora);
    let fechaFin = new Date(ahora);
    let etiquetaPeriodo = "";

    if (tipoPeriodo === "semana") {
      fechaInicio.setDate(ahora.getDate() + (offset * 7));
      const diaSemana = fechaInicio.getDay() || 7;
      fechaInicio.setDate(fechaInicio.getDate() - diaSemana + 1); // Lunes
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaInicio.getDate() + 6); // Domingo
      const fIn = fechaInicio.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const fOut = fechaFin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      etiquetaPeriodo = `Semana: ${fIn} - ${fOut}`;
    } else if (tipoPeriodo === "mes") {
      fechaInicio.setMonth(ahora.getMonth() + offset);
      fechaInicio.setDate(1);
      fechaFin = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0);
      const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      etiquetaPeriodo = `${meses[fechaInicio.getMonth()]} ${fechaInicio.getFullYear()}`;
    } else {
      fechaInicio.setFullYear(ahora.getFullYear() + offset);
      fechaInicio.setMonth(0, 1);
      fechaFin = new Date(fechaInicio.getFullYear(), 11, 31);
      etiquetaPeriodo = `Año ${fechaInicio.getFullYear()}`;
    }

    fechaInicio.setHours(0,0,0,0);
    fechaFin.setHours(23,59,59,999);

    const tareasPeriodo = tareas.filter(t => {
      const d = new Date(t.fechaCreacion);
      return d >= fechaInicio && d <= fechaFin;
    });

    const total = tareasPeriodo.length;
    const completadas = tareasPeriodo.filter(t => t.estado === "TERMINADO").length;
    const pendientes = total - completadas;
    const puntosTotales = tareasPeriodo.reduce((sum, t) => sum + (t.complejidad || 0), 0);
    const puntosCompletados = tareasPeriodo
      .filter(t => t.estado === "TERMINADO")
      .reduce((sum, t) => sum + (t.complejidad || 0), 0);

    const porProyecto = proyectos.map(p => {
      const tareasProy = tareasPeriodo.filter(t => t.proyectoId === p.identificador);
      return {
        ...p,
        count: tareasProy.length,
        puntos: tareasProy.reduce((sum, t) => sum + (t.complejidad || 0), 0)
      };
    }).filter(p => p.count > 0);

    const porPersona = personas.map(per => {
      const tareasPers = tareasPeriodo.filter(t => t.personaAsignadaId === per.identificador);
      const puntosPers = tareasPers.reduce((sum, t) => sum + (t.complejidad || 0), 0);
      
      const desgloseProyectos = proyectos.map(proy => {
        const tProy = tareasPers.filter(t => t.proyectoId === proy.identificador);
        return {
          nombre: proy.nombre,
          color: proy.color,
          puntos: tProy.reduce((sum, t) => sum + (t.complejidad || 0), 0)
        };
      }).filter(dp => dp.puntos > 0);

      const sinProy = tareasPers.filter(t => !t.proyectoId);
      if (sinProy.length > 0) {
        desgloseProyectos.push({
          nombre: "Otros",
          color: "#cbd5e1",
          puntos: sinProy.reduce((sum, t) => sum + (t.complejidad || 0), 0)
        });
      }

      return {
        ...per,
        count: tareasPers.length,
        puntos: puntosPers,
        desgloseProyectos
      };
    }).filter(p => p.count > 0);

    return {
      etiquetaPeriodo,
      total,
      completadas,
      pendientes,
      puntosTotales,
      puntosCompletados,
      porProyecto,
      porPersona,
      progreso: total > 0 ? Math.round((completadas / total) * 100) : 0,
      progresoPuntos: puntosTotales > 0 ? Math.round((puntosCompletados / puntosTotales) * 100) : 0
    };
  }, [tareas, proyectos, personas, tipoPeriodo, offset]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Selector de Periodo y Resumen */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Rendimiento Operativo</h2>
          <p className="text-lg text-slate-500 font-bold capitalize mt-1">{stats.etiquetaPeriodo}</p>
        </div>
        
        {/* Controles de Navegación Temporal */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
            {(["semana", "mes", "año"] as const).map(p => (
              <button
                key={p}
                onClick={() => { setTipoPeriodo(p); setOffset(0); }}
                className={`px-4 py-2 rounded-lg text-sm font-black capitalize transition-all ${tipoPeriodo === p ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOffset(o => o - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 font-bold transition-all">
              ←
            </button>
            <button onClick={() => setOffset(0)} className="px-4 h-10 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
              Actual
            </button>
            <button onClick={() => setOffset(o => o + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 font-bold transition-all">
              →
            </button>
          </div>
        </div>
      </header>

      {/* Tarjetas de Resumen */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tareas Totales", value: stats.total, unit: "items", sub: `${stats.completadas} completadas`, color: "slate" },
          { label: "Puntos de Esfuerzo", value: stats.puntosTotales, unit: "pts", sub: "Carga Fibonacci", color: "sky" },
          { label: "Progreso Tareas", value: `${stats.progreso}%`, bar: stats.progreso, color: "slate" },
          { label: "Progreso Esfuerzo", value: `${stats.progresoPuntos}%`, bar: stats.progresoPuntos, color: "sky" }
        ].map((c, i) => (
          <div key={i} className="rounded-[40px] border border-white bg-white/80 p-8 shadow-panel backdrop-blur transition-transform hover:scale-[1.02]">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{c.label}</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-5xl font-black ${c.color === "sky" ? "text-sky-600" : "text-slate-900"}`}>{c.value}</span>
              {c.unit && <span className="text-sm font-bold text-slate-400">{c.unit}</span>}
            </div>
            {c.bar !== undefined ? (
              <div className={`mt-6 h-3 w-full rounded-full overflow-hidden ${c.color === "sky" ? "bg-sky-100" : "bg-slate-100"}`}>
                <div 
                  className={`h-full transition-all duration-1000 ${c.color === "sky" ? "bg-sky-500" : "bg-indigo-500"}`}
                  style={{ width: `${c.bar}%` }}
                />
              </div>
            ) : (
              <p className="mt-4 text-xs font-black text-slate-500 uppercase tracking-wider">{c.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Distribución por Proyecto */}
        <section className="rounded-[40px] border border-white bg-white p-10 shadow-panel">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Carga por Proyecto</h3>
            <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-black text-slate-500 uppercase">Resumen</span>
          </div>
          <div className="space-y-8">
            {stats.porProyecto.length === 0 ? (
              <p className="text-base text-slate-400 italic">No hay datos por proyecto esta semana.</p>
            ) : (
              stats.porProyecto.map(p => (
                <div key={p.identificador} className="space-y-3">
                  <div className="flex justify-between text-base font-black text-slate-900">
                    <span>{p.nombre}</span>
                    <span className="text-slate-400">{p.puntos} pts</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-slate-50 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 shadow-inner" 
                      style={{ 
                        width: `${(p.puntos / stats.puntosTotales) * 100}%`,
                        backgroundColor: p.color
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Distribución por Persona - RENDIMIENTO COMPARATIVO */}
        <section className="rounded-[40px] border border-white bg-white p-10 shadow-panel">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Rendimiento por Persona</h3>
            <span className="rounded-full bg-sky-50 px-4 py-1 text-xs font-black text-sky-600 uppercase">Proyectos</span>
          </div>
          <div className="grid gap-6">
            {stats.porPersona.length === 0 ? (
              <p className="text-base text-slate-400 italic">No hay asignaciones en este periodo.</p>
            ) : (
              stats.porPersona.sort((a, b) => b.puntos - a.puntos).map((p, idx) => (
                <div key={p.identificador} className="group relative flex flex-col gap-4 rounded-3xl border-2 border-slate-50 bg-white p-6 transition-all hover:border-sky-100 hover:shadow-xl">
                  <div className="flex items-center gap-6">
                    {/* Rank Badge */}
                    <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-xs font-black text-white shadow-lg">
                      #{idx + 1}
                    </div>
                    
                    <div className="h-16 w-16 rounded-2xl border-4 border-white shadow-xl flex shrink-0 items-center justify-center font-black text-xl text-white overflow-hidden" style={{ backgroundColor: p.color || "#0ea5e9" }}>
                      {p.foto ? <img src={p.foto} className="h-full w-full object-cover" /> : p.nombre[0]}
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-xl font-black text-slate-900">{p.nombre}</div>
                      <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{p.area}</div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end shrink-0">
                      <div className="text-3xl font-black text-sky-600">{p.puntos}</div>
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Puntos</div>
                    </div>
                  </div>

                  {/* Desglose por Proyecto */}
                  <div className="mt-2 space-y-2 border-t border-slate-100 pt-4">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Distribución de Proyectos</p>
                    {p.desgloseProyectos.map(dp => (
                       <div key={dp.nombre} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                             <div className="h-2 w-2 rounded-full" style={{ backgroundColor: dp.color }} />
                             <span className="font-bold text-slate-700 truncate max-w-[200px]">{dp.nombre}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="font-black text-slate-900">{dp.puntos} pts</span>
                             <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full" style={{ width: `${(dp.puntos / p.puntos) * 100}%`, backgroundColor: dp.color }} />
                             </div>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
