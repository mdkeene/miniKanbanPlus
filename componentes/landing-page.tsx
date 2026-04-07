"use client";

import { type Sesion } from "@/tipos/tareas";
import { PaginaLogin } from "./login";

type LandingPageProps = {
  alEntrar: (sesion: Sesion) => void;
};

export function LandingPage({ alEntrar }: LandingPageProps) {
  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-screen bg-white font-sans text-slate-900 selection:bg-sky-500/20 overflow-y-auto lg:overflow-hidden">
      
      {/* Columna Izquierda: Estrategia (60% Width) */}
      <section className="relative flex w-full flex-col justify-center bg-slate-950 p-6 lg:p-16 xl:p-24 lg:w-3/5 lg:h-full overflow-hidden shrink-0 lg:shrink z-10">
        {/* Ambient Decorative Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] h-[70%] w-[70%] rounded-full bg-sky-600/30 blur-[150px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-700/30 blur-[120px]" />
        </div>

        <div className="relative z-10 space-y-6 lg:space-y-12">
          {/* Badge Corporate (Desktop only) */}
          <div className="hidden lg:inline-flex rounded-full bg-white/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-sky-400 border border-white/10 backdrop-blur-md">
             Strategic Core • InnovaExport
          </div>

          <div className="space-y-4 lg:space-y-6">
            {/* Reduced Quote Size on Mobile */}
            <blockquote className="text-xl md:text-5xl lg:text-3xl xl:text-5xl font-black italic tracking-tighter text-white leading-tight lg:leading-[1.1] max-w-2xl">
              "Una estrategia no comunicada es una estrategia no existente."
            </blockquote>
            <div className="h-1.5 w-16 lg:w-20 bg-sky-500 rounded-full" />
          </div>

          {/* Giphy GIF Box - Proportional Scaling */}
          <div className="group relative w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl aspect-video rounded-[32px] md:rounded-[40px] border-4 border-white/10 bg-slate-900 shadow-2xl overflow-hidden shadow-sky-500/10">
             <img 
               src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWpraGNobTJjNjRrZGJicmkxYnhhbWp3M2s1M2w0eGpmemJiNjJvYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/irBRf1pU2hqDj73DKm/giphy.gif" 
               alt="Management Board" 
               className="h-full w-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
             <div className="absolute bottom-4 left-5 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Global Ops Monitor</span>
             </div>
          </div>
        </div>

        {/* Desktop Decorative Watermark */}
        <div className="hidden lg:block absolute bottom-0 right-0 p-10 opacity-5 pointer-events-none">
           <p className="text-[120px] font-black text-white leading-none select-none">
             HQ
           </p>
        </div>
      </section>

      {/* Columna Derecha: Acceso Portal (40% Width) */}
      <section className="flex w-full flex-col justify-center bg-slate-50 p-4 lg:p-12 xl:p-20 lg:w-2/5 lg:h-full lg:overflow-hidden relative">
        <div className="mx-auto w-full max-w-md flex items-center justify-center py-4 lg:py-0">
           {/* Formulario Login Ultra-Clean */}
           <div className="w-full">
              <PaginaLogin alEntrar={alEntrar} />
           </div>
        </div>
      </section>

    </div>
  );
}
