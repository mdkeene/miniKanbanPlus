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

const etiquetasEstado: Record<EstadoKanban, string> = {
  DEFINIDO: "Definido",
  EN_CURSO: "En curso",
  BLOQUEADO: "Bloqueado",
  TERMINADO: "Terminado"
};

const estilosEstado: Record<
  EstadoKanban,
  { fondo: string; borde: string; brillo: string }
> = {
  DEFINIDO: {
    fondo: "from-sky-400 via-cyan-300 to-white",
    borde: "border-sky-200",
    brillo: "bg-sky-50/85"
  },
  EN_CURSO: {
    fondo: "from-amber-300 via-orange-200 to-white",
    borde: "border-amber-200",
    brillo: "bg-amber-50/85"
  },
  BLOQUEADO: {
    fondo: "from-rose-300 via-pink-200 to-white",
    borde: "border-rose-200",
    brillo: "bg-rose-50/85"
  },
  TERMINADO: {
    fondo: "from-emerald-300 via-lime-200 to-white",
    borde: "border-emerald-200",
    brillo: "bg-emerald-50/85"
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

  useEffect(() => {
    async function inicializar() {
      try {
        const [ps, ts, prjs] = await Promise.all([
          obtenerPersonas(),
          obtenerTareas(),
          obtenerProyectos()
        ]);
        setPersonas(ps);
        setTareas(ts);
        setProyectos(prjs);
      } catch (e) {
        console.error("Error al cargar datos:", e);
      } finally {
        setCargando(false);
        setHidratado(true);
      }
    }
    inicializar();
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
      return coincideSemana && coincideProyecto && coincidePersona;
    });
  }, [tareas, semanaActiva, filtroProyecto, filtroPersona]);

  const columnas = useMemo(
    () =>
      estadosKanban.map((estado) => ({
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
    setBorradorNuevaTarea(crearBorradorVacio("DEFINIDO", semanaActiva));
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
    setMensajeSistema({ tipo: "exito", texto: "Tarea eliminada." });
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
    await moverTareaLib(estadoArrastre.identificador, destinoDrop);
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

        <div className="flex-1 overflow-auto bg-white p-4 md:p-6 custom-scrollbar">
          <div className="mx-auto w-full max-w-full">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Controles Principales: Navegación + Acción */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-1">
                    <button
                      onClick={() => navegarSemana(-1)}
                      className="h-9 w-9 flex items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm hover:text-slate-900 transition-all font-bold"
                    >
                      ◀
                    </button>
                    <div className="flex flex-col items-center px-4 min-w-[120px]">
                      <span className="text-xs font-black text-slate-900">Semana {infoSemana.numero}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        {formatearRangoSemana(infoSemana.inicio, infoSemana.fin)}
                      </span>
                    </div>
                    <button
                      onClick={() => navegarSemana(1)}
                      className="h-9 w-9 flex items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm hover:text-slate-900 transition-all font-bold"
                    >
                      ▶
                    </button>
                    <button
                      onClick={irHoy}
                      className="h-9 px-3 rounded-xl bg-sky-50 text-[10px] font-black uppercase text-sky-600 hover:bg-sky-100 transition-all ml-1"
                    >
                      Hoy
                    </button>
                  </div>

                  <button 
                    onClick={abrirCreacionRapida}
                    className="flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-xs font-black text-white shadow-xl shadow-slate-950/20 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>+</span> Nueva Tarea
                  </button>

                  <button 
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className={`lg:hidden flex h-11 items-center gap-2 rounded-2xl border px-5 text-[10px] font-black uppercase transition-all ${
                      mostrarFiltros || filtroProyecto !== "todos" || filtroPersona !== "todos"
                      ? "border-sky-500 bg-sky-50 text-sky-600"
                      : "border-slate-100 bg-slate-50 text-slate-500"
                    }`}
                  >
                    🔍 {mostrarFiltros ? 'Cerrar Filtros' : 'Filtros'}
                    {(filtroProyecto !== "todos" || filtroPersona !== "todos") && <span className="ml-1 h-2 w-2 rounded-full bg-sky-500" />}
                  </button>
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
                      <option value="todos">Todas</option>
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
                      <option value="tipo">Tipo</option>
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

                  <button
                    type="button"
                    onClick={() => setModalCargaAbierto(true)}
                    className="h-11 px-4 rounded-2xl bg-amber-100 text-[11px] font-black text-amber-900 hover:bg-amber-200 transition-all"
                  >
                    🚀 Carga Rápida
                  </button>
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
                  <button onClick={duplicarSeleccionadas} className="h-9 px-3 rounded-xl bg-slate-900 text-[10px] font-black text-white hover:bg-slate-800 transition-all">👯 Clonar</button>
                  <button onClick={moverASemanaSiguiente} className="h-9 px-3 rounded-xl bg-sky-600 text-[10px] font-black text-white hover:bg-sky-500 transition-all">📅 Sig. Semana</button>
                  <button onClick={eliminarSeleccionadas} className="h-9 px-3 rounded-xl bg-rose-600 text-[10px] font-black text-white hover:bg-rose-500 transition-all">🗑️ Eliminar</button>
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
                      className="flex flex-col gap-3 rounded-[32px] border border-slate-100 bg-slate-50/30 p-4"
                    >
                      <div className="flex items-center gap-3 px-2">
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
                      
                      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
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
                            />
                          );
                        })}
                      </div>
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
