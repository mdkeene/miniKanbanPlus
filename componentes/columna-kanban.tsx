import { TarjetaTarea } from "@/componentes/tarjeta-tarea";
import type {
  DestinoArrastre,
  EstadoKanban,
  Persona,
  Tarea
} from "@/tipos/tareas";

type PropiedadesColumnaKanban = {
  estado: EstadoKanban;
  titulo: string;
  tareas: Tarea[];
  personas: Persona[];
  estilos: { fondo: string; borde: string; brillo: string };
  arrastreDisponible: boolean;
  estadoArrastre: { identificador: string; origen: EstadoKanban } | null;
  destinoDrop: DestinoArrastre | null;
  personaId?: string;
  onAbrir: (tarea: Tarea) => void;
  onEditarTitulo: (identificador: string, titulo: string) => void;
  onIniciarArrastre: (identificador: string, estado: EstadoKanban) => void;
  onFinalizarArrastre: () => void;
  onActualizarDestino: (destino: DestinoArrastre) => void;
  onSoltar: () => void;
  seleccionadas: string[];
  alCambiarSeleccion: (identificador: string, seleccionada: boolean) => void;
  modoBloqueado?: boolean;
  claseAncho?: string;
};

export function ColumnaKanban({
  estado,
  titulo,
  tareas,
  personas,
  estilos,
  arrastreDisponible,
  estadoArrastre,
  destinoDrop,
  personaId,
  onAbrir,
  onEditarTitulo,
  onIniciarArrastre,
  onFinalizarArrastre,
  onActualizarDestino,
  onSoltar,
  seleccionadas,
  alCambiarSeleccion,
  modoBloqueado = false,
  claseAncho
}: PropiedadesColumnaKanban) {
  const destinoCoincide = destinoDrop?.estado === estado && destinoDrop?.personaId === personaId;
  const mostrarHuecoFinal = destinoCoincide && destinoDrop.indice === tareas.length;

  return (
    <section
      className={`flex ${claseAncho || "w-[340px] md:w-[360px] 2xl:w-[420px]"} shrink-0 flex-col rounded-[28px] border-2 ${estilos.borde} ${estilos.brillo} p-4 transition-all`}
      onDragOver={(evento) => {
        if (!arrastreDisponible || !estadoArrastre) {
          return;
        }

        evento.preventDefault();
        onActualizarDestino({ estado, indice: tareas.length, personaId });
      }}
      onDrop={(evento) => {
        if (!arrastreDisponible) {
          return;
        }

        evento.preventDefault();
        onSoltar();
      }}
    >
      <header
        className={`rounded-[22px] border border-slate-100 ${estilos.fondo} px-4 py-4`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{titulo}</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-600">
              {tareas.length} tareas
            </p>
          </div>
          <div className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm font-semibold text-slate-700">
            {tareas.length}
          </div>
        </div>
      </header>

      <div className="mt-4 grid min-h-[220px] grid-cols-1 gap-3 2xl:grid-cols-2">
        {tareas.map((tarea, indice) => {
          const mostrarHueco =
            destinoCoincide &&
            destinoDrop.indice === indice &&
            estadoArrastre?.identificador !== tarea.identificador;

          return (
            <div
              key={tarea.identificador}
              onDragOver={(evento) => {
                if (!arrastreDisponible || !estadoArrastre) {
                  return;
                }

                evento.preventDefault();
                onActualizarDestino({ estado, indice, personaId });
              }}
              onDrop={(evento) => {
                if (!arrastreDisponible) {
                  return;
                }

                evento.preventDefault();
                onSoltar();
              }}
              className="space-y-3"
            >
              {mostrarHueco ? (
                <div className="h-24 rounded-3xl border-2 border-dashed border-sky-300 bg-sky-100/60 transition-all" />
              ) : null}

              <TarjetaTarea
                tarea={tarea}
                personaAsignada={
                  personas.find(
                    (persona) => persona.identificador === tarea.personaAsignadaId
                  ) ?? null
                }
                arrastrable={arrastreDisponible}
                estaArrastrando={estadoArrastre?.identificador === tarea.identificador}
                onAbrir={() => onAbrir(tarea)}
                onEditarTitulo={onEditarTitulo}
                onIniciarArrastre={() => onIniciarArrastre(tarea.identificador, tarea.estado)}
                onFinalizarArrastre={onFinalizarArrastre}
                seleccionada={seleccionadas.includes(tarea.identificador)}
                alCambiarSeleccion={(sel) => alCambiarSeleccion(tarea.identificador, sel)}
                modoBloqueado={modoBloqueado}
              />
            </div>
          );
        })}

        {mostrarHuecoFinal ? (
          <div className="h-24 rounded-3xl border-2 border-dashed border-sky-300 bg-sky-100/60 transition-all" />
        ) : null}
      </div>
    </section>
  );
}
