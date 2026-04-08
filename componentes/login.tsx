"use client";

import { useState } from "react";
import { login, registrar, buscarInvitacion } from "@/lib/auth";
import { type Sesion } from "@/tipos/tareas";

type PaginaLoginProps = {
  alEntrar: (sesion: Sesion) => void;
};

type FaseLogin = "email" | "password" | "activar" | "exito";

export function PaginaLogin({ alEntrar }: PaginaLoginProps) {
  const [fase, setFase] = useState<FaseLogin>("email");
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function verificarEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const invitado = await buscarInvitacion(usuario);
      if (invitado) {
        // Por ahora, asumimos que si está invitado y no puede loguear, debe activar.
        // Pero para simplificar el flujo UX, primero preguntamos la clave.
        // Si falla el login, ofreceremos activación si el perfil no tiene ID vinculado.
        setFase("password");
      } else {
        setError("Este email no figura en nuestra lista de miembros autorizados. Contacta con Michael.");
      }
    } catch (err) {
      setError("Error al verificar el acceso.");
    } finally {
      setCargando(false);
    }
  }

  async function manejarLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const sesion = await login(usuario, clave);
      if (sesion) {
        alEntrar(sesion);
      } else {
        // Si el login falla, comprobamos si es porque no tiene cuenta de Auth
        setError("Crendenciales incorrectas. Si es tu primera vez, usa el enlace de activación debajo.");
      }
    } catch (err) {
      setError("Hubo un problema al conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  async function manejarActivacion(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const sesion = await registrar(usuario, clave);
      if (sesion) {
        setFase("exito");
        setTimeout(() => alEntrar(sesion), 2000);
      }
    } catch (err: any) {
      setError(err.message || "Error al activar la cuenta.");
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
          
          {fase === "email" && (
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bienvenido al Centro Ágil</h2>
          )}
          {fase === "password" && (
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hola de nuevo</h2>
          )}
          {fase === "activar" && (
            <h2 className="text-2xl font-black text-sky-600 tracking-tight">Activa tu Acceso</h2>
          )}
        </div>

        <div className="bg-white/40 backdrop-blur-xl border border-white rounded-[32px] p-8 shadow-2xl shadow-slate-200/50">
          {fase === "exito" ? (
             <div className="text-center py-10 space-y-4">
                <div className="text-4xl">🎉</div>
                <h3 className="text-xl font-black text-slate-900">¡Cuenta Activada!</h3>
                <p className="text-sm font-medium text-slate-500">Redirigiendo a tu tablero...</p>
             </div>
          ) : (
            <form 
              className="space-y-6" 
              onSubmit={
                fase === "email" ? verificarEmail : 
                fase === "password" ? manejarLogin : 
                manejarActivacion
              }
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    readOnly={fase !== "email"}
                    className={`block w-full rounded-2xl border-2 px-4 py-4 text-slate-950 placeholder-slate-400 outline-none transition ${
                      fase === "email" ? "border-slate-200 focus:border-sky-500 bg-white" : "border-slate-100 bg-slate-50 text-slate-400"
                    }`}
                    placeholder="tu@email.com"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                  />
                </div>

                {fase !== "email" && (
                  <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                      {fase === "activar" ? "Crea tu Contraseña" : "Tu Contraseña"}
                    </label>
                    <input
                      type="password"
                      required
                      autoFocus
                      className="block w-full rounded-2xl border-2 border-sky-500 bg-white px-4 py-4 text-slate-950 placeholder-slate-400 outline-none transition focus:ring-4 focus:ring-sky-500/10"
                      placeholder="••••••••"
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                    />
                    {fase === "activar" && (
                       <p className="text-[10px] font-bold text-sky-500 mt-2 px-1">
                          ✨ Una vez activada, esta será tu clave de acceso permanente.
                       </p>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-500 border border-rose-500/20 animate-in shake duration-300">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 text-base font-black text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-sky-600 hover:shadow-sky-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                {cargando ? "Procesando..." : 
                 fase === "email" ? "Siguiente" : 
                 fase === "activar" ? "Activar Ahora" : "Entrar"}
                {!cargando && <span className="transition-transform group-hover:translate-x-1">→</span>}
              </button>

              {fase === "password" && (
                <button 
                  type="button"
                  onClick={() => setFase("activar")}
                  className="w-full text-center text-xs font-bold text-slate-400 hover:text-sky-600 transition-colors"
                >
                  ¿Es tu primera vez? <span className="text-sky-500 underline decoration-2 underline-offset-4">Activa tu cuenta</span>
                </button>
              )}

              {fase !== "email" && !cargando && (
                <button 
                  type="button"
                  onClick={() => { setFase("email"); setClave(""); }}
                  className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-colors"
                >
                  Cambiar Email
                </button>
              )}
            </form>
          )}
        </div>
        
        <p className="text-center text-[10px] font-bold text-slate-400">
          InnovaExport Agile Command Center &copy; 2024
        </p>
      </div>
  );
}
