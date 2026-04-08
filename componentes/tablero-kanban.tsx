"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnaKanban } from "@/componentes/columna-kanban";
import { ModalPersona } from "@/componentes/modal-persona";
import { ModalCargaRapida } from "@/componentes/modal-carga-rapida";
import { ModalTarea } from "@/componentes/modal-tarea";
import { PanelPersonas } from "@/componentes/panel-personas";
import {
  almacenamientoPersonas,
  crearPersonaDesdeBorrador,
  normalizarPersonas,
  obtenerIdentificadorPersonaAleatorio,
  personasEjemplo,
  sincronizarTareasConPersonas,
  obtenerPersonas,
  guardarPersona as guardarPersonaLib
} from "@/lib/personas";
import {
  agruparPorEstado,
  almacenamientoTareas,
  crearBorradorVacio,
  crearTareaDesdeBorrador,
  normalizarIndices,
  normalizarTareasPersistidas,
  obtenerSiguienteIndice,
  tareasEjemplo,
  obtenerTareas,
  guardarTarea as guardarTareaLib,
  eliminarTarea as eliminarTareaLib,
  moverTarea as moverTareaLib
} from "@/lib/tareas";
import { obtenerProyectos } from "@/lib/proyectos";
import {
  limpiarTextoPlano,
  limitesSeguridad,
  limitarColeccion
} from "@/lib/seguridad";
import {
  formatearRangoSemana,
  obtenerInfoSemana,
  obtenerSemanaId,
  obtenerSemanaRelativa
} from "@/lib/semanas";
import {
  type BorradorTarea,
  type BorradorPersona,
  type ConfiguracionCargaRapida,
  type DestinoArrastre,
  type EstadoKanban,
  type OrdenTablero,
  type Persona,
  type Proyecto,
  type SentidoOrden,
  type Tarea,
  estadosKanban
} from "@/tipos/tareas";
import { generarIdentificador } from "@/lib/tareas";
import { supabase } from "@/lib/supabase";
import { obtenerConfigTablero, actualizarConfigTablero } from "@/lib/config";
import { obtenerSesion } from "@/lib/auth";

const etiquetasEstado: Record<EstadoKanban, string> = {
  DEFINIDO: "Definido",
  EN_CURSO: "En curso",
  BLOQUEADO: "Bloqueado",
  TERMINADO: "Terminado",
  IDEA: "Idea",
  BACKLOG: "Backlog"
};

const estilosEstado: Record<
  EstadoKanban,
  { fondo: string; borde: string; brillo: string }
> = {
  DEFINIDO: {
    fondo: "bg-sky-50",
    borde: "border-sky-400",
    brillo: "bg-white"
  },
  EN_CURSO: {
    fondo: "bg-amber-50",
    borde: "border-amber-400",
    brillo: "bg-white"
  },
  BLOQUEADO: {
    fondo: "bg-rose-50",
    borde: "border-rose-400",
    brillo: "bg-white"
  },
  TERMINADO: {
    fondo: "bg-emerald-50",
    borde: "border-emerald-400",
    brillo: "bg-white"
  },
  IDEA: {
    fondo: "bg-violet-50",
    borde: "border-violet-300",
    brillo: "bg-white"
  },
  BACKLOG: {
    fondo: "bg-indigo-50",
    borde: "border-indigo-400",
    brillo: "bg-white"
  }
};

const configuracionCargaInicial: ConfiguracionCargaRapida = {
  lineas: "",
  tipo: "Planificacion",
  prioridad: "MEDIA",
  estado: "DEFINIDO",
  fechaDeseableFin: ""
};

type EstadoArrastre = {
  identificador: string;
  origen: EstadoKanban;
} | null;

type MensajeSistema = {
  tipo: "exito" | "error";
  texto: string;
} | null;

export function TableroKanban() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [semanaActiva, setSemanaActiva] = useState(obtenerSemanaId());
  const [ordenActivo, setOrdenActivo] = useState<OrdenTablero>("manual");
  const [sentidoOrden, setSentidoOrden] = useState<SentidoOrden>("asc");
  const [filtroProyecto, setFiltroProyecto] = useState<string>("todos");
  const [filtroPersona, setFiltroPersona] = useState<string>("todos");
  const [tareaEnEdicion, setTareaEnEdicion] = useState<Tarea | null>(null);
  const [borradorNuevaTarea, setBorradorNuevaTarea] = useState<BorradorTarea | null>(null);
  const [modalPersonaAbierto, setModalPersonaAbierto] = useState(false);
  const [modalCargaAbierto, setModalCargaAbierto] = useState(false);
  const [estadoArrastre, setEstadoArrastre] = useState<EstadoArrastre>(null);
  const [destinoDrop, setDestinoDrop] = useState<DestinoArrastre | null>(null);
  const [mensajeSistema, setMensajeSistema] = useState<MensajeSistema>(null);
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [agruparPorPersona, setAgruparPorPersona] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [swimlanesExpandidos, setSwimlanesExpandidos] = useState<string[]>([]);
  const [modoBloqueado, setModoBloqueado] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState<Persona | null>(null);

  useEffect(() => {
    async function inicializar() {
      try {
        const [ps, ts, prjs, config, sesion] = await Promise.all([
          obtenerPersonas(),
          obtenerTareas(),
          obtenerProyectos(),
          obtenerConfigTablero(),
          obtenerSesion()
        ]);
        setPersonas(ps);
        setTareas(ts);
        setProyectos(prjs);
        setModoBloqueado(config.locked_in);
        setUsuarioActual(sesion?.usuario || null);
      } catch (e) {
        console.error("Error al cargar datos:", e);
      } finally {
        setCargando(false);
        setHidratado(true);
      }
    }
    inicializar();

    // Suscripción Realtime para Tareas y Perfiles
    const canal = supabase
      .channel('cambios-tablero')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const p = payload.new as any;
            const nueva: Tarea = {
              ...p,
              identificador: p.id
            };
            setTareas(actuales => {
              if (actuales.find(t => t.identificador === nueva.identificador)) return actuales;
              return [...actuales, nueva];
            });
          } else if (payload.eventType === 'UPDATE') {
            const p = payload.new as any;
            setTareas(actuales => actuales.map(t => 
              t.identificador === p.id 
                ? { ...t, ...p, identificador: p.id } 
                : t
            ));
          } else if (payload.eventType === 'DELETE') {
            const eliminadaId = payload.old.id;
            setTareas(actuales => actuales.filter(t => t.identificador !== eliminadaId));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const p = payload.new as any;
            const personaActualizada: Persona = {
              identificador: p.id,
              nombre: p.nombre,
              email: p.email,
              area: p.area,
              foto: p.foto,
              color: p.color,
              rol: p.rol as any
            };
            setPersonas(actuales => {
              const existe = actuales.find(item => item.identificador === p.id);
              if (existe) {
                return actuales.map(item => 
                  item.identificador === p.id 
                    ? { ...item, ...p, identificador: p.id } 
                    : item
                );
              }
              // Si no existe (INSERT o similar), creamos completo
              const personaNueva: Persona = {
                identificador: p.id,
                nombre: p.nombre,
                email: p.email,
                area: p.area,
                foto: p.foto,
                color: p.color,
                rol: p.rol as any
              };
              return [...actuales, personaNueva];
            });
          } else if (payload.eventType === 'DELETE') {
            const eliminadaId = payload.old.id;
            setPersonas(actuales => actuales.filter(p => p.identificador !== eliminadaId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  useEffect(() => {
    if (!mensajeSistema) return;
    const temporizador = window.setTimeout(() => setMensajeSistema(null), 2400);
    return () => window.clearTimeout(temporizador);
  }, [mensajeSistema]);

  async function recargarTareas() {
    const ts = await obtenerTareas();
    setTareas(ts);
  }

  const tareasSemanales = useMemo(() => {
    return tareas.filter((t) => {
      const coincideSemana = t.semanaId === semanaActiva;
      const coincideProyecto = filtroProyecto === "todos" || t.proyectoId === filtroProyecto;
      const coincidePersona = filtroPersona === "todos" || (t.personaAsignadaId || "sin-asignar") === filtroPersona;
      
      // Excluir estados estratégicos del tablero semanal
      const esEstadoEstrategico = t.estado === "IDEA" || t.estado === "BACKLOG";
      
      return coincideSemana && coincideProyecto && coincidePersona && !esEstadoEstrategico;
    });
  }, [tareas, semanaActiva, filtroProyecto, filtroPersona]);

  const columnas = useMemo(
    () =>
      estadosKanban
        .filter((estado) => estado !== "IDEA" && estado !== "BACKLOG")
        .map((estado) => ({
          estado,
          titulo: etiquetasEstado[estado],
          tareas: agruparPorEstado(tareasSemanales, estado, ordenActivo, sentidoOrden),
          estilos: estilosEstado[estado]
        })),
    [ordenActivo, sentidoOrden, tareasSemanales]
  );

  const arrastreDisponible = ordenActivo === "manual";

  const swimlanes = useMemo(() => {
    if (!agruparPorPersona) return null;
    const porPersona: Record<string, Tarea[]> = {};
    tareasSemanales.forEach((t) => {
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
  }, [agruparPorPersona, tareasSemanales, personas]);

  function abrirCreacionRapida() {
    if (modoBloqueado) return;
    setBorradorNuevaTarea(crearBorradorVacio("DEFINIDO", semanaActiva));
  }

  function abrirTareaUrgente() {
    const borrador = crearBorradorVacio("DEFINIDO", semanaActiva);
    borrador.esUrgente = true;
    borrador.prioridad = "URGENTE";
    setBorradorNuevaTarea(borrador);
  }

  async function guardarNuevaTarea(borrador: BorradorTarea) {
    const indiceOrden = obtenerSiguienteIndice(tareas, borrador.estado);
    const nuevaTarea = crearTareaDesdeBorrador(borrador, indiceOrden);

    await guardarTareaLib(nuevaTarea);
    await recargarTareas();
    setBorradorNuevaTarea(null);
    setMensajeSistema({ tipo: "exito", texto: "Tarea creada correctamente." });
  }

  async function guardarEdicionCompleta(tareaActualizada: Tarea) {
    await guardarTareaLib(tareaActualizada);
    await recargarTareas();
    setTareaEnEdicion(null);
    setMensajeSistema({ tipo: "exito", texto: "Cambios guardados." });
  }

  async function guardarTituloRapido(identificador: string, titulo: string) {
    const tituloLimpio = limpiarTextoPlano(titulo, limitesSeguridad.tituloMaximo);
    if (!tituloLimpio) {
      setMensajeSistema({ tipo: "error", texto: "El título no puede quedar vacío." });
      return;
    }
    const tarea = tareas.find(t => t.identificador === identificador);
    if (tarea) {
      await guardarTareaLib({ ...tarea, titulo: tituloLimpio });
      await recargarTareas();
      setMensajeSistema({ tipo: "exito", texto: "Título actualizado." });
    }
  }

  async function eliminarTareaBoard(identificador: string) {
    const confirmar = window.confirm("Esta acción eliminará la tarea. ¿Quieres continuar?");
    if (!confirmar) return;
    await eliminarTareaLib(identificador);
    await recargarTareas();
    setTareaEnEdicion(null);
    setMensajeSistema({ texto: "Título acualizado", tipo: "exito" });
  }

  async function manejarMoverABacklog(tarea: Tarea) {
    const backupFlags = modoBloqueado ? { esDevuelto: true } : {};
    const tareaActualizada = { ...tarea, estado: "BACKLOG" as const, ...backupFlags };
    await guardarTareaLib(tareaActualizada);
    await recargarTareas(); // Requerido para ver el badge si se queda en vista (aunque se cierra el modal)
    setTareaEnEdicion(null);
    setMensajeSistema({ texto: "Tarea enviada al Backlog", tipo: "exito" });
  }

  async function crearDesdeCargaRapida(configuracion: ConfiguracionCargaRapida) {
    const titulos = limitarColeccion(
      configuracion.lineas.split("\n").map(l => limpiarTextoPlano(l.replace(/^[\s*-]+/, ""), limitesSeguridad.tituloMaximo)).filter(Boolean),
      limitesSeguridad.lineasCargaRapidaMaximas
    );

    if (titulos.length === 0) {
      setMensajeSistema({ tipo: "error", texto: "Pega al menos una línea con un título de tarea." });
      return;
    }

    let tempTareas = [...tareas];
    for (const titulo of titulos) {
      const nt = crearTareaDesdeBorrador({
        titulo,
        tipo: configuracion.tipo,
        prioridad: configuracion.prioridad,
        complejidad: 1,
        estado: configuracion.estado,
        fechaDeseableFin: configuracion.fechaDeseableFin,
        observaciones: "",
        enlace: "",
        personaAsignadaId: obtenerIdentificadorPersonaAleatorio(personas),
        semanaId: semanaActiva
      }, obtenerSiguienteIndice(tempTareas, configuracion.estado));
      await guardarTareaLib(nt);
      tempTareas.push(nt);
    }

    await recargarTareas();
    setModalCargaAbierto(false);
    setMensajeSistema({ tipo: "exito", texto: `${titulos.length} tareas creadas.` });
  }

  async function guardarNuevaPersonaBoard(borrador: BorradorPersona) {
    const nuevaPersona = crearPersonaDesdeBorrador(borrador, personas.length);
    await guardarPersonaLib(nuevaPersona);
    const ps = await obtenerPersonas();
    setPersonas(ps);
    setModalPersonaAbierto(false);
    setMensajeSistema({ tipo: "exito", texto: "Persona creada correctamente." });
  }

  function iniciarArrastre(identificador: string, origen: EstadoKanban) {
    if (!arrastreDisponible) return;
    setEstadoArrastre({ identificador, origen });
  }

  async function moverASemanaSiguiente() {
    if (seleccionadas.length === 0) return;
    const proximaSemana = obtenerSemanaRelativa(semanaActiva, 1);
    
    for (const id of seleccionadas) {
      const t = tareas.find(item => item.identificador === id);
      if (t) await guardarTareaLib({ ...t, semanaId: proximaSemana });
    }
    
    await recargarTareas();
    setSeleccionadas([]);
    setMensajeSistema({ tipo: "exito", texto: "Tareas movidas." });
  }

  async function eliminarSeleccionadas() {
    if (seleccionadas.length === 0) return;
    if (!confirm(`¿Estás seguro de eliminar ${seleccionadas.length} tareas?`)) return;
    for (const id of seleccionadas) await eliminarTareaLib(id);
    await recargarTareas();
    setSeleccionadas([]);
    setMensajeSistema({ tipo: "exito", texto: "Tareas eliminadas." });
  }

  async function duplicarSeleccionadas() {
    if (seleccionadas.length === 0) return;
    for (const id of seleccionadas) {
      const t = tareas.find(item => item.identificador === id);
      if (t) {
        await guardarTareaLib({ 
          ...t, 
          identificador: generarIdentificador(), 
          titulo: `${t.titulo} (copia)`,
          fechaCreacion: new Date().toISOString()
        });
      }
    }
    await recargarTareas();
    setSeleccionadas([]);
    setMensajeSistema({ tipo: "exito", texto: "Tareas duplicadas." });
  }

  function finalizarArrastre() {
    setEstadoArrastre(null);
    setDestinoDrop(null);
  }

  function actualizarDestino(destino: DestinoArrastre) {
    if (!arrastreDisponible || !estadoArrastre) return;
    setDestinoDrop(destino);
  }

  async function completarDrop() {
    if (!arrastreDisponible || !estadoArrastre || !destinoDrop) return;
    
    // SPILLOVER LOGIC: Si el tablero está bloqueado y movemos de Kanban a Backlog/Idea
    const esEstadoKanbanOriginal = ["DEFINIDO", "EN_CURSO", "BLOQUEADO", "TERMINADO"].includes(estadoArrastre.origen);
    const esEstadoNoKanbanDestino = ["IDEA", "BACKLOG"].includes(destinoDrop.estado);
    const aplicarCambioLock = modoBloqueado && esEstadoKanbanOriginal && esEstadoNoKanbanDestino;

    if (aplicarCambioLock) {
      const tarea = tareas.find(t => t.identificador === estadoArrastre.identificador);
      if (tarea) {
        const flag = destinoDrop.estado === "BACKLOG" ? { esDevuelto: true } : { esSpillover: true };
        await guardarTareaLib({ ...tarea, ...destinoDrop, ...flag });
      }
    } else {
      await moverTareaLib(estadoArrastre.identificador, destinoDrop);
    }

    await recargarTareas();
    setMensajeSistema({ tipo: "exito", texto: "Tarea reubicada." });
    setEstadoArrastre(null);
    setDestinoDrop(null);
  }

  function navegarSemana(delta: number) {
    setSemanaActiva((actual) => obtenerSemanaRelativa(actual, delta));
  }

  function irHoy() {
    setSemanaActiva(obtenerSemanaId());
  }

  function toggleSwimlane(id: string) {
    setSwimlanesExpandidos(actual => 
      actual.includes(id) ? actual.filter(item => item !== id) : [...actual, id]
    );
  }

  function toggleTodoSwimlanes() {
    if (!swimlanes) return;
    if (swimlanesExpandidos.length === swimlanes.length) {
      setSwimlanesExpandidos([]);
    } else {
      setSwimlanesExpandidos(swimlanes.map(l => l.id));
    }
  }

  if (!hidratado || cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando Tablero...</span>
        </div>
      </div>
    );
  }

  const infoSemana = obtenerInfoSemana(semanaActiva);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="flex h-screen flex-col overflow-hidden">
        
        {/* Toggle de Modo de Tablero */}
        <div className={`shrink-0 flex items-center justify-between px-6 py-2 border-b transition-colors duration-500 ${modoBloqueado ? 'bg-slate-900 border-slate-800' : 'bg-sky-50/50 border-sky-100'}`}>
          <div className="flex items-center gap-3">
             <span className={`text-[10px] font-black uppercase tracking-widest ${modoBloqueado ? 'text-slate-400' : 'text-sky-600'}`}>
               Estado del Tablero:
             </span>
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${modoBloqueado ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                {modoBloqueado ? '🔒 Locked In (Ejecución)' : '📂 Planning (Planificación)'}
             </div>
          </div>

          {usuarioActual?.rol === 'admin' && (
            <button 
              onClick={async () => {
                const nuevoEstado = !modoBloqueado;
                await actualizarConfigTablero(nuevoEstado);
                setModoBloqueado(nuevoEstado);
                setMensajeSistema({ tipo: "exito", texto: nuevoEstado ? "Tablero BLOQUEADO para ejecución." : "Tablero abierto para PLANIFICACIÓN." });
              }}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                modoBloqueado 
                  ? 'bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20' 
                  : 'bg-slate-950 text-white hover:bg-slate-800 shadow-xl'
              }`}
            >
              {modoBloqueado ? '🔓 Abrir Planificación' : '🔒 Bloquear Tablero'}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-white p-4 md:p-6 custom-scrollbar">
          <div className="mx-auto w-full max-w-full">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Controles Principales: Navegación + Acción */}
                <div className="flex flex-row items-center justify-between gap-2 overflow-x-hidden">
                  {/* Navegación Semanal Compacta */}
                  <div className="flex items-center gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-1 shrink-0">
                    <button
                      onClick={() => navegarSemana(-1)}
                      className="h-9 w-8 flex items-center justify-center rounded-xl bg-white text-slate-400 border border-slate-100 shadow-sm hover:text-slate-900 transition-all font-bold"
                    >
                      ◀
                    </button>
                    <div className="flex flex-col items-center px-2 min-w-[100px] md:min-w-[120px]">
                      <span className="text-[10px] md:text-xs font-black text-slate-900">Semana {infoSemana.numero}</span>
                      <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">
                        {formatearRangoSemana(infoSemana.inicio, infoSemana.fin)}
                      </span>
                    </div>
                    <button
                      onClick={() => navegarSemana(1)}
                      className="h-9 w-8 flex items-center justify-center rounded-xl bg-white text-slate-400 border border-slate-100 shadow-sm hover:text-slate-900 transition-all font-bold"
                    >
                      ▶
                    </button>
                    <button
                      onClick={irHoy}
                      className="h-9 px-2 md:px-3 rounded-xl bg-sky-50 text-[9px] md:text-[10px] font-black uppercase text-sky-600 hover:bg-sky-100 transition-all ml-0.5"
                    >
                      Hoy
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {!modoBloqueado ? (
                      <>
                        <button 
                          onClick={abrirCreacionRapida}
                          title="Nueva Tarea"
                          className="flex h-11 w-11 lg:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-950 lg:px-5 lg:shadow-xl lg:shadow-slate-950/20 text-sm font-black text-white hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                        >
                          <span className="text-lg lg:text-base">+</span> 
                          <span className="hidden lg:inline text-xs">Nueva Tarea</span>
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={abrirTareaUrgente}
                        title="Tarea Urgente"
                        className="flex h-11 w-11 lg:w-auto items-center justify-center gap-2 rounded-2xl bg-rose-900 lg:px-5 lg:shadow-xl lg:shadow-rose-900/20 text-sm font-black text-white hover:bg-rose-800 transition-all hover:scale-105 active:scale-95"
                      >
                        <span className="text-lg lg:text-base">🚨</span> 
                        <span className="hidden lg:inline text-xs">Tarea Urgente</span>
                      </button>
                    )}

                    <button 
                      onClick={() => setMostrarFiltros(!mostrarFiltros)}
                      title="Filtros"
                      className={`lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                        mostrarFiltros || filtroProyecto !== "todos" || filtroPersona !== "todos"
                        ? "border-sky-500 bg-sky-50 text-sky-600"
                        : "border-slate-100 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <span className="text-lg">🔍</span>
                      {(filtroProyecto !== "todos" || filtroPersona !== "todos") && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-sky-500 animate-pulse" />}
                    </button>
                  </div>
                </div>

                {/* Filtros Detallados - Colapsables en móvil */}
                <div className={`${mostrarFiltros ? 'flex' : 'hidden'} lg:flex flex-wrap items-center gap-2 transition-all`}>
                  {/* Filtro Proyecto */}
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-1.5 h-11">
                    <span className="text-[10px] font-black uppercase text-slate-400">Proyecto</span>
                    <select
                      className="bg-transparent text-sm font-black text-slate-900 outline-none cursor-pointer max-w-[120px]"
                      value={filtroProyecto}
                      onChange={(e) => setFiltroProyecto(e.target.value)}
                    >
                      <option value="todos">Todos</option>
                      {proyectos.map(p => (
                        <option key={p.identificador} value={p.identificador}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Persona */}
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-1.5 h-11">
                    <span className="text-[10px] font-black uppercase text-slate-400">Persona</span>
                    <select
                      className="bg-transparent text-sm font-black text-slate-900 outline-none cursor-pointer max-w-[120px]"
                      value={filtroPersona}
                      onChange={(e) => setFiltroPersona(e.target.value)}
                    >
                      <option value="todas">Todas</option>
                      <option value="sin-asignar">Sin asignar</option>
                      {personas.map(p => (
                        <option key={p.identificador} value={p.identificador}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-1.5 h-11">
                    <span className="text-[10px] font-black uppercase text-slate-400">Orden</span>
                    <select
                      className="bg-transparent text-sm font-black text-slate-900 outline-none cursor-pointer"
                      value={ordenActivo}
                      onChange={(evento) =>
                        setOrdenActivo(evento.target.value as OrdenTablero)
                      }
                    >
                      <option value="manual">Manual</option>
                      <option value="titulo">Título</option>
                      <option value="prioridad">Prioridad</option>
                      <option value="fechaDeseable">Fecha</option>
                      <option value="fechaCreacion">Registro</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSentidoOrden(s => s === "asc" ? "desc" : "asc")}
                    className="h-11 px-4 rounded-2xl border-2 border-slate-100 bg-white text-[11px] font-black text-slate-600 hover:bg-slate-50 transition-all font-mono"
                  >
                    {sentidoOrden === "asc" ? "ASC ↑" : "DESC ↓"}
                  </button>

                  <button 
                    onClick={() => setAgruparPorPersona(a => !a)}
                    className={`h-11 flex items-center gap-2 rounded-2xl border-2 px-4 text-[11px] font-black transition-all ${
                      agruparPorPersona
                        ? "border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                        : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {agruparPorPersona ? "🏊 Calles" : "🏢 Base"}
                  </button>

                  {!modoBloqueado && (
                    <button
                      type="button"
                      onClick={() => setModalCargaAbierto(true)}
                      className="h-11 px-4 rounded-2xl bg-amber-100 text-[11px] font-black text-amber-900 hover:bg-amber-200 transition-all"
                    >
                      🚀 Carga Rápida
                    </button>
                  )}
                </div>
              </div>

              {!arrastreDisponible && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700 animate-pulse">
                  ⚠️ Drag & Drop deshabilitado en orden automático.
                </div>
              )}
            </div>

            {/* Barra de Acciones en Lote (Flotante) */}
            {seleccionadas.length > 0 && (
              <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 flex items-center gap-3 rounded-full border border-slate-200 bg-white/90 backdrop-blur-xl px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                <span className="text-xs font-black text-sky-600 px-3 border-r border-slate-100">{seleccionadas.length} seleccionadas</span>
                <div className="flex gap-1.5">
                  {!modoBloqueado && (
                    <>
                      <button onClick={duplicarSeleccionadas} className="h-9 px-3 rounded-xl bg-slate-900 text-[10px] font-black text-white hover:bg-slate-800 transition-all">👯 Clonar</button>
                      <button onClick={moverASemanaSiguiente} className="h-9 px-3 rounded-xl bg-sky-600 text-[10px] font-black text-white hover:bg-sky-500 transition-all">📅 Sig. Semana</button>
                      <button onClick={eliminarSeleccionadas} className="h-9 px-3 rounded-xl bg-rose-600 text-[10px] font-black text-white hover:bg-rose-500 transition-all">🗑️ Eliminar</button>
                    </>
                  )}
                  <button onClick={() => setSeleccionadas([])} className="h-9 px-3 rounded-xl bg-slate-100 text-[10px] font-black text-slate-500 hover:bg-slate-200 transition-all font-bold">✕</button>
                </div>
              </div>
            )}

            <section className="pb-10">
              {agruparPorPersona && swimlanes ? (
                <div className="flex flex-col gap-6">
                  {swimlanes.map((lane) => (
                      <div
                        key={lane.id}
                        className={`flex flex-col gap-3 rounded-[32px] border border-slate-100 p-4 transition-all ${
                          !swimlanesExpandidos.includes(lane.id) ? "bg-slate-50/10 opacity-70" : "bg-slate-50/30"
                        }`}
                      >
                        <div 
                          className="flex items-center gap-3 px-2 cursor-pointer group"
                          onClick={() => toggleSwimlane(lane.id)}
                        >
                          <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-100 text-[10px] transition-transform ${swimlanesExpandidos.includes(lane.id) ? "rotate-0" : "-rotate-90"}`}>
                            ▼
                          </div>
                        {lane.persona ? (
                          <div className="flex items-center gap-3">
                            <img src={lane.persona.foto} className="h-8 w-8 rounded-xl object-cover shadow-sm bg-white" alt="" />
                            <span className="text-sm font-black text-slate-900">{lane.persona.nombre}</span>
                            <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-lg bg-white border border-slate-100 lowercase">{lane.persona.area}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-black text-slate-400">Tareas sin asignar</span>
                        )}
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="text-[10px] font-bold text-slate-400">{lane.tareas.length} tareas</span>
                      </div>
                      
                      {swimlanesExpandidos.includes(lane.id) && (
                        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-300">
                        {columnas.map((columna) => {
                          const tareasDeColumnaYPersona = columna.tareas.filter(
                            (t: Tarea) => (t.personaAsignadaId || "sin-asignar") === lane.id
                          );
                          return (
                            <ColumnaKanban
                              key={`${columna.estado}-${lane.id}`}
                              estado={columna.estado}
                              titulo={columna.titulo}
                              tareas={tareasDeColumnaYPersona}
                              personas={personas}
                              estilos={columna.estilos}
                              arrastreDisponible={arrastreDisponible}
                              estadoArrastre={estadoArrastre}
                              destinoDrop={destinoDrop}
                              personaId={lane.id === "sin-asignar" ? "" : lane.id}
                              onAbrir={(tarea) => setTareaEnEdicion(tarea)}
                              onEditarTitulo={guardarTituloRapido}
                              onIniciarArrastre={iniciarArrastre}
                              onFinalizarArrastre={finalizarArrastre}
                              onActualizarDestino={actualizarDestino}
                              onSoltar={completarDrop}
                              seleccionadas={seleccionadas}
                              alCambiarSeleccion={(id, sel) => {
                                setSeleccionadas((actual) =>
                                  sel ? [...actual, id] : actual.filter((i) => i !== id)
                                );
                              }}
                              modoBloqueado={modoBloqueado}
                            />
                          );
                        })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-6 custom-scrollbar">
                  {columnas.map((columna) => (
                    <ColumnaKanban
                      key={columna.estado}
                      estado={columna.estado}
                      titulo={columna.titulo}
                      tareas={columna.tareas}
                      personas={personas}
                      estilos={columna.estilos}
                      arrastreDisponible={arrastreDisponible}
                      estadoArrastre={estadoArrastre}
                      destinoDrop={destinoDrop}
                      onAbrir={(tarea) => setTareaEnEdicion(tarea)}
                      onEditarTitulo={guardarTituloRapido}
                      onIniciarArrastre={iniciarArrastre}
                      onFinalizarArrastre={finalizarArrastre}
                      onActualizarDestino={actualizarDestino}
                      onSoltar={completarDrop}
                      seleccionadas={seleccionadas}
                      alCambiarSeleccion={(id, sel) => {
                        setSeleccionadas((actual) =>
                          sel ? [...actual, id] : actual.filter((i) => i !== id)
                        );
                      }}
                      modoBloqueado={modoBloqueado}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Modales */}
      {tareaEnEdicion && (
        <ModalTarea
          modo="editar"
          tarea={tareaEnEdicion}
          personas={personas}
          onCerrar={() => setTareaEnEdicion(null)}
          onGuardarEdicion={guardarEdicionCompleta}
          onEliminar={eliminarTareaBoard}
          alMoverABacklog={manejarMoverABacklog}
          modoBloqueado={modoBloqueado}
        />
      )}

      {borradorNuevaTarea && (
        <ModalTarea
          modo="crear"
          borrador={borradorNuevaTarea}
          personas={personas}
          onCerrar={() => setBorradorNuevaTarea(null)}
          onGuardarNueva={guardarNuevaTarea}
        />
      )}

      {modalPersonaAbierto && (
        <ModalPersona
          onCerrar={() => setModalPersonaAbierto(false)}
          onGuardar={guardarNuevaPersonaBoard}
        />
      )}

      {modalCargaAbierto && (
        <ModalCargaRapida
          configuracionInicial={configuracionCargaInicial}
          onCerrar={() => setModalCargaAbierto(false)}
          onCrear={crearDesdeCargaRapida}
        />
      )}

      {mensajeSistema && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[100]">
          <div
            className={`rounded-2xl border px-6 py-4 text-xs font-black shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-4 duration-300 ${
              mensajeSistema.tipo === "exito"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-rose-100 bg-rose-50 text-rose-700"
            }`}
          >
            {mensajeSistema.texto}
          </div>
        </div>
      )}
    </main>
  );
}
