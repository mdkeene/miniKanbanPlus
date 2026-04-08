"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnaKanban } from "@/componentes/columna-kanban";
import { ModalTarea } from "@/componentes/modal-tarea";
import { 
  obtenerTareas, 
  guardarTarea as guardarTareaLib,
  crearBorradorVacio
} from "@/lib/tareas";
import { obtenerPersonas } from "@/lib/personas";
import { obtenerProyectos } from "@/lib/proyectos";
import { obtenerSemanaId } from "@/lib/semanas";
import { supabase } from "@/lib/supabase";
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

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [ts, ps, prjs] = await Promise.all([
          obtenerTareas(),
          obtenerPersonas(),
          obtenerProyectos()
        ]);
        setTareas(ts || []);
        setPersonas(ps || []);
        setProyectos(prjs || []);
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

  const ideas = useMemo(() => tareas.filter(t => t.estado === "IDEA"), [tareas]);
  const backlog = useMemo(() => tareas.filter(t => t.estado === "BACKLOG"), [tareas]);

  async function handleGuardarTarea(borrador: any) {
    // La sincronización Realtime se encargará de actualizar la lista
    // una vez que la base de datos confirme el guardado.
    await guardarTareaLib(borrador);
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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
              Estrategia & <span className="text-sky-600">Backlog</span>
            </h1>
            <p className="mt-2 text-lg font-medium text-slate-500 max-w-2xl">
              Captura ideas frescas y prioriza el futuro de <span className="font-bold text-slate-900 underline decoration-sky-500/30 decoration-4">InnovaExport</span> sin la presión del cronómetro semanal.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
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
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-10">
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
                seleccionadas={[]}
                alCambiarSeleccion={() => {}}
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
                  seleccionadas={[]}
                  alCambiarSeleccion={() => {}}
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
      </main>

      {/* Modales Compartidos */}
      {tareaEditando && (
        <ModalTarea 
          modo="editar"
          tarea={tareaEditando}
          personas={personas}
          onCerrar={() => setTareaEditando(null)}
          onGuardarEdicion={handleGuardarTarea}
          onEliminar={async (id) => {
             // Lógica de eliminación...
             setTareaEditando(null);
          }}
          alPromoverASprint={handlePromoverASprint}
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
