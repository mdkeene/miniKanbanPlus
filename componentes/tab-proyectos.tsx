"use client";

import { useState, useEffect } from "react";
import { 
  type Proyecto, 
  type Persona,
  tiposTarea,
  prioridadesTarea
} from "@/tipos/tareas";
import { 
  obtenerProyectos, 
  guardarProyecto, 
  eliminarProyecto
} from "@/lib/proyectos";
import { obtenerPersonas } from "@/lib/personas";

export function TabProyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [editandoProyecto, setEditandoProyecto] = useState<Proyecto | null>(null);
  
  // Estados para Proyecto
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#0ea5e9");
  const [nuevoOrden, setNuevoOrden] = useState(0);

  useEffect(() => {
    async function cargar() {
      const [ps, prjs] = await Promise.all([
        obtenerPersonas(),
        obtenerProyectos()
      ]);
      setPersonas(ps);
      setProyectos(prjs);
    }
    cargar();
  }, []);

  async function handleGuardarProyecto() {
    if (!nuevoNombre.trim()) return;
    
    const proyecto: Proyecto = editandoProyecto ? {
      ...editandoProyecto,
      nombre: nuevoNombre,
      descripcion: nuevaDescripcion,
      color: nuevoColor,
      ordenSelector: nuevoOrden
    } : {
      identificador: `PRJ-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      nombre: nuevoNombre,
      descripcion: nuevaDescripcion,
      color: nuevoColor,
      ordenSelector: nuevoOrden
    };

    await guardarProyecto(proyecto);
    const prjs = await obtenerProyectos();
    setProyectos(prjs);
    cancelarEdicion();
  }

  async function handleEliminarProyecto(id: string) {
    if (!confirm("¿Estás seguro de eliminar este proyecto?")) return;
    await eliminarProyecto(id);
    const prjs = await obtenerProyectos();
    setProyectos(prjs);
  }

  function cancelarEdicion() {
    setEditandoProyecto(null);
    setNuevoNombre("");
    setNuevaDescripcion("");
    setNuevoColor("#0ea5e9");
    setNuevoOrden(0);
  }

  function iniciarEdicion(p: Proyecto) {
    setEditandoProyecto(p);
    setNuevoNombre(p.nombre);
    setNuevaDescripcion(p.descripcion || "");
    setNuevoColor(p.color);
    setNuevoOrden(p.ordenSelector || 0);
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Columna Izquierda: Lista de Proyectos (Maestro) */}
      <div className="flex flex-col gap-4 lg:col-span-4 lg:sticky lg:top-32 max-h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between rounded-[24px] bg-white p-5 shadow-sm border border-slate-200">
          <h2 className="text-xl font-black text-slate-900">Proyectos</h2>
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
                  className={`group relative flex cursor-pointer flex-col gap-1 rounded-[24px] border p-5 transition-all ${
                    activo 
                      ? "border-sky-400 bg-white shadow-md scale-[1.02] z-10" 
                      : "border-slate-100 bg-white shadow-sm hover:border-slate-300 hover:shadow-md"
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
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-slate-300">ORDEN:</span>
                        <span className="text-[10px] font-black text-sky-500">{proyecto.ordenSelector || 0}</span>
                      </div>
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
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm xl:p-8">
          <h2 className="text-2xl font-black text-slate-900 mb-6">
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider pl-1">Orden de Aparición</label>
              <input 
                type="number"
                value={nuevoOrden}
                onChange={(e) => setNuevoOrden(parseInt(e.target.value) || 0)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
              />
              <p className="text-[10px] text-slate-400 pl-1">Los números bajos aparecen primero en el selector.</p>
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
      </div>
    </div>
    </div>
  );
}
