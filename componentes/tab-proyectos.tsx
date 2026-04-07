"use client";

import { useState, useEffect } from "react";
import { 
  type Proyecto, 
  type TareaPeriodica,
  type FrecuenciaTarea,
  type TipoTarea,
  type PrioridadTarea,
  type ComplejidadTarea,
  type Persona,
  tiposTarea,
  prioridadesTarea,
  complejidadesTarea
} from "@/tipos/tareas";
import { 
  obtenerProyectos, 
  guardarProyecto, 
  eliminarProyecto,
  actualizarTareaPeriodica,
  eliminarTareaPeriodica,
  crearTareaPeriodicaVacia
} from "@/lib/proyectos";
import { generarIdentificador } from "@/lib/tareas";
import { obtenerPersonas } from "@/lib/personas";

export function TabProyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [editandoProyecto, setEditandoProyecto] = useState<Proyecto | null>(null);
  
  // Estados para Proyecto
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#0ea5e9");

  // Estados para Tarea Periódica
  const [proyectoParaTarea, setProyectoParaTarea] = useState<Proyecto | null>(null);
  const [editandoTarea, setEditandoTarea] = useState<TareaPeriodica | null>(null);
  const [formularioTP, setFormularioTP] = useState<TareaPeriodica>(crearTareaPeriodicaVacia());

  useEffect(() => {
    setProyectos(obtenerProyectos());
    setPersonas(obtenerPersonas());
  }, []);

  function handleGuardarProyecto() {
    if (!nuevoNombre.trim()) return;
    
    const proyecto: Proyecto = editandoProyecto ? {
      ...editandoProyecto,
      nombre: nuevoNombre,
      descripcion: nuevaDescripcion,
      color: nuevoColor
    } : {
      identificador: `PRJ-${generarIdentificador().split("-")[1]}`,
      nombre: nuevoNombre,
      descripcion: nuevaDescripcion,
      color: nuevoColor,
      tareasPeriodicas: []
    };

    guardarProyecto(proyecto);
    setProyectos(obtenerProyectos());
    cancelarEdicion();
  }

  function handleEliminarProyecto(id: string) {
    if (!confirm("¿Estás seguro de eliminar este proyecto y sus tareas periódicas?")) return;
    eliminarProyecto(id);
    setProyectos(obtenerProyectos());
  }

  function cancelarEdicion() {
    setEditandoProyecto(null);
    setNuevoNombre("");
    setNuevaDescripcion("");
    setNuevoColor("#0ea5e9");
  }

  function iniciarEdicion(p: Proyecto) {
    setEditandoProyecto(p);
    setNuevoNombre(p.nombre);
    setNuevaDescripcion(p.descripcion || "");
    setNuevoColor(p.color);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Columna Izquierda: Lista de Proyectos (Maestro) */}
      <div className="flex flex-col gap-4 lg:col-span-4 lg:sticky lg:top-32 max-h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between rounded-[32px] bg-white/80 p-5 shadow-panel backdrop-blur border border-white/70">
          <h2 className="text-xl font-bold text-slate-900">Proyectos</h2>
          <button 
            onClick={cancelarEdicion}
            className="flex h-10 items-center justify-center rounded-2xl bg-sky-100 px-4 text-sm font-black text-sky-600 transition-all hover:bg-sky-200 hover:scale-105 active:scale-95"
          >
            + Nuevo
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-4">
          {proyectos.length === 0 ? (
            <div className="text-center rounded-[24px] border border-dashed border-slate-300 p-8 text-slate-500">
              No hay proyectos activos. Usa el botón superior para crear uno.
            </div>
          ) : (
            proyectos.map((proyecto) => {
              const activo = editandoProyecto?.identificador === proyecto.identificador;
              return (
                <div 
                  key={proyecto.identificador}
                  onClick={() => iniciarEdicion(proyecto)}
                  className={`group relative flex cursor-pointer flex-col gap-1 rounded-[24px] border p-5 backdrop-blur transition-all ${
                    activo 
                      ? "border-sky-200 bg-white shadow-xl scale-[1.02] z-10" 
                      : "border-white/50 bg-white/60 shadow-sm hover:bg-white hover:shadow-md"
                  }`}
                >
                  <div 
                    className="absolute top-0 left-0 h-full w-2 rounded-l-[24px] transition-all" 
                    style={{ backgroundColor: proyecto.color }}
                  />
                  <div className="flex items-start justify-between pl-2">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {proyecto.identificador}
                      </span>
                      <h3 className={`text-base font-bold transition-colors ${activo ? "text-sky-600" : "text-slate-900 group-hover:text-sky-600"}`}>
                        {proyecto.nombre || "Sin Nombre"}
                      </h3>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEliminarProyecto(proyecto.identificador); }}
                      className={`rounded-xl p-2 transition-all ${activo ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "opacity-0 group-hover:opacity-100 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600"}`}
                      title="Eliminar Proyecto"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Columna Derecha: Detalle y Formulario */}
      <div className="flex flex-col gap-6 lg:col-span-8">
        
        {/* Formulario de Proyecto */}
        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-panel backdrop-blur xl:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {editandoProyecto ? "Editar Proyecto" : "Nuevo Proyecto"}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider pl-1">Nombre</label>
              <input 
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Nombre del proyecto..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
              />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider pl-1">Color</label>
              <div className="flex gap-2">
                <input 
                  type="color"
                  value={nuevoColor}
                  onChange={(e) => setNuevoColor(e.target.value)}
                  className="h-12 w-12 rounded-xl border-none p-1 cursor-pointer bg-white"
                />
                <input 
                  value={nuevoColor}
                  onChange={(e) => setNuevoColor(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider pl-1">Descripción</label>
              <textarea 
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                placeholder="Breve descripción de los objetivos..."
                className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {editandoProyecto && (
              <button 
                onClick={cancelarEdicion}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button 
              onClick={handleGuardarProyecto}
              className="rounded-2xl bg-sky-600 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-sky-100 hover:bg-sky-500 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              {editandoProyecto ? "Actualizar Proyecto" : "Crear Proyecto"}
            </button>
          </div>
        </section>

        {/* Tareas Periódicas (Solo si editando) */}
        {editandoProyecto && (
          <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-panel backdrop-blur xl:p-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Tareas Recurrentes</h3>
              <button 
                onClick={() => {
                  const pActual = proyectos.find(p => p.identificador === editandoProyecto.identificador);
                  if (pActual) {
                    setProyectoParaTarea(pActual);
                    setFormularioTP(crearTareaPeriodicaVacia());
                    setEditandoTarea(null);
                  }
                }}
                className="rounded-xl border-2 border-sky-100 bg-sky-50 px-4 py-2 text-xs font-black text-sky-600 transition-colors hover:bg-sky-100 active:scale-95"
              >
                + Añadir Tarea
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {proyectos.find(p => p.identificador === editandoProyecto.identificador)?.tareasPeriodicas.length === 0 ? (
                <p className="col-span-2 text-sm italic text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-[20px]">
                  No hay tareas periódicas configuradas en este proyecto.
                </p>
              ) : (
                proyectos.find(p => p.identificador === editandoProyecto.identificador)?.tareasPeriodicas.map(tarea => (
                  <div 
                    key={tarea.identificador} 
                    className="group flex flex-col justify-between gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{tarea.tipo}</span>
                        <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                          {tarea.complejidad} pts
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 mt-2 text-sm">{tarea.titulo}</h4>
                    </div>
                    
                    <div className="flex items-end justify-between mt-2 pt-3 border-t border-slate-200/50">
                      <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
                        ↻ {tarea.frecuencia}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const pActual = proyectos.find(p => p.identificador === editandoProyecto.identificador);
                            if (pActual) {
                              setProyectoParaTarea(pActual);
                              setEditandoTarea(tarea);
                              setFormularioTP(tarea);
                            }
                          }}
                          className="rounded-lg bg-white shadow-sm border border-slate-200 p-2 text-slate-500 hover:border-sky-300 hover:text-sky-600 transition-colors"
                          title="Editar tarea recurrente"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm("¿Eliminar esta tarea periódica?")) {
                              eliminarTareaPeriodica(editandoProyecto.identificador, tarea.identificador);
                              setProyectos(obtenerProyectos());
                            }
                          }}
                          className="rounded-lg bg-white shadow-sm border border-slate-200 p-2 text-slate-500 hover:border-rose-300 hover:text-rose-600 transition-colors"
                          title="Eliminar tarea recurrente"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* Modal de Tarea Periódica */}
      {proyectoParaTarea && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sky-950/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {editandoTarea ? "Editar Tarea Periódica" : "Nueva Tarea Periódica"}
              <span className="block text-sm font-medium text-slate-500 mt-1">
                Proyecto: {proyectoParaTarea.nombre}
              </span>
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 pl-1">Título</label>
                <input 
                  value={formularioTP.titulo}
                  onChange={e => setFormularioTP(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ej: Revisión semanal de métricas"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 pl-1">Frecuencia</label>
                <select 
                  value={formularioTP.frecuencia}
                  onChange={e => setFormularioTP(f => ({ ...f, frecuencia: e.target.value as FrecuenciaTarea }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 transition-all appearance-none bg-slate-50"
                >
                  <option value="Semanal">Semanal</option>
                  <option value="Quincenal">Quincenal</option>
                  <option value="Mensual">Mensual</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 pl-1">Tipo</label>
                <select 
                  value={formularioTP.tipo}
                  onChange={e => setFormularioTP(f => ({ ...f, tipo: e.target.value as TipoTarea }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 transition-all appearance-none bg-slate-50"
                >
                  {tiposTarea.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 pl-1">Prioridad</label>
                <select 
                  value={formularioTP.prioridad}
                  onChange={e => setFormularioTP(f => ({ ...f, prioridad: e.target.value as PrioridadTarea }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 transition-all appearance-none bg-slate-50"
                >
                  {prioridadesTarea.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 pl-1">Complejidad (Fibonacci)</label>
                <select 
                  value={formularioTP.complejidad}
                  onChange={e => setFormularioTP(f => ({ ...f, complejidad: parseInt(e.target.value) as ComplejidadTarea }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 transition-all appearance-none bg-slate-50"
                >
                  {complejidadesTarea.map(c => <option key={c} value={c}>{c} puntos</option>)}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 pl-1">Responsable Predeterminado</label>
                <select 
                  value={formularioTP.personaAsignadaId || ""}
                  onChange={e => setFormularioTP(f => ({ ...f, personaAsignadaId: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 transition-all appearance-none bg-slate-50"
                >
                  <option value="">Sin asignar</option>
                  {personas.map(p => <option key={p.identificador} value={p.identificador}>{p.nombre} ({p.area})</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setProyectoParaTarea(null)}
                className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (!formularioTP.titulo.trim()) return;
                  actualizarTareaPeriodica(proyectoParaTarea.identificador, formularioTP);
                  setProyectos(obtenerProyectos());
                  setProyectoParaTarea(null);
                }}
                className="rounded-2xl bg-sky-600 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-sky-100 hover:bg-sky-500 transition-all hover:-translate-y-0.5"
              >
                {editandoTarea ? "Actualizar Tarea" : "Crear Tarea"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
