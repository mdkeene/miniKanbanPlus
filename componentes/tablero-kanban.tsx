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
  sincronizarTareasConPersonas
} from "@/lib/personas";
import {
  agruparPorEstado,
  almacenamientoTareas,
  crearBorradorVacio,
  crearTareaDesdeBorrador,
  moverTarea,
  normalizarIndices,
  normalizarTareasPersistidas,
  obtenerSiguienteIndice,
  tareasEjemplo
} from "@/lib/tareas";
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
  const [hidratado, setHidratado] = useState(false);
  const [semanaActiva, setSemanaActiva] = useState(obtenerSemanaId());
  const [ordenActivo, setOrdenActivo] = useState<OrdenTablero>("manual");
  const [sentidoOrden, setSentidoOrden] = useState<SentidoOrden>("asc");
  const [tareaEnEdicion, setTareaEnEdicion] = useState<Tarea | null>(null);
  const [borradorNuevaTarea, setBorradorNuevaTarea] = useState<BorradorTarea | null>(null);
  const [modalPersonaAbierto, setModalPersonaAbierto] = useState(false);
  const [modalCargaAbierto, setModalCargaAbierto] = useState(false);
  const [estadoArrastre, setEstadoArrastre] = useState<EstadoArrastre>(null);
  const [destinoDrop, setDestinoDrop] = useState<DestinoArrastre | null>(null);
  const [mensajeSistema, setMensajeSistema] = useState<MensajeSistema>(null);
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [agruparPorPersona, setAgruparPorPersona] = useState(false);

  useEffect(() => {
    const almacenamientoPersonasLocal =
      typeof window !== "undefined"
        ? window.localStorage.getItem(almacenamientoPersonas)
        : null;

    const personasBase = (() => {
      if (!almacenamientoPersonasLocal) {
        return personasEjemplo;
      }

      try {
        return normalizarPersonas(JSON.parse(almacenamientoPersonasLocal) as Persona[]);
      } catch {
        return personasEjemplo;
      }
    })();

    const almacenamiento =
      typeof window !== "undefined"
        ? window.localStorage.getItem(almacenamientoTareas)
        : null;

    setPersonas(personasBase);

    if (!almacenamiento) {
      setTareas(sincronizarTareasConPersonas(tareasEjemplo, personasBase));
      setHidratado(true);
      return;
    }

    try {
      const recuperadas = JSON.parse(almacenamiento) as Tarea[];
      setTareas(
        normalizarIndices(
          sincronizarTareasConPersonas(
            normalizarTareasPersistidas(recuperadas),
            personasBase
          )
        )
      );
    } catch {
      setTareas(sincronizarTareasConPersonas(tareasEjemplo, personasBase));
    } finally {
      setHidratado(true);
    }
  }, []);

  useEffect(() => {
    if (!hidratado || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(almacenamientoTareas, JSON.stringify(tareas));
  }, [hidratado, tareas]);

  useEffect(() => {
    if (!hidratado || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(almacenamientoPersonas, JSON.stringify(personas));
  }, [hidratado, personas]);

  useEffect(() => {
    if (!mensajeSistema) {
      return;
    }

    const temporizador = window.setTimeout(() => {
      setMensajeSistema(null);
    }, 2400);

    return () => window.clearTimeout(temporizador);
  }, [mensajeSistema]);

  const tareasSemanales = useMemo(
    () => tareas.filter((t) => t.semanaId === semanaActiva),
    [tareas, semanaActiva]
  );

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

  const tareasPorPersona = useMemo(
    () =>
      tareasSemanales.reduce<Record<string, number>>((acumulado, tarea) => {
        acumulado[tarea.personaAsignadaId] =
          (acumulado[tarea.personaAsignadaId] ?? 0) + 1;
        return acumulado;
      }, {}),
    [tareasSemanales]
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
      return {
        id: pid,
        persona: p,
        tareas: porPersona[pid],
      };
    });

    return lanes.sort((a, b) => {
      if (a.id === "sin-asignar") return 1;
      if (b.id === "sin-asignar") return -1;
      return (a.persona?.nombre || "").localeCompare(b.persona?.nombre || "");
    });
  }, [agruparPorPersona, tareasSemanales, personas]);

  function abrirCreacionRapida() {
    setBorradorNuevaTarea(crearBorradorVacio("DEFINIDO", personas, semanaActiva));
  }

  function guardarNuevaTarea(borrador: BorradorTarea) {
    const indiceOrden = obtenerSiguienteIndice(tareas, borrador.estado);
    const nuevaTarea = crearTareaDesdeBorrador(borrador, indiceOrden);

    setTareas((estadoActual) => normalizarIndices([...estadoActual, nuevaTarea]));
    setBorradorNuevaTarea(null);
    setMensajeSistema({ tipo: "exito", texto: "Tarea creada correctamente." });
  }

  function guardarEdicionCompleta(tareaActualizada: Tarea) {
    setTareas((estadoActual) => {
      const anterior = estadoActual.find(
        (tarea) => tarea.identificador === tareaActualizada.identificador
      );

      if (!anterior) {
        return estadoActual;
      }

      const resto = estadoActual.filter(
        (tarea) => tarea.identificador !== tareaActualizada.identificador
      );

      const indiceOrden =
        anterior.estado === tareaActualizada.estado
          ? anterior.indiceOrden
          : obtenerSiguienteIndice(resto, tareaActualizada.estado);

      return normalizarIndices([
        ...resto,
        {
          ...tareaActualizada,
          indiceOrden
        }
      ]);
    });

    setTareaEnEdicion(null);
    setMensajeSistema({ tipo: "exito", texto: "Cambios guardados." });
  }

  function guardarTituloRapido(identificador: string, titulo: string) {
    const tituloLimpio = limpiarTextoPlano(titulo, limitesSeguridad.tituloMaximo);

    if (!tituloLimpio) {
      setMensajeSistema({ tipo: "error", texto: "El título no puede quedar vacío." });
      return;
    }

    setTareas((estadoActual) =>
      estadoActual.map((tarea) =>
        tarea.identificador === identificador
          ? {
              ...tarea,
              titulo: tituloLimpio
            }
          : tarea
      )
    );
    setMensajeSistema({ tipo: "exito", texto: "Título actualizado." });
  }

  function eliminarTarea(identificador: string) {
    const confirmar = window.confirm(
      "Esta acción eliminará la tarea. ¿Quieres continuar?"
    );

    if (!confirmar) {
      return;
    }

    setTareas((estadoActual) =>
      normalizarIndices(
        estadoActual.filter((tarea) => tarea.identificador !== identificador)
      )
    );
    setTareaEnEdicion(null);
    setMensajeSistema({ tipo: "exito", texto: "Tarea eliminada." });
  }

  function crearDesdeCargaRapida(configuracion: ConfiguracionCargaRapida) {
    const titulos = limitarColeccion(
      configuracion.lineas
        .split("\n")
        .map((linea) =>
          limpiarTextoPlano(
            linea.replace(/^[\s*-]+/, ""),
            limitesSeguridad.tituloMaximo
          )
        )
        .filter(Boolean),
      limitesSeguridad.lineasCargaRapidaMaximas
    );

    if (titulos.length === 0) {
      setMensajeSistema({
        tipo: "error",
        texto: "Pega al menos una línea con un título de tarea."
      });
      return;
    }

    setTareas((estadoActual) => {
      const base = [...estadoActual];

      titulos.forEach((titulo) => {
        const nuevaTarea = crearTareaDesdeBorrador(
          {
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
          },
          obtenerSiguienteIndice(base, configuracion.estado)
        );

        base.push(nuevaTarea);
      });

      return normalizarIndices(base);
    });

    setModalCargaAbierto(false);
    setMensajeSistema({
      tipo: "exito",
      texto: `${titulos.length} tareas creadas mediante carga rápida.`
    });
  }

  function guardarNuevaPersona(borrador: BorradorPersona) {
    const nuevaPersona = crearPersonaDesdeBorrador(borrador, personas.length);

    setPersonas((estadoActual) => [...estadoActual, nuevaPersona]);
    setTareas((estadoActual) =>
      estadoActual.map((tarea) =>
        !tarea.personaAsignadaId
          ? { ...tarea, personaAsignadaId: nuevaPersona.identificador }
          : tarea
      )
    );
    setModalPersonaAbierto(false);
    setMensajeSistema({ tipo: "exito", texto: "Persona creada correctamente." });
  }

  function iniciarArrastre(identificador: string, origen: EstadoKanban) {
    if (!arrastreDisponible) {
      return;
    }

    setEstadoArrastre({ identificador, origen });
  }

  function moverASemanaSiguiente() {
    if (seleccionadas.length === 0) return;
    const proximaSemana = obtenerSemanaRelativa(semanaActiva, 1);
    
    setTareas(actual => {
      return actual.map(t => {
        if (seleccionadas.includes(t.identificador)) {
          return { ...t, semanaId: proximaSemana };
        }
        return t;
      });
    });
    
    setSeleccionadas([]);
    setMensajeSistema({ tipo: "exito", texto: `${seleccionadas.length} tareas movidas a la semana siguiente.` });
  }

  function eliminarSeleccionadas() {
    if (seleccionadas.length === 0) return;
    if (!confirm(`¿Estás seguro de eliminar ${seleccionadas.length} tareas?`)) return;
    setTareas(actual => actual.filter(t => !seleccionadas.includes(t.identificador)));
    setSeleccionadas([]);
    setMensajeSistema({ tipo: "exito", texto: `${seleccionadas.length} tareas eliminadas.` });
  }

  function duplicarSeleccionadas() {
    if (seleccionadas.length === 0) return;
    setTareas(actual => {
      const nuevas: Tarea[] = [];
      actual.forEach(t => {
        nuevas.push(t);
        if (seleccionadas.includes(t.identificador)) {
          nuevas.push({ 
            ...t, 
            identificador: generarIdentificador(), 
            titulo: `${t.titulo} (copia)`,
            fechaCreacion: new Date().toISOString()
          });
        }
      });
      return nuevas;
    });
    setSeleccionadas([]);
    setMensajeSistema({ tipo: "exito", texto: `${seleccionadas.length} tareas duplicadas.` });
  }

  function finalizarArrastre() {
    setEstadoArrastre(null);
    setDestinoDrop(null);
  }

  function actualizarDestino(destino: DestinoArrastre) {
    if (!arrastreDisponible || !estadoArrastre) {
      return;
    }

    setDestinoDrop(destino);
  }

  function completarDrop() {
    if (!arrastreDisponible || !estadoArrastre || !destinoDrop) {
      return;
    }

    setTareas((estadoActual) =>
      moverTarea(estadoActual, estadoArrastre.identificador, destinoDrop)
    );
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

  if (!hidratado) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  const infoSemana = obtenerInfoSemana(semanaActiva);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.35),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(254,215,170,0.35),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[98%] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/80 px-6 py-6 shadow-panel backdrop-blur xl:px-8">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(14,165,233,0.08),rgba(251,191,36,0.08),rgba(16,185,129,0.08))]" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                miniKanbanPlus
              </span>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                gestor básico de tareas
              </h1>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
              {/* Navegación Semanal */}
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
                <button
                  onClick={() => navegarSemana(-1)}
                  className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  title="Semana anterior"
                >
                  ◀
                </button>
                <div className="flex flex-col items-center px-4 min-w-[140px]">
                  <span className="text-sm font-bold text-slate-900">Semana {infoSemana.numero}</span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                    {formatearRangoSemana(infoSemana.inicio, infoSemana.fin)}
                  </span>
                </div>
                <button
                  onClick={() => navegarSemana(1)}
                  className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  title="Semana siguiente"
                >
                  ▶
                </button>
                <button
                  onClick={irHoy}
                  className="ml-1 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-sky-600 hover:bg-sky-50 transition-colors"
                >
                  Hoy
                </button>
              </div>

              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <span className="font-medium text-slate-700">Ordenar por</span>
                <select
                  className="bg-transparent font-medium text-slate-900 outline-none"
                  value={ordenActivo}
                  onChange={(evento) =>
                    setOrdenActivo(evento.target.value as OrdenTablero)
                  }
                >
                  <option value="manual">Orden manual</option>
                  <option value="titulo">Título</option>
                  <option value="tipo">Tipo</option>
                  <option value="prioridad">Prioridad</option>
                  <option value="fechaDeseable">Fecha deseable</option>
                  <option value="fechaCreacion">Fecha de creación</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() =>
                  setSentidoOrden((valorActual) =>
                    valorActual === "asc" ? "desc" : "asc"
                  )
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
              >
                {sentidoOrden === "asc" ? "Ascendente" : "Descendente"}
              </button>

              <button
                type="button"
                onClick={() => setAgruparPorPersona((actual) => !actual)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 ${
                  agruparPorPersona
                    ? "border-sky-300 bg-sky-50 text-sky-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950"
                }`}
                title="Mostrar u ocultar carriles por persona"
              >
                {agruparPorPersona ? "🏊‍♀️ Calles activas" : "🏊 Vista agrupada"}
              </button>

              <button
                type="button"
                onClick={() => setModalCargaAbierto(true)}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-100"
              >
                Carga rápida
              </button>

              <button
                type="button"
                onClick={abrirCreacionRapida}
                className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-500"
              >
                Nueva tarea
              </button>
            </div>
          </div>

          {!arrastreDisponible ? (
            <div className="relative mt-5 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
              El drag & drop se desactiva mientras el tablero usa un orden distinto
              al manual.
            </div>
          ) : null}
        </section>

        {/* Barra de Acciones en Lote (Flotante) */}
        {seleccionadas.length > 0 && hidratado && (
          <div className="fixed bottom-8 left-1/2 z-[60] -translate-x-1/2 flex items-center gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-2xl">
            <div className="flex flex-col border-r border-slate-100 pr-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Seleccionadas</span>
              <span className="text-sm font-black text-sky-600">{seleccionadas.length} tareas</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={duplicarSeleccionadas}
                className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                👯 Duplicar
              </button>
              <button
                onClick={moverASemanaSiguiente}
                className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-colors"
              >
                ➡️ Mover a prox. semana
              </button>
              <button
                onClick={eliminarSeleccionadas}
                className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors"
              >
                🗑️ Eliminar
              </button>
              <button
                onClick={() => setSeleccionadas([])}
                className="ml-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}


        <section className="mt-6 flex-1 overflow-x-auto pb-4">
          {agruparPorPersona && swimlanes ? (
            <div className="flex flex-col gap-6 min-w-max">
              {swimlanes.map((lane) => (
                <div
                  key={lane.id}
                  className="flex gap-[18px] rounded-[32px] border border-slate-200 bg-white/40 p-5 shadow-sm backdrop-blur"
                >
                  <div className="flex w-[140px] shrink-0 flex-col items-center justify-center rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm">
                    {lane.persona ? (
                      <>
                        <img
                          src={lane.persona.foto}
                          alt={lane.persona.nombre}
                          className="h-[60px] w-[60px] rounded-[18px] bg-slate-100 object-cover shadow-sm"
                        />
                        <span className="mt-4 text-center text-[12px] font-black leading-tight text-slate-700">
                          {lane.persona.nombre}
                        </span>
                        <span className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {lane.persona.area || "Equipo"}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-slate-100 text-2xl text-slate-400">
                          ?
                        </div>
                        <span className="mt-4 text-center text-[12px] font-black leading-tight text-slate-500">
                          Sin asignar
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-1 gap-5">
                    {columnas.map((columna) => {
                      const tareasDeColumnaYPersona = columna.tareas.filter(
                        (t) => (t.personaAsignadaId || "sin-asignar") === lane.id
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
            <div className="flex min-w-max gap-5">
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

      {tareaEnEdicion ? (
        <ModalTarea
          modo="editar"
          tarea={tareaEnEdicion}
          personas={personas}
          onCerrar={() => setTareaEnEdicion(null)}
          onGuardarEdicion={guardarEdicionCompleta}
          onEliminar={eliminarTarea}
        />
      ) : null}

      {borradorNuevaTarea ? (
        <ModalTarea
          modo="crear"
          borrador={borradorNuevaTarea}
          personas={personas}
          onCerrar={() => setBorradorNuevaTarea(null)}
          onGuardarNueva={guardarNuevaTarea}
        />
      ) : null}

      {modalPersonaAbierto ? (
        <ModalPersona
          onCerrar={() => setModalPersonaAbierto(false)}
          onGuardar={guardarNuevaPersona}
        />
      ) : null}

      {modalCargaAbierto ? (
        <ModalCargaRapida
          configuracionInicial={configuracionCargaInicial}
          onCerrar={() => setModalCargaAbierto(false)}
          onCrear={crearDesdeCargaRapida}
        />
      ) : null}

      {mensajeSistema ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${
              mensajeSistema.tipo === "exito"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {mensajeSistema.texto}
          </div>
        </div>
      ) : null}
    </main>
  );
}
