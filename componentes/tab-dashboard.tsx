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
    async function cargar() {
      const [ts, prjs, ps] = await Promise.all([
        obtenerTareas(),
        obtenerProyectos(),
        obtenerPersonas()
      ]);
      setTareas(ts);
      setProyectos(prjs);
      setPersonas(ps);
    }
    cargar();
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
    const devueltas = tareasPeriodo.filter(t => t.esDevuelto).length;
    const spillovers = tareasPeriodo.filter(t => t.esSpillover).length;
    const urgentes = tareasPeriodo.filter(t => t.esUrgente).length;
    const pendientes = total - completadas;
    
    const porProyecto = proyectos.map(p => {
      const tareasProy = tareasPeriodo.filter(t => t.proyectoId === p.identificador);
      return {
        ...p,
        count: tareasProy.length,
        urgentes: tareasProy.filter(t => t.esUrgente).length
      };
    }).filter(p => p.count > 0);

    const porPersona = personas.map(per => {
      const tareasPers = tareasPeriodo.filter(t => t.personaAsignadaId === per.identificador);
      
      const pCompletadas = tareasPers.filter(t => t.estado === "TERMINADO").length;
      const pDevueltas = tareasPers.filter(t => t.esDevuelto).length;
      const pSpillovers = tareasPers.filter(t => t.esSpillover).length;
      const pUrgentes = tareasPers.filter(t => t.esUrgente).length;

      const desgloseProyectos = proyectos.map(proy => {
        const tProy = tareasPers.filter(t => t.proyectoId === proy.identificador);
        return {
          nombre: proy.nombre,
          color: proy.color,
          count: tProy.length
        };
      }).filter(dp => dp.count > 0);

      const sinProy = tareasPers.filter(t => !t.proyectoId);
      if (sinProy.length > 0) {
        desgloseProyectos.push({
          nombre: "Otros",
          color: "#cbd5e1",
          count: sinProy.length
        });
      }

      return {
        ...per,
        count: tareasPers.length,
        completadas: pCompletadas,
        devueltas: pDevueltas,
        spillovers: pSpillovers,
        urgentes: pUrgentes,
        desgloseProyectos
      };
    }).filter(p => p.count > 0);

    return {
      etiquetaPeriodo,
      total,
      completadas,
      devueltas,
      spillovers,
      urgentes,
      pendientes,
      porProyecto,
      porPersona,
      progreso: total > 0 ? Math.round((completadas / total) * 100) : 0
    };
  }, [tareas, proyectos, personas, tipoPeriodo, offset]);

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Tareas Totales", value: stats.total, unit: "items", sub: `${stats.completadas} completadas`, color: "slate", border: "border-slate-200" },
          { label: "Progreso Tareas", value: `${stats.progreso}%`, bar: stats.progreso, color: "sky", border: "border-sky-100" },
          { label: "Alertas Activas", value: stats.urgentes + stats.spillovers, unit: "urg/sp", sub: "Atención Requerida", color: "rose", border: "border-rose-100" }
        ].map((c, i) => (
          <div key={i} className={`rounded-[24px] border ${c.border} bg-white p-8 shadow-sm transition-all hover:border-sky-400 hover:shadow-md`}>
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
        {/* Distribución por Proyecto - SALUD DEL PROYECTO */}
        <section className="rounded-[24px] border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Salud por Proyecto</h3>
            <span className="rounded-full bg-slate-50 border border-slate-100 px-4 py-1 text-xs font-black text-slate-400 uppercase">Resumen de Carga</span>
          </div>
          <div className="space-y-6">
            {stats.porProyecto.length === 0 ? (
              <p className="text-base text-slate-400 italic">No hay datos por proyecto esta semana.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="pb-4">Proyecto</th>
                      <th className="pb-4 text-center">Tareas</th>
                      <th className="pb-4 text-right">Urgentes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.porProyecto.map(p => (
                      <tr key={p.identificador} className="group">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="font-black text-slate-900">{p.nombre}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center font-bold text-slate-600">{p.count}</td>
                        <td className="py-4 text-right font-black text-slate-900">{p.urgentes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Detalle de Rendimiento Individual */}
        <section className="rounded-[24px] border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Detalle por Persona</h3>
            <span className="rounded-full bg-sky-50 border border-sky-100 px-4 py-1 text-xs font-black text-sky-600 uppercase">Métricas</span>
          </div>
          <div className="space-y-6">
            {stats.porPersona.length === 0 ? (
              <p className="text-base text-slate-400 italic">No hay asignaciones en este periodo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="pb-4">Persona</th>
                      <th className="pb-4 text-center">Done</th>
                      <th className="pb-4 text-center">D/S</th>
                      <th className="pb-4 text-right">Urg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.porPersona.sort((a, b) => b.count - a.count).map(p => (
                      <tr key={p.identificador} className="group">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg flex shrink-0 items-center justify-center font-black text-xs text-white" style={{ backgroundColor: p.color || "#0ea5e9" }}>
                              {p.nombre[0]}
                            </div>
                            <span className="font-bold text-slate-900">{p.nombre}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="font-black text-emerald-600">{p.completadas}</span>
                        </td>
                        <td className="py-4 text-center">
                          {(p.devueltas + p.spillovers) > 0 ? (
                            <span className="font-bold text-slate-500">{p.devueltas + p.spillovers}</span>
                          ) : (
                            <span className="text-slate-200">-</span>
                          )}
                        </td>
                        <td className="py-4 text-right font-black text-slate-900">{p.urgentes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Tarjetas Visuales Detalladas - FLAT STYLE */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.porPersona.map((p) => (
          <div key={p.identificador} className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-6 transition-all hover:border-sky-300 hover:shadow-md">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl flex shrink-0 items-center justify-center font-black text-lg text-white" style={{ backgroundColor: p.color || "#0ea5e9" }}>
                  {p.foto ? <img src={p.foto} className="h-full w-full object-cover" /> : p.nombre[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-black text-slate-900 truncate">{p.nombre}</div>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{p.area}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-sky-600">{p.count}</div>
                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tareas</div>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-50">
               <div className="text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Completadas</p>
                 <p className="font-black text-emerald-600">{p.completadas}</p>
               </div>
               <div className="text-center border-x border-slate-50">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Devueltas</p>
                 <p className="font-black text-slate-900">{p.devueltas + p.spillovers}</p>
               </div>
               <div className="text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Urgentes</p>
                 <p className="font-black text-rose-600">{p.urgentes}</p>
               </div>
             </div>

             <div className="space-y-2">
                {p.desgloseProyectos.slice(0, 3).map(dp => (
                   <div key={dp.nombre} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                         <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: dp.color }} />
                         <span className="font-bold text-slate-600 truncate">{dp.nombre}</span>
                      </div>
                      <span className="font-black text-slate-900">{dp.count}</span>
                   </div>
                ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
