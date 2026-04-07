"use client";

import { type Sesion } from "@/tipos/tareas";
import { PaginaLogin } from "./login";

type LandingPageProps = {
  alEntrar: (sesion: Sesion) => void;
};

export function LandingPage({ alEntrar }: LandingPageProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-sky-500/20 flex flex-col items-center justify-center p-6 sm:p-10">
      {/* Background Decor - Subtle Premium Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] h-[50%] w-[50%] rounded-full bg-sky-200/40 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-15%] h-[50%] w-[50%] rounded-full bg-indigo-200/40 blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-25" />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center gap-10 md:gap-16">
        {/* Header Section with Direct Strategy Quote */}
        <div className="text-center space-y-4 md:space-y-6">
           <div className="inline-flex rounded-full bg-white px-5 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-sky-600 shadow-sm border border-slate-100">
             Acceso Directo • InnovaExport
           </div>
           <blockquote className="text-3xl md:text-6xl font-black italic tracking-tighter text-slate-950 leading-[1] max-w-3xl mx-auto px-4">
             "Una estrategia no comunicada es una estrategia no existente."
           </blockquote>
        </div>

        {/* Central Component: The Login Box Direct Access */}
        <div className="w-full max-w-md">
           <PaginaLogin alEntrar={alEntrar} />
        </div>

        {/* Secondary Goal Quote as a Philosophy Anchor */}
        <div className="max-w-2xl text-center">
           <p className="text-sm md:text-lg font-black tracking-[0.15em] text-slate-400 leading-relaxed uppercase">
             Personas e interacciones <span className="text-slate-950">sobre procesos y herramientas</span>
           </p>
        </div>
      </div>

      {/* Strategic Footer */}
      <footer className="absolute bottom-8 text-center w-full px-6 opacity-40">
         <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">
           High Performance Teams • Strategy Communication SDK
         </p>
      </footer>
    </div>
  );
}
