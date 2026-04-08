"use client";

import { useState } from "react";
import { login, registrar } from "@/lib/auth";
import { type Sesion } from "@/tipos/tareas";

type PaginaLoginProps = {
  alEntrar: (sesion: Sesion) => void;
};

type EstadoLogin = "idle" | "activar" | "exito";

export function PaginaLogin({ alEntrar }: PaginaLoginProps) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [estado, setEstado] = useState<EstadoLogin>("idle");
  const [error, setError] = useState("");
  const [welcomeGif, setWelcomeGif] = useState<string | null>(null);

  const welcomeGifs = [
    "https://media.giphy.com/media/mCbUi0FyYhHHhutEV8/giphy.gif",
    "https://media.giphy.com/media/XD9o33QG9BoMis7iM4/giphy.gif",
    "https://media.giphy.com/media/ggtpYV17RP9lTbc542/giphy.gif",
    "https://media.giphy.com/media/VPcVGQVX5WOMU/giphy.gif"
  ];

  async function manejarAcceso(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      if (estado === "activar") {
        // Flujo de activación
        const sesion = await registrar(usuario, clave);
        if (sesion) {
          setWelcomeGif(welcomeGifs[Math.floor(Math.random() * welcomeGifs.length)]);
          setEstado("exito");
          setTimeout(() => alEntrar(sesion), 3000);
        }
      } else {
        // Flujo de login normal
        const sesion = await login(usuario, clave);
        if (sesion) {
          alEntrar(sesion);
        } else {
          // Si el login falla, podría ser un invitado nuevo
          setError("Credenciales incorrectas. Si Michael te ha invitado recientemente, pulsa en 'Activa tu Acceso' debajo.");
          setEstado("activar");
        }
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar el acceso.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="relative w-full max-w-sm space-y-10 font-sans selection:bg-sky-500/30 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="https://www.innovaexport.com/wp-content/uploads/2022/10/logo-ide_compartir_link_web-1.jpg" 
              alt="InnovaExport Logo" 
              className="h-20 w-auto rounded-3xl shadow-2xl shadow-sky-500/20 transition-transform hover:scale-105"
            />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {estado === "activar" ? "Perfil por Activar" : "Centro de Mando Ágil"}
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            {estado === "activar" ? "Establece tu contraseña para entrar." : "InnovaExport Productivity Suite"}
          </p>
        </div>

        <div className="bg-white/40 backdrop-blur-xl border border-white rounded-[32px] p-8 shadow-2xl shadow-slate-200/50">
          {estado === "exito" ? (
             <div className="text-center py-6 space-y-6 animate-in zoom-in duration-500">
                <div className="relative mx-auto w-48 h-48 md:w-56 md:h-56">
                  <div className="absolute -inset-4 bg-sky-500/20 blur-2xl rounded-full animate-pulse" />
                  <img 
                    src={welcomeGif || ""} 
                    className="relative w-full h-full object-cover rounded-[32px] border-4 border-white shadow-2xl" 
                    alt="Welcome" 
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">¡Bienvenido al Equipo!</h3>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-500">Activando tu espacio de trabajo...</p>
                </div>
             </div>
          ) : (
            <form className="space-y-6" onSubmit={manejarAcceso}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    Email de InnovaExport
                  </label>
                  <input
                    type="email"
                    required
                    className="block w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-slate-950 placeholder-slate-400 outline-none transition focus:border-sky-500"
                    placeholder="tu@email.com"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    {estado === "activar" ? "Define tu Contraseña" : "Tu Contraseña"}
                  </label>
                  <input
                    type="password"
                    required
                    className="block w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-slate-950 placeholder-slate-400 outline-none transition focus:border-sky-500"
                    placeholder="••••••••"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                  />
                  {estado === "activar" && (
                    <p className="text-[10px] font-bold text-sky-500 mt-2 px-1">
                      ✨ Esta será tu clave de acceso permanente a partir de ahora.
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-500 border border-rose-500/20">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={cargando}
                  className={`group relative flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-base font-black text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 ${
                    estado === "activar" ? "bg-sky-600 hover:bg-sky-500 shadow-sky-200" : "bg-slate-950 hover:bg-slate-800 shadow-slate-200"
                  }`}
                >
                  {cargando ? "Procesando..." : (estado === "activar" ? "Activar Ahora" : "Acceder al Sistema")}
                  {!cargando && <span className="transition-transform group-hover:translate-x-1">→</span>}
                </button>

                {estado === "idle" && (
                  <button 
                    type="button"
                    onClick={() => setEstado("activar")}
                    className="w-full text-center text-xs font-black text-sky-500 hover:text-sky-600 uppercase tracking-widest decoration-sky-500/30 underline underline-offset-4"
                  >
                    Activa tu Acceso
                  </button>
                )}

                {estado === "activar" && (
                  <button 
                    type="button"
                    onClick={() => setEstado("idle")}
                    className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Volver al Login normal
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
        
        <p className="text-center text-[10px] font-bold text-slate-400">
          InnovaExport Agile Command Center &copy; 2024
        </p>
      </div>
  );
}
