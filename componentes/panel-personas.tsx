import { AvatarPersona } from "@/componentes/avatar-persona";
import type { Persona } from "@/tipos/tareas";

type PropiedadesPanelPersonas = {
  personas: Persona[];
  totalTareas: number;
  tareasPorPersona: Record<string, number>;
  onNuevaPersona: () => void;
};

export function PanelPersonas({
  personas,
  totalTareas,
  tareasPorPersona,
  onNuevaPersona
}: PropiedadesPanelPersonas) {
  return (
    <section className="mt-6 rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-panel backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">
            Equipo
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Personas asignables
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Gestiona responsables del tablero y asigna cada tarea a una persona del
            equipo. 
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-1.5 text-[10px] font-bold text-sky-700 border border-sky-100 italic">
            💡 Nota Admin: Los usuarios de Supabase aparecerán aquí automáticamente al iniciar sesión o vía SQL Trigger.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            <span className="font-semibold">{personas.length}</span> personas activas
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold">{totalTareas}</span> tareas repartidas
          </div>
          <button
            type="button"
            onClick={onNuevaPersona}
            className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-indigo-500"
          >
            Nueva persona
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {personas.map((persona) => (
          <article
            key={persona.identificador}
            className="rounded-[24px] border border-slate-200 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(238,242,255,0.9))] p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <AvatarPersona nombre={persona.nombre} foto={persona.foto} tamano="grande" />
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  {persona.nombre}
                </h3>
                <p className="text-sm text-slate-500">{persona.area}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-3 py-2 text-sm">
              <span className="text-slate-500">Tareas asignadas</span>
              <span className="font-semibold text-slate-900">
                {tareasPorPersona[persona.identificador] ?? 0}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
