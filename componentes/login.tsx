"use client";

import { useState } from "react";
import { login } from "@/lib/auth";
import { type Sesion } from "@/tipos/tareas";
import { obtenerPersonas } from "@/lib/personas";

type PaginaLoginProps = {
  alEntrar: (sesion: Sesion) => void;
};

export function PaginaLogin({ alEntrar }: PaginaLoginProps) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const sesion = await login(usuario, clave);
      if (sesion) {
        alEntrar(sesion);
      } else {
        setError("Credenciales incorrectas. Revisa tu email y contraseña.");
      }
    } catch (err) {
      setError("Hubo un problema al conectar con el servidor.");
    }
  }

  return (
    <div className="relative w-full max-w-md space-y-8 rounded-[48px] border border-slate-200 bg-white p-10 shadow-3xl xl:p-12 font-sans selection:bg-sky-500/30">
        <div className="text-center">
          <div className="flex justify-center">
            <img 
              src="https://www.innovaexport.com/wp-content/uploads/2022/10/logo-ide_compartir_link_web-1.jpg" 
              alt="InnovaExport Logo" 
              className="h-28 w-auto rounded-3xl shadow-2xl transition-transform hover:scale-105"
            />
          </div>
        </div>

        <form className="mt-12 space-y-6" onSubmit={manejarEnvio}>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Email de Usuario
              </label>
              <input
                type="email"
                required
                className="block w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-4 text-slate-950 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:bg-white"
                placeholder="tu@email.com"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                className="block w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-4 text-slate-950 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:bg-white"
                placeholder="••••••••"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400 border border-rose-500/20 animate-in fade-in zoom-in-95">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="group relative flex w-full items-center justify-center gap-2 rounded-[24px] bg-slate-950 px-4 py-4 text-base font-black text-white shadow-xl transition-all hover:bg-sky-600 hover:shadow-sky-200 active:scale-[0.98] active:shadow-inner"
          >
            Acceder al Sistema
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </form>

      </div>
  );
}
