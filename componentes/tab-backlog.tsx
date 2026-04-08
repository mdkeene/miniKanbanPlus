"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnaKanban } from "@/componentes/columna-kanban";
import { ModalTarea } from "@/componentes/modal-tarea";
import { 
  obtenerTareas, 
  guardarTarea as guardarTareaLib,
  eliminarTarea as eliminarTareaLib,
  crearBorradorVacio,
  crearTareaDesdeBorrador,
  obtenerSiguienteIndice
} from "@/lib/tareas";
import { obtenerPersonas } from "@/lib/personas";
import { obtenerProyectos } from "@/lib/proyectos";
import { obtenerSemanaId } from "@/lib/semanas";
import { supabase } from "@/lib/supabase";
import { obtenerConfigTablero } from "@/lib/config";
import { 
  type Tarea, 
  type Persona, 
  type Proyecto, 
  type EstadoKanban,
  type BorradorTarea
} from "@/tipos/tareas";

export function TabBacklog() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const [creandoNueva, setCreandoNueva] = useState<EstadoKanban | null>(null);
  const [filtroProyecto, setFiltroProyecto] = useState<string>("todos");
  const [filtroPersona, setFiltroPersona] = useState<string>("todos");
  const [agruparPorPersona, setAgruparPorPersona] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [swimlanesExpandidos, setSwimlanesExpandidos] = useState<string[]>([]);
  const [modoBloqueado, setModoBloqueado] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [ts, ps, prjs, config] = await Promise.all([
          obtenerTareas(),
          obtenerPersonas(),
          obtenerProyectos(),
          obtenerConfigTablero()
        ]);
        setTareas(ts || []);
        setPersonas(ps || []);
        setProyectos(prjs || []);
        setModoBloqueado(config.locked_in);
      } catch (error) {
        console.error("Error cargando datos del Backlog:", error);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();

    const canal = supabase
      .channel('cambios-backlog')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const p = payload.new as any;
            const nueva: Tarea = { ...p, identificador: p.id };
            setTareas(actuales => {
              if (actuales.find(t => t.identificador === nueva.identificador)) return actuales;
              return [...actuales, nueva];
            });
          } else if (payload.eventType === 'UPDATE') {
            const p = payload.new as any;
            setTareas(actuales => actuales.map(t => 
              t.identificador === p.id ? { ...t, ...p, identificador: p.id } : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTareas(actuales => actuales.filter(t => t.identificador !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t) => {
      const coincideProyecto = filtroProyecto === "todos" || t.proyectoId === filtroProyecto;
      const coincidePersona = filtroPersona === "todos" || (t.personaAsignadaId || "sin-asignar") === filtroPersona;
      
      return coincideProyecto && coincidePersona;
    });
  }, [tareas, filtroProyecto, filtroPersona]);

  const ideas = useMemo(() => tareasFiltradas.filter(t => t.estado === "IDEA"), [tareasFiltradas]);
  const backlog = useMemo(() => tareasFiltradas.filter(t => t.estado === "BACKLOG"), [tareasFiltradas]);

  const swimlanes = useMemo(() => {
    if (!agruparPorPersona) return null;
    const porPersona: Record<string, Tarea[]> = {};
    tareasFiltradas.forEach((t) => {
      const pid = t.personaAsignadaId || "sin-asignar";
      if (!porPersona[pid]) porPersona[pid] = [];
      porPersona[pid].push(t);
    });
    const lanes = Object.keys(porPersona).map((pid) => {
      const p = personas.find((pe) => pe.identificador === pid);
      return { id: pid, persona: p, tareas: porPersona[pid] };
    });
    return lanes.sort((a, b) => {
      if (a.id === "sin-asignar") return 1;
      if (b.id === "sin-asignar") return -1;
      return (a.persona?.nombre || "").localeCompare(b.persona?.nombre || "");
    });
  }, [agruparPorPersona, tareasFiltradas, personas]);

  function toggleSwimlane(id: string) {
    setSwimlanesExpandidos(actual => 
      actual.includes(id) ? actual.filter(item => item !== id) : [...actual, id]
    );
  }

  async function handleGuardarTarea(borrador: any) {
    // Si no tiene identificador es una tarea nueva
    if (!borrador.identificador) {
      const indice = obtenerSiguienteIndice(tareas, borrador.estado);
      const nuevaTarea = crearTareaDesdeBorrador(borrador, indice);
      await guardarTareaLib(nuevaTarea);
    } else {
      await guardarTareaLib(borrador);
    }
    setTareaEditando(null);
    setCreandoNueva(null);
  }

  async function handlePromoverASprint(tarea: Tarea) {
    const tareaPromovida: Tarea = {
      ...tarea,
      estado: "DEFINIDO",
      semanaId: obtenerSemanaId()
    };
    await handleGuardarTarea(tareaPromovida);
  }

  async function handleEliminarTarea(id: string) {
    const confirmar = window.confirm("¿Estás seguro de que quieres eliminar esta tarea?");
    if (!confirmar) return;
    await eliminarTareaLib(id);
    setTareaEditando(null);
  }

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent shadow-xl shadow-sky-500/20" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Accediendo a la Estrategia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50/30 overflow-hidden">
      <header className="px-8 py-8 shrink-0">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Estrategia & <span className="text-sky-600">Backlog</span>
              </h1>
              <p className="mt-2 text-lg font-medium text-slate-500 max-w-2xl">
                Captura ideas frescas y prioriza el futuro de <span className="font-bold text-slate-900 underline decoration-sky-500/30 decoration-4">InnovaExport</span> sin la presión del cronómetro semanal.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setCreandoNueva("IDEA")}
                className="px-6 py-3 rounded-2xl bg-violet-600 text-white font-black text-sm shadow-xl shadow-violet-500/20 hover:bg-violet-500 transition-all hover:-translate-y-0.5"
              >
                💡 Nueva Idea
              </button>
              <button 
                onClick={() => setCreandoNueva("BACKLOG")}
                className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:-translate-y-0.5"
              >
                📦 Añadir al Backlog
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             {/* Filtro Proyecto */}
             <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-1.5 h-11 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400">Escenario</span>
                <select
                  className="bg-transparent text-sm font-black text-slate-900 outline-none cursor-pointer max-w-[120px]"
                  value={filtroProyecto}
                  onChange={(e) => setFiltroProyecto(e.target.value)}
                >
                  <option value="todos">Todos los Proyectos</option>
                  {proyectos.map(p => (
                    <option key={p.identificador} value={p.identificador}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Persona */}
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-1.5 h-11 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400">Propietario</span>
                <select
                  className="bg-transparent text-sm font-black text-slate-900 outline-none cursor-pointer max-w-[120px]"
                  value={filtroPersona}
                  onChange={(e) => setFiltroPersona(e.target.value)}
                >
                  <option value="todos">Todo el Equipo</option>
                  <option value="sin-asignar">❌ Sin asignar</option>
                  {personas.map(p => (
                    <option key={p.identificador} value={p.identificador}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1" />

              <button 
                onClick={() => setAgruparPorPersona(a => !a)}
                className={`h-11 flex items-center gap-2 rounded-2xl border-2 px-4 text-[11px] font-black transition-all ${
                  agruparPorPersona
                    ? "border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                    : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
                }`}
              >
                {agruparPorPersona ? "🏊 Calles" : "🏢 Tablero"}
              </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-auto px-8 pb-10 custom-scrollbar">
        {agruparPorPersona && swimlanes ? (
          <div className="flex flex-col gap-8 min-w-max pb-4">
            {swimlanes.map((lane) => (
              <div 
                key={lane.id}
                className={`flex flex-col gap-4 rounded-[40px] border border-slate-100 p-6 transition-all ${
                  !swimlanesExpandidos.includes(lane.id) ? "bg-slate-50/10 opacity-70" : "bg-white shadow-sm"
                }`}
              >
                <div 
                  className="flex items-center gap-4 px-2 cursor-pointer group"
                  onClick={() => toggleSwimlane(lane.id)}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-[12px] transition-transform ${swimlanesExpandidos.includes(lane.id) ? "rotate-0 text-slate-900" : "-rotate-90 text-slate-400"}`}>
                    ▼
                  </div>
                  {lane.persona ? (
                    <div className="flex items-center gap-4">
                      <img src={lane.persona.foto} className="h-10 w-10 rounded-2xl object-cover shadow-sm bg-slate-100" alt="" />
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-900">{lane.persona.nombre}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lane.persona.area}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xl">👤</div>
                      <span className="text-lg font-black text-slate-400">Tareas sin asignar</span>
                    </div>
                  )}
                  <div className="h-px flex-1 bg-slate-100 ml-4" />
                  <span className="text-xs font-black text-slate-400 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100">{lane.tareas.length} Tareas</span>
                </div>

                {swimlanesExpandidos.includes(lane.id) && (
                  <div className="flex gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Ideas del Usuario */}
                    <div className="flex flex-col w-[380px]">
                      <div className="mb-3 px-2 flex items-center gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Ideas</span>
                      </div>
                      <ColumnaKanban 
                        estado="IDEA"
                        titulo="Incubadora"
                        tareas={lane.tareas.filter(t => t.estado === "IDEA")}
                        personas={personas}
                        estilos={{ fondo: "bg-violet-50/30", borde: "border-violet-100", brillo: "bg-white" }}
                        arrastreDisponible={true}
                        estadoArrastre={null}
                        destinoDrop={null}
                        onAbrir={setTareaEditando}
                        onEditarTitulo={(id, t) => handleGuardarTarea({...tareas.find(tx => tx.identificador === id)!, titulo: t})}
                        onIniciarArrastre={() => {}}
                        onFinalizarArrastre={() => {}}
                        onActualizarDestino={() => {}}
                        onSoltar={() => {}}
                        seleccionadas={seleccionadas}
                        alCambiarSeleccion={(id, sel) => {
                          setSeleccionadas(actual => 
                            sel ? [...actual, id] : actual.filter(i => i !== id)
                          );
                        }}
                        modoBloqueado={modoBloqueado}
                      />
                    </div>

                    {/* Backlog del Usuario */}
                    <div className="flex flex-col w-[380px]">
                      <div className="mb-3 px-2 flex items-center gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Prioridad</span>
                      </div>
                      <ColumnaKanban 
                        estado="BACKLOG"
                        titulo="En Espera"
                        tareas={lane.tareas.filter(t => t.estado === "BACKLOG")}
                        personas={personas}
                        estilos={{ fondo: "bg-indigo-50/30", borde: "border-indigo-100", brillo: "bg-white" }}
                        arrastreDisponible={true}
                        estadoArrastre={null}
                        destinoDrop={null}
                        onAbrir={setTareaEditando}
                        onEditarTitulo={(id, t) => handleGuardarTarea({...tareas.find(tx => tx.identificador === id)!, titulo: t})}
                        onIniciarArrastre={() => {}}
                        onFinalizarArrastre={() => {}}
                        onActualizarDestino={() => {}}
                        onSoltar={() => {}}
                        seleccionadas={seleccionadas}
                        alCambiarSeleccion={(id, sel) => {
                          setSeleccionadas(actual => 
                            sel ? [...actual, id] : actual.filter(i => i !== id)
                          );
                        }}
                        modoBloqueado={modoBloqueado}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-8 h-full min-w-max pb-4">
            {/* Columna de Ideas */}
            <div className="flex flex-col w-[400px]">
               <div className="mb-4 flex items-center justify-between px-2">
                  <span className="text-xs font-black uppercase tracking-widest text-violet-400">Captura de Ideas</span>
                  <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-600 text-[10px] font-black">{ideas.length}</span>
               </div>
               <ColumnaKanban 
                  estado="IDEA"
                  titulo="Incubadora"
                  tareas={ideas}
                  personas={personas}
                  estilos={{ fondo: "bg-violet-50", borde: "border-violet-200", brillo: "bg-white" }}
                  arrastreDisponible={true}
                  estadoArrastre={null}
                  destinoDrop={null}
                  onAbrir={setTareaEditando}
                  onEditarTitulo={(id, t) => handleGuardarTarea({...tareas.find(tx => tx.identificador === id)!, titulo: t})}
                  onIniciarArrastre={() => {}}
                  onFinalizarArrastre={() => {}}
                  onActualizarDestino={() => {}}
                  onSoltar={() => {}}
                  seleccionadas={seleccionadas}
                  alCambiarSeleccion={(id, sel) => {
                    setSeleccionadas(actual => 
                      sel ? [...actual, id] : actual.filter(i => i !== id)
                    );
                  }}
                  modoBloqueado={modoBloqueado}
               />
            </div>

            {/* Columna de Backlog */}
            <div className="flex flex-col w-[400px]">
               <div className="mb-4 flex items-center justify-between px-2">
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Planificación Estratégica</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600 text-[10px] font-black">{backlog.length}</span>
               </div>
               <div className="relative h-full flex flex-col">
                 <ColumnaKanban 
                    estado="BACKLOG"
                    titulo="Priorizados"
                    tareas={backlog}
                    personas={personas}
                    estilos={{ fondo: "bg-indigo-50", borde: "border-indigo-200", brillo: "bg-white" }}
                    arrastreDisponible={true}
                    estadoArrastre={null}
                    destinoDrop={null}
                    onAbrir={setTareaEditando}
                    onEditarTitulo={(id, t) => handleGuardarTarea({...tareas.find(tx => tx.identificador === id)!, titulo: t})}
                    onIniciarArrastre={() => {}}
                    onFinalizarArrastre={() => {}}
                    onActualizarDestino={() => {}}
                    onSoltar={() => {}}
                    seleccionadas={seleccionadas}
                    alCambiarSeleccion={(id, sel) => {
                      setSeleccionadas(actual => 
                        sel ? [...actual, id] : actual.filter(i => i !== id)
                      );
                    }}
                    modoBloqueado={modoBloqueado}
                 />
                 
                 {/* Overlay informativo para Backlog */}
                 <div className="mt-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic">
                      💡 Tip: Usa el botón "Pasar a Sprint" dentro de la tarea para desplegarla inmediatamente en el tablero de la semana actual.
                    </p>
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Modales Compartidos */}
      {tareaEditando && (
        <ModalTarea 
          modo="editar"
          tarea={tareaEditando}
          personas={personas}
          onCerrar={() => setTareaEditando(null)}
          onGuardarEdicion={handleGuardarTarea}
          onEliminar={handleEliminarTarea}
          alPromoverASprint={handlePromoverASprint}
          modoBloqueado={modoBloqueado}
        />
      )}

      {(creandoNueva) && (
        <ModalTarea 
          modo="crear"
          borrador={{
            ...crearBorradorVacio(),
            estado: creandoNueva,
            semanaId: "ESTRATEGIA" // Marcador para tareas que no son semanales
          } as any}
          personas={personas}
          onCerrar={() => setCreandoNueva(null)}
          onGuardarNueva={handleGuardarTarea}
        />
      )}
    </div>
  );
}
