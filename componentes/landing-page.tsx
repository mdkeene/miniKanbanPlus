"use client";

import { useState } from "react";
import { type Sesion } from "@/tipos/tareas";
import { PaginaLogin } from "./login";
import { Section, LandingCard, HeroTitle, Quote } from "./landing-sections";
import qrCodeImg from "../public/assets/qr_code.jpg";

type LandingPageProps = {
  alEntrar: (sesion: Sesion) => void;
};

export function LandingPage({ alEntrar }: LandingPageProps) {
  const [mostrarLogin, setMostrarLogin] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-sky-500/20">
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 z-[100] w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 font-black text-white shadow-lg">MK</div>
            <span className="text-xl font-black tracking-tighter">miniKanbanPlus</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#quienes-somos" className="text-sm font-bold text-slate-500 hover:text-slate-950 transition-colors">Quiénes Somos</a>
            <a href="#que-ofrecemos" className="text-sm font-bold text-slate-500 hover:text-slate-950 transition-colors">Qué Ofrecemos</a>
            <a href="#legal" className="text-sm font-bold text-slate-500 hover:text-slate-950 transition-colors">Legal</a>
            <button 
              onClick={() => setMostrarLogin(true)}
              className="rounded-full bg-slate-950 px-6 py-2.5 text-sm font-black text-white shadow-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
            >
              Acceder a la App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Section id="hero" className="pt-32 pb-20">
        <HeroTitle subtitle="Equipos de Alto Rendimiento">
          Agilidad es la base para el <span className="text-sky-500">Alto Rendimiento</span>
        </HeroTitle>
        
        <p className="mx-auto mt-8 max-w-3xl text-center text-xl font-medium leading-relaxed text-slate-500 sm:text-2xl">
          Un tablero Kanban claro, visual y fácil de explicar. La mejor forma de visualizar cómo un equipo organiza su trabajo, prioridades y bloqueos.
        </p>
        
        <div className="mt-10 flex justify-center">
          <a
            href="https://github.com/rcanalescoder/miniKanbanPlus"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
               <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            El código fuente se encuentra en GitHub
          </a>
        </div>
      </Section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 -mt-16 relative z-10">
        <Quote>
          Una estrategia no comunicada es una estrategia no existente.
        </Quote>
      </div>

      {/* Filosofía Agil */}
      <Section id="filosofia" className="bg-sky-50/30 border-y border-slate-100 py-16 sm:py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Personas e interacciones sobre procesos y herramientas
            </h2>
            <div className="mt-8 space-y-6 text-xl font-medium text-slate-500 leading-relaxed">
              <p>
                Esta herramienta permite definir tareas en ámbitos semanales, pero lo realmente importante sucede antes de usarla.
              </p>
              <ul className="space-y-4">
                {[
                  "Verbalizar y definir los compromisos mutuos.",
                  "Realizar una coordinación efectiva del equipo.",
                  "Definir juntos la visión y la estrategia de la semana."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-600 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-lg font-bold text-slate-900 border-l-4 border-sky-500 pl-4 py-2">
                El panel constituye la herramienta que ordena el trabajo. No haremos el trabajo y luego modificaremos la herramienta.
              </p>
            </div>
          </div>
          <div className="relative aspect-square rounded-[60px] bg-gradient-to-br from-sky-400 to-indigo-500 p-8 shadow-2xl overflow-hidden group">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
             <div className="relative flex h-full flex-col items-center justify-center text-center text-white">
                <div className="text-8xl mb-8 animate-bounce">🚀</div>
                <h3 className="text-3xl font-black mb-4 capitalize">Núcleo del Rendimiento</h3>
                <p className="text-lg font-semibold opacity-95 max-w-xs leading-tight">Paneles de control para visualizar avances globales y particulares en tiempo real.</p>
                <div className="mt-10 px-8 py-4 bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 font-black uppercase tracking-[0.2em] text-xs">
                   Infografía de Estrategia
                </div>
             </div>
          </div>
        </div>
      </Section>

      {/* Quiénes Somos */}
      <Section id="quienes-somos" className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black tracking-tight text-slate-950 mb-8">Quiénes Somos</h2>
          <div className="prose prose-slate prose-lg max-w-none text-slate-500 font-medium leading-relaxed">
            <p className="text-2xl text-slate-900 font-bold mb-6 italic">
              Este proyecto es un ejemplo práctico de las capacidades de generación de código mediante vibe coding.
            </p>
            <p>
              Nuestra misión es demostrar cómo la tecnología puede actuar como catalizador para la organización del trabajo semanal, ayudando a los equipos a gestionar sus proyectos de manera visual y efectiva a través de paneles Kanban inteligentes.
            </p>
          </div>
        </div>
      </Section>

      {/* Qué Ofrecemos */}
      <Section id="que-ofrecemos" className="bg-gradient-to-br from-indigo-50 to-sky-50 rounded-[80px] my-6 mx-6 shadow-xl border border-indigo-100">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="lg:pl-10 py-8">
            <h2 className="text-4xl font-black tracking-tight text-slate-950 mb-6 sm:text-5xl">Qué Ofrecemos</h2>
            <p className="text-xl font-medium text-slate-600 leading-relaxed mb-8">
              Si este proyecto te gusta y te interesa, el profesor **Roberto Canales Mora** ofrece formaciones especializadas sobre la creación de equipos de alto rendimiento y metodologías ágiles.
            </p>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <a 
                href="https://robertocanales.com" 
                target="_blank"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-8 py-5 text-lg font-black text-white hover:bg-sky-600 transition-all hover:scale-105 shadow-xl"
              >
                robertocanales.com
              </a>
              <div className="flex items-center gap-4 text-sky-600 font-black tracking-tight uppercase text-sm">
                 <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                 Disponible para formación
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-8 lg:pr-10 pb-8">
            <div className="h-64 w-64 rounded-3xl bg-white p-2 shadow-2xl shadow-indigo-200/50 overflow-hidden ring-4 ring-white">
               <img src={qrCodeImg.src} alt="WhatsApp QR Code" className="h-full w-full object-cover rounded-2xl" />
            </div>
            <p className="text-center text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Escanéame</p>
          </div>
        </div>
      </Section>

      {/* Textos Legales */}
      <Section id="legal" className="py-16 sm:py-24">
        <div className="grid gap-12 grid-cols-1">
          <div className="rounded-[40px] border-2 border-slate-100 bg-slate-50 p-12">
            <h3 className="text-2xl font-black text-slate-950 mb-6">Texto Legal</h3>
            <div className="space-y-4 text-base font-medium text-slate-600 leading-relaxed italic">
              <p>
                Este proyecto es una herramienta gratuita que se entrega sin ninguna garantía de funcionamiento o integridad. El usuario final asume toda la responsabilidad sobre su uso.
              </p>
              <p>
                Se trata de un proyecto web de demostración y no está diseñado ni concebido para entornos de producción real. Se invita al usuario a descargar el repositorio oficial y realizar las modificaciones técnicas que considere oportunas para su aprendizaje.
              </p>
            </div>
          </div>
          
          <div className="rounded-[40px] border-2 border-slate-100 bg-slate-50 p-12">
            <h3 className="text-2xl font-black text-slate-950 mb-6 font-mono">MIT License (ES)</h3>
            <div className="space-y-4 text-xs font-mono text-slate-500 leading-relaxed p-4 bg-white rounded-2xl">
              <p className="font-bold underline text-slate-700">Licencia MIT en Castellano</p>
              <p>Por la presente se otorga permiso, sin cargo, a cualquier persona que obtenga una copia de este software y los archivos de documentación asociados (el "Software"), para tratar con el Software sin restricciones, incluido, sin limitación, los derechos de uso, copia, modificación, fusión, publicación, distribución, sublicencia y/o venta de copias del Software.</p>
              <p>Sujeto a las siguientes condiciones:</p>
              <p>El aviso de copyright anterior y este aviso de permiso se incluirán en todas las copias o partes sustanciales del Software.</p>
              <p className="font-bold text-sky-600 underline">RECONOCIMIENTO: Se requiere mención o contribución explícita reconociendo a Roberto Canales Mora en cualquier derivación o uso del software.</p>
              <p>EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTÍA DE NINGÚN TIPO, EXPRESA O IMPLÍCITA, INCLUIDAS, PERO NO LIMITADAS A, LAS GARANTÍAS DE COMERCIABILIDAD Y ADECUACIÓN PARA UN PROPÓSITO PARTICULAR.</p>
            </div>
          </div>
        </div>
      </Section>

      <footer className="border-t border-slate-100 py-12 px-6 lg:px-10 text-center">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">
          © 2026 miniKanbanPlus • Vibe Coding Example Project
        </p>
      </footer>

      {/* Modal Acceso / Login Overlay */}
      {mostrarLogin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="relative w-full max-w-md">
              <button 
                onClick={() => setMostrarLogin(false)}
                className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all font-bold"
              >
                ✕
              </button>
              <PaginaLogin alEntrar={alEntrar} />
           </div>
        </div>
      )}
    </div>
  );
}
