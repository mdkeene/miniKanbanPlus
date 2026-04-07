"use client";

import { type Sesion } from "@/tipos/tareas";
import { PaginaLogin } from "./login";

type LandingPageProps = {
  alEntrar: (sesion: Sesion) => void;
};

export function LandingPage({ alEntrar }: LandingPageProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-white font-sans text-slate-900 selection:bg-sky-500/20 overflow-x-hidden">
      
      {/* Columna Izquierda: Estrategia y Visual (High Impact) */}
      <section className="relative flex w-full flex-col justify-center bg-slate-950 p-8 lg:w-1/2 lg:p-20 overflow-hidden">
        {/* Ambient Decorative Background */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] h-[70%] w-[70%] rounded-full bg-sky-600/30 blur-[180px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-700/30 blur-[150px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        </div>

        <div className="relative z-10 space-y-10 lg:space-y-16">
          {/* Corporate Badge */}
          <div className="inline-flex rounded-full bg-white/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-sky-400 shadow-sm border border-white/10 backdrop-blur-md">
             Strategic Core • InnovaExport
          </div>

          <div className="space-y-6">
            {/* Primary Strategic Quote */}
            <blockquote className="text-4xl md:text-6xl font-black italic tracking-tighter text-white leading-[1.05] max-w-2xl">
              "Una estrategia no comunicada es una estrategia no existente."
            </blockquote>
            <div className="h-2 w-24 bg-sky-500 rounded-full" />
          </div>

          {/* Boardroom Visualization FIG */}
          <div className="group relative w-full max-w-xl aspect-video rounded-[32px] md:rounded-[48px] border-4 border-white/10 bg-slate-900 shadow-2xl overflow-hidden shadow-sky-500/20">
             <img 
               src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWpraGNobTJjNjRrZGJicmkxYnhhbWp3M2s1M2w0eGpmemJiNjJvYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/irBRf1pU2hqDj73DKm/giphy.gif" 
               alt="Management Board in Action" 
               className="h-full w-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
             <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Live Performance Matrix</span>
             </div>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute bottom-0 right-0 p-10 opacity-5 pointer-events-none">
           <p className="text-[120px] font-black text-white leading-none select-none">
             HQ
           </p>
        </div>
      </section>

      {/* Columna Derecha: Acceso Portal (Clean & Focused) */}
      <section className="flex w-full flex-col justify-center bg-slate-50 p-6 lg:w-1/2 lg:p-20 relative">
        <div className="mx-auto w-full max-w-md space-y-12 lg:space-y-16">
           {/* Direct Login Form Attachment */}
           <div className="w-full">
              <PaginaLogin alEntrar={alEntrar} />
           </div>

           {/* Performance Philosophy Grounding */}
           <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4 text-slate-300">
                 <div className="h-px w-8 bg-current" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">The Philosophy</span>
                 <div className="h-px w-8 bg-current" />
              </div>
              <p className="text-lg md:text-xl font-black tracking-tight text-slate-400 leading-relaxed uppercase">
                Personas e interacciones <span className="text-slate-950">sobre procesos y herramientas</span>
              </p>
           </div>
        </div>

        {/* Minimalist Corporate Footer */}
        <footer className="absolute bottom-8 left-0 w-full text-center px-6">
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
             © 2026 miniKanbanPlus • High Performance Teams SDK
           </p>
        </footer>
      </section>

    </div>
  );
}
