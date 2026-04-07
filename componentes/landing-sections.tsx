"use client";

import { ReactNode } from "react";

export function Section({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`py-24 px-6 lg:px-10 ${className}`}>
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </section>
  );
}

export function LandingCard({ title, children, icon, color = "sky" }: { title: string; children: ReactNode; icon: string; color?: "sky" | "amber" | "emerald" | "slate" }) {
  const colorClasses = {
    sky: "bg-sky-50 text-sky-600 border-sky-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return (
    <div className="group relative rounded-[40px] border-2 border-white bg-white/60 p-10 shadow-xl backdrop-blur-sm transition-all hover:-translate-y-2 hover:bg-white hover:shadow-2xl">
      <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl shadow-inner ${colorClasses[color]}`}>
        {icon}
      </div>
      <h3 className="mb-4 text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
      <div className="text-lg leading-relaxed text-slate-600 font-medium">
        {children}
      </div>
    </div>
  );
}

export function HeroTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <div className="text-center">
      {subtitle && (
        <span className="inline-block rounded-full bg-sky-100 px-6 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-600 mb-6 shadow-sm">
          {subtitle}
        </span>
      )}
      <h1 className="text-5xl font-black tracking-tighter text-slate-950 sm:text-7xl lg:text-8xl leading-[1.1]">
        {children}
      </h1>
    </div>
  );
}

export function Quote({ children, author }: { children: ReactNode; author?: string }) {
  return (
    <figure className="relative my-16 rounded-[40px] border-l-8 border-sky-500 bg-sky-50/50 p-12 shadow-xl overflow-hidden backdrop-blur-sm">
      <div className="absolute top-0 right-0 h-40 w-40 translate-x-20 -translate-y-20 rounded-full bg-sky-500/10 blur-3xl" />
      <blockquote className="relative text-3xl font-black italic tracking-tight text-slate-900 sm:text-4xl leading-snug">
        "{children}"
      </blockquote>
      {author && (
        <figcaption className="mt-8 flex items-center gap-4 text-xl font-bold text-sky-600">
          <span className="h-px w-10 bg-sky-400" />
          {author}
        </figcaption>
      )}
    </figure>
  );
}
