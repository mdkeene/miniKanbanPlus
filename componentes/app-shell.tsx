"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type Persona, type Sesion, type Usuario } from "@/tipos/tareas";
import { supabase } from "@/lib/supabase";
import { guardarPersona, obtenerPersonas } from "@/lib/personas";
import { obtenerTareas, guardarTarea, tareasEjemplo } from "@/lib/tareas";
import { obtenerProyectos, guardarProyecto, proyectosEjemplo } from "@/lib/proyectos";

type AppShellProps = {
  sesion: Sesion;
  alCerrarSesion: () => void;
  tabActiva: string;
  alCambiarTab: (tab: string) => void;
  children: React.ReactNode;
};

export function AppShell({
  sesion,
  alCerrarSesion,
  tabActiva,
  alCambiarTab,
  children
}: AppShellProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [titulo, setTitulo] = useState("Panel de tareas");
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [estadoRealtime, setEstadoRealtime] = useState<'conectando' | 'conectado' | 'error'>('conectando');
  const [nuevaClave, setNuevaClave] = useState("");
  const [mensajeClave, setMensajeClave] = useState("");
  const [nombreTemp, setNombreTemp] = useState("");
  const [areaTemp, setAreaTemp] = useState("");
  const [colorTemp, setColorTemp] = useState("");
  const [accionConfirmacion, setAccionConfirmacion] = useState<{titulo: string; descripcion: string; onConfirmar: () => Promise<void>} | null>(null);

  const coloresDisponibles = ["#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#6366f1", "#0f172a"];

  async function handleGuardarPerfil() {
    setMensajeClave("Guardando perfil...");
    try {
      // 1. Guardar datos de perfil
      await guardarPersona({
        ...sesion.usuario,
        nombre: nombreTemp,
        area: areaTemp,
        color: colorTemp
      });

      // 2. Guardar clave si se ha escrito algo
      if (nuevaClave.trim()) {
        const personas = await obtenerPersonas();
        const persona = personas.find(p => p.identificador === sesion.usuario.identificador);
        if (persona) {
          await guardarPersona({ ...persona, clave: nuevaClave });
        }
      }

      setMensajeClave("¡Logrado! Perfil actualizado.");
      setTimeout(() => {
        setModalPasswordAbierto(false);
        setMensajeClave("");
      }, 1000);
    } catch (err) {
      setMensajeClave("Error al guardar cambios.");
    }
  }

  // Listener para sincronizar perfil propio en tiempo real (Header/Avatar)
  useEffect(() => {
    if (!sesion.usuario.identificador) return;

    // Monitor global de Realtime (Heartbeat)
    const canalSalud = supabase
      .channel('salud-sistema')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setEstadoRealtime('conectado');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setEstadoRealtime('error');
        }
      });

    const canal = supabase
      .channel(`perfil-${sesion.usuario.identificador}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${sesion.usuario.identificador}` 
        },
        (payload) => {
          // Notificar o actualizar estado local si fuera necesario
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
      supabase.removeChannel(canalSalud);
    };
  }, [sesion.usuario.identificador]);

  function abrirConfiguracion() {
    setNombreTemp(sesion.usuario.nombre);
    setAreaTemp(sesion.usuario.area);
    setColorTemp(sesion.usuario.color || "#0ea5e9");
    setNuevaClave("");
    setModalPasswordAbierto(true);
  }

  function preConfirmarAccion(titulo: string, descripcion: string, onConfirmar: () => Promise<void>) {
    setAccionConfirmacion({ titulo, descripcion, onConfirmar });
  }

  async function handleBorrarEjemplos() {
    const ts = await obtenerTareas();
    const prjs = await obtenerProyectos();
    const ps = await obtenerPersonas();

    const toDeleteTs = ts.filter(t => String(t.identificador).startsWith("TK-1"));
    const toDeletePrjs = prjs.filter(p => String(p.identificador).startsWith("PRJ-1"));
    const toDeletePs = ps.filter(p => String(p.identificador).startsWith("PR-1") && p.identificador !== sesion.usuario.identificador);

    setMensajeClave("Limpiando datos de ejemplo...");
    setAccionConfirmacion(null);
    
    setTimeout(() => window.location.reload(), 1500);
  }

  async function handleBorrarTodo() {
    setAccionConfirmacion(null);
    setMensajeClave("Borrando todo el sistema...");
    setTimeout(() => window.location.reload(), 1500);
  }

  async function handleGenerarEjemplos() {
    setAccionConfirmacion(null);
    setMensajeClave("Aplicando datos de demostración...");
    setTimeout(() => window.location.reload(), 1500);
  }

  const tabs = [
    { id: "kanban", nombre: "Kanban", icono: "📅" },
    { id: "backlog", nombre: "Backlog", icono: "📦" },
    { id: "proyectos", nombre: "Proyectos", icono: "🚀" },
    { id: "usuarios", nombre: "Usuarios", icono: "👥" },
    { id: "dashboard", nombre: "Dashboard", icono: "📊" }
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-slate-900 selection:bg-sky-100 selection:text-sky-900 font-medium">
      {/* Drawer Menú - Hamburger */}
      {menuAbierto && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm" onClick={() => setMenuAbierto(false)} />
          <nav className="relative w-72 h-full bg-white/90 backdrop-blur-2xl border-r border-slate-100 p-6 flex flex-col shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between mb-10">
              <span className="text-xl font-black tracking-tighter text-slate-950">menú navegación</span>
              <button 
                onClick={() => setMenuAbierto(false)} 
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    alCambiarTab(tab.id);
                    setMenuAbierto(false);
                  }}
                  className={`w-full group flex items-center gap-4 rounded-[20px] px-5 py-4 text-base font-black transition-all ${
                    tabActiva === tab.id
                      ? "bg-sky-50 text-sky-600 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <span className="text-2xl transition-transform group-hover:rotate-12">{tab.icono}</span>
                  <span>{tab.nombre}</span>
                  {tabActiva === tab.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500" />}
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMenuAbierto(false);
                    abrirConfiguracion();
                  }}
                  className="w-full flex items-center gap-4 rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-black text-slate-600 hover:bg-slate-100 transition-all"
                >
                  ⚙️ Editar Perfil
                </button>
               <button
                  onClick={alCerrarSesion}
                  className="w-full flex items-center gap-4 rounded-[20px] bg-rose-50 px-5 py-4 text-sm font-black text-rose-600 hover:bg-rose-100 transition-all"
                >
                  🚪 Cerrar Sesión
                </button>
            </div>
          </nav>
        </div>
      )}

      {/* Cabecera Principal - Compacta (70px) */}
      <header className="h-[70px] shrink-0 z-[60] border-b border-slate-100 bg-white shadow-[0_1px_5px_rgba(0,0,0,0.02)]">
        <div className="w-full h-full flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
             {/* Hamburger Button */}
             <button 
                onClick={() => setMenuAbierto(true)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-950 transition-all"
             >
               <div className="flex flex-col gap-1 w-5">
                 <div className="h-0.5 w-full bg-current rounded-full" />
                 <div className="h-0.5 w-2/3 bg-current rounded-full" />
                 <div className="h-0.5 w-full bg-current rounded-full" />
               </div>
             </button>

            <div className="flex items-stretch gap-4 h-full">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img 
                  src="https://www.innovaexport.com/wp-content/uploads/2022/10/logo-ide_compartir_link_web-1.jpg" 
                  alt="InnovaExport Logo" 
                  className="h-10 w-auto rounded-lg shadow-sm"
                />
              </Link>
              <div className="flex flex-col justify-center leading-none">
                {editandoTitulo ? (
                  <input
                    autoFocus
                    className="text-[10px] font-bold text-sky-500 outline-none border-b border-sky-300 bg-transparent py-0 h-4"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    onBlur={() => setEditandoTitulo(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditandoTitulo(false)}
                  />
                ) : (
                  <span 
                    className="text-[10px] font-black text-slate-400 cursor-pointer hover:text-sky-600 transition-colors"
                    onClick={() => setEditandoTitulo(true)}
                  >
                    {titulo} <span className="opacity-40">✎</span>
                  </span>
                )}
              </div>
            </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Global Realtime Pulse */}
              <div className="flex items-center gap-2 mr-1">
                <div 
                  title={estadoRealtime === 'conectado' ? 'Sistema en vivo' : 'Problema de conexión'}
                  className={`w-2.5 h-2.5 rounded-full animate-pulse transition-colors ${
                    estadoRealtime === 'conectado' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                    estadoRealtime === 'conectando' ? 'bg-amber-400' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                  }`} 
                />
              </div>

              <div className="hidden flex-col items-end sm:flex leading-none">
                <span className="text-sm font-black text-slate-950">{sesion.usuario.nombre}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-sky-500 bg-sky-50 px-1.5 py-0.5 rounded-md">{sesion.usuario.rol}</span>
              </div>
               <div 
                className="h-10 w-10 rounded-xl border border-white shadow-sm flex items-center justify-center text-[11px] font-black text-white group cursor-pointer transition-all hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-sky-500/20"
                style={{ backgroundColor: sesion.usuario.color || "#0ea5e9" }}
                onClick={abrirConfiguracion}
              >
                {sesion.usuario.foto ? (
                  <img src={sesion.usuario.foto} alt="" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  sesion.usuario.nombre.substring(0, 1).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </div>

         {/* Modal Gestión de Perfil - Versión Responsiva Ultra-Premium */}
         {modalPasswordAbierto && (
           <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
             <div className="relative my-auto flex w-full max-w-md flex-col overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-2xl animate-in zoom-in-95 duration-200 lg:max-h-[calc(100vh-2rem)]">
               
               {/* Header Premium (Fixed) */}
               <div className="shrink-0 border-b border-slate-50 bg-slate-50/20 p-6 md:p-8">
                <div className="flex items-center gap-4">
                    <div 
                      className="h-16 w-16 rounded-[22px] flex items-center justify-center text-2xl font-black text-white shadow-2xl animate-in zoom-in duration-300"
                      style={{ backgroundColor: colorTemp }}
                    >
                      {sesion.usuario.nombre.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-950 leading-tight">Mi Perfil</h3>
                      <p className="text-[10px] font-black uppercase text-sky-600 mt-0.5 tracking-[0.2em] bg-sky-50 px-2 py-0.5 rounded-md inline-block">Control de Identidad</p>
                    </div>
                 </div>
               </div>

               {/* Scrollable Body (Dynamic Spacing) */}
               <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-7 custom-scrollbar">
                 {/* Datos Básicos */}
                 <div className="space-y-5">
                    <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                      <label className="etiqueta-campo text-[11px] ml-1">Nombre Público</label>
                      <input 
                        type="text"
                        value={nombreTemp}
                        onChange={e => setNombreTemp(e.target.value)}
                        className="campo-formulario"
                        placeholder="Tu nombre real"
                      />
                    </div>
                    <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                      <label className="etiqueta-campo text-[11px] ml-1">Área o Departamento</label>
                      <input 
                        type="text"
                        value={areaTemp}
                        onChange={e => setAreaTemp(e.target.value)}
                        className="campo-formulario"
                        placeholder="Ej: Marketing, Sistemas..."
                      />
                    </div>
                    <div className="space-y-1.5 opacity-60">
                      <label className="etiqueta-campo text-[11px] ml-1">Email Vinculado</label>
                      <div className="px-5 py-3.5 text-sm font-bold text-slate-400 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center justify-between">
                        <span>{sesion.usuario.email}</span>
                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">Protegido</span>
                      </div>
                    </div>
                 </div>

                 {/* Selección de Color */}
                 <div className="space-y-3">
                    <label className="etiqueta-campo text-[11px] ml-1">Gama de Color Personalizada</label>
                    <div className="grid grid-cols-6 gap-3">
                      {coloresDisponibles.map(color => (
                        <button
                          key={color}
                          onClick={() => setColorTemp(color)}
                          className={`h-10 w-full rounded-xl border-4 transition-all duration-300 ${color === colorTemp ? "border-slate-300 scale-105 shadow-inner" : "border-transparent opacity-50 hover:opacity-100 hover:scale-105"}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                 </div>

                 {/* Seguridad */}
                 <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="space-y-1.5">
                      <label className="etiqueta-campo text-rose-500 text-[11px] ml-1 font-black">Actualizar Contraseña</label>
                      <input 
                        type="password"
                        value={nuevaClave}
                        onChange={e => setNuevaClave(e.target.value)}
                        className="campo-formulario border-rose-100 bg-rose-50/5 focus:ring-rose-500/20"
                        placeholder="Dejar en blanco para mantener actual"
                        onKeyDown={(e) => e.key === "Enter" && handleGuardarPerfil()}
                      />
                    </div>
                 </div>

                 {/* Acciones Administrativas (Only for Admins) */}
                 {sesion.usuario.rol === "admin" && (
                    <div className="mt-8 border-t border-slate-100 pt-6 space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center mb-2">Herramientas de Mantenimiento</p>
                        <div className="grid grid-cols-1 gap-2">
                             <button 
                               onClick={() => { setModalPasswordAbierto(false); preConfirmarAccion("Demostración", "Generar datos de ejemplo...", handleGenerarEjemplos); }} 
                               className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-50 py-3 text-xs font-black text-sky-600 hover:bg-sky-100 transition-all"
                             >
                               ✨ Generar Ejemplos
                             </button>
                             <button 
                               onClick={() => { setModalPasswordAbierto(false); preConfirmarAccion("Limpieza", "Borrar datos de ejemplo...", handleBorrarEjemplos); }} 
                               className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-3 text-xs font-black text-amber-600 hover:bg-amber-100 transition-all"
                             >
                               🗑️ Borrar Ejemplos
                             </button>
                             <button 
                               onClick={() => { setModalPasswordAbierto(false); preConfirmarAccion("⚠️ RESET", "¡Borrar TODO el sistema!", handleBorrarTodo); }} 
                               className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-50 py-3 text-xs font-black text-rose-600 hover:bg-rose-100 transition-all"
                             >
                               🔥 Reset Total del Sistema
                             </button>
                        </div>
                    </div>
                 )}
               </div>

               {/* Footer Premium (Fixed) */}
               <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 p-6 md:p-8 backdrop-blur-md">
                 {mensajeClave ? (
                   <div className="rounded-2xl bg-slate-950 px-6 py-4 text-center text-white font-black text-sm animate-pulse flex items-center justify-center gap-3">
                     <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                     {mensajeClave}
                   </div>
                 ) : (
                   <div className="flex flex-col gap-3 sm:flex-row shadow-sm">
                     <button onClick={() => setModalPasswordAbierto(false)} className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all">Cancelar</button>
                     <button onClick={handleGuardarPerfil} className="flex-[2] rounded-2xl bg-slate-950 py-4 text-sm font-black text-white shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:translate-y-0">Guardar Perfil</button>
                   </div>
                 )}
               </div>
             </div>
           </div>
         )}

        {/* Modal Confirmación */}
        {accionConfirmacion && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xs rounded-3xl border border-white bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-black text-slate-900">{accionConfirmacion.titulo}</h3>
                <p className="text-sm font-medium text-slate-500">{accionConfirmacion.descripcion}</p>
                <div className="flex flex-col gap-2">
                  <button onClick={accionConfirmacion.onConfirmar} className="w-full rounded-2xl bg-slate-950 py-3 text-sm font-black text-white hover:bg-slate-800 transition-colors">Confirmar</button>
                  <button onClick={() => setAccionConfirmacion(null)} className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-black text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-auto bg-white">
        {children}
      </main>
    </div>
  );
}
