"use client";

import { useState, useEffect, useRef } from "react";
import { type Persona, type RolUsuario } from "@/tipos/tareas";
import { obtenerPersonas, guardarPersona, eliminarPersona } from "@/lib/personas";
import { AvatarPersona } from "@/componentes/avatar-persona";

export function TabUsuarios() {
  const [usuarios, setUsuarios] = useState<Persona[]>([]);
  const [editandoUsuario, setEditandoUsuario] = useState<Persona | null>(null);
  const [emailInvitado, setEmailInvitado] = useState("");
  const [invitando, setInvitando] = useState(false);
  
  const [nombre, setNombre] = useState("");
  const [area, setArea] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<RolUsuario>("usuario");
  const [color, setColor] = useState("#0ea5e9");
  const [foto, setFoto] = useState("");
  const [clave, setClave] = useState("");

  useEffect(() => {
    async function cargar() {
      const ps = await obtenerPersonas();
      setUsuarios(ps);
    }
    cargar();
  }, []);

  async function handleInvitacionRapida(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInvitado.trim() || !emailInvitado.includes("@")) return;

    setInvitando(true);
    try {
      const persona: Persona = {
        identificador: crypto.randomUUID(),
        nombre: emailInvitado.split("@")[0].charAt(0).toUpperCase() + emailInvitado.split("@")[0].slice(1),
        area: "Invitado",
        email: emailInvitado.trim(),
        rol: "usuario",
        color: "#94a3b8",
        foto: "",
        clave: "PENDIENTE"
      };

      await guardarPersona(persona);
      const ps = await obtenerPersonas();
      setUsuarios(ps);
      setEmailInvitado("");
    } finally {
      setInvitando(false);
    }
  }

  async function handleGuardar() {
    if (!nombre.trim() || !area.trim()) return;

    const persona: Persona = {
      identificador: editandoUsuario?.identificador || crypto.randomUUID(),
      nombre,
      area,
      email,
      rol,
      color,
      foto,
      clave: clave || "1234"
    };

    await guardarPersona(persona);
    const ps = await obtenerPersonas();
    setUsuarios(ps);
    cancelarBorrador();
  }

  async function handleEliminar(id: string) {
    if (id === "PR-ADMIN") {
      alert("No se puede eliminar al administrador principal.");
      return;
    }
    if (!confirm("¿Eliminar este usuario?")) return;
    
    const resultado = await eliminarPersona(id);
    
    if (!resultado.success) {
      alert("🚨 BLOQUEO DE SEGURIDAD: " + resultado.error);
      return;
    }

    const ps = await obtenerPersonas();
    setUsuarios(ps);
  }

  function cancelarBorrador() {
    setEditandoUsuario(null);
    setNombre("");
    setArea("");
    setEmail("");
    setRol("usuario");
    setColor("#0ea5e9");
    setFoto("");
    setClave("");
  }

  function iniciarEdicion(p: Persona) {
    setEditandoUsuario(p);
    setNombre(p.nombre);
    setArea(p.area);
    setEmail(p.email || "");
    setRol(p.rol || "usuario");
    setColor(p.color || "#0ea5e9");
    setFoto(p.foto || "");
    setClave(p.clave || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function simularSubida() {
    const randomId = Math.floor(Math.random() * 1000);
    setFoto(`https://picsum.photos/seed/${randomId}/200/200`);
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
      {/* Sección de Invitación Rápida */}
      <section className="rounded-[24px] bg-slate-950 p-6 shadow-sm text-white overflow-hidden relative group border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl transition-transform group-hover:scale-110" />
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-black tracking-tight">Crecimiento Instantáneo ⚡</h3>
            <p className="text-sm font-medium text-slate-400">Invita a nuevos miembros solo con su email. Ellos harán el resto.</p>
          </div>
          
          <form onSubmit={handleInvitacionRapida} className="flex-1 w-full flex items-center gap-2">
            <input 
              type="email"
              value={emailInvitado}
              onChange={e => setEmailInvitado(e.target.value)}
              placeholder="compañero@innovaexport.com"
              className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold placeholder-white/20 outline-none focus:bg-white/20 focus:border-white/30 transition-all"
            />
            <button 
              disabled={invitando || !emailInvitado.includes("@")}
              className="px-6 py-3 rounded-2xl bg-sky-500 text-white font-black text-sm shadow-xl shadow-sky-500/20 hover:bg-sky-400 transition-all hover:-translate-y-0.5 disabled:opacity-30 active:scale-95"
            >
              {invitando ? "..." : "Invitar →"}
            </button>
          </form>
        </div>
      </section>

      {/* Formulario de Usuario (Compacto & Accesible) */}
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm xl:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {editandoUsuario ? "Editar Perfil" : "Panel de Miembros"}
            </h2>
            <p className="text-sm font-medium text-slate-500">Ajusta detalles o gestiona credenciales específicas.</p>
          </div>
          {editandoUsuario && (
            <button onClick={cancelarBorrador} className="text-sm font-bold text-sky-600 hover:text-sky-700">
              Descartar cambios
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Avatar Preview */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-4 rounded-[20px] bg-slate-50 border border-slate-100">
            <AvatarPersona nombre={nombre || "Nuevo"} foto={foto} tamano="media" />
            <button 
              onClick={simularSubida}
              className="mt-3 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              📷 FOTO
            </button>
          </div>

          <div className="lg:col-span-10 grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</label>
              <input 
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Marc Canales"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-900 outline-none focus:border-sky-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Área / Cargo</label>
              <input 
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="Director"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-900 outline-none focus:border-sky-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
              <input 
                type="text"
                value={clave}
                onChange={e => setClave(e.target.value)}
                placeholder="****"
                className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-base font-bold text-slate-900 outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-sky-600 ml-1">Email (Login)</label>
              <input 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@innovaexport.com"
                className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-base font-semibold text-sky-900 outline-none focus:border-sky-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nivel</label>
              <select 
                value={rol}
                onChange={e => setRol(e.target.value as RolUsuario)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-900 outline-none"
              >
                <option value="usuario">Colaborador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Color</label>
              <div className="flex gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-10 rounded-lg border-none p-1 cursor-pointer bg-slate-100" />
                <input value={color} onChange={e => setColor(e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono outline-none" />
              </div>
            </div>
            <div className="flex items-end pb-0.5">
              <button 
                onClick={handleGuardar}
                disabled={!nombre.trim() || !area.trim()}
                className="w-full rounded-xl bg-sky-600 py-2.5 text-base font-black text-white shadow-xl shadow-sky-100 disabled:opacity-30 hover:bg-sky-500 transition-all active:scale-95"
              >
                {editandoUsuario ? "Actualizar" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabla Compacta Professional */}
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Miembro</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Dpto.</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Acceso</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Clave</th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.2em] text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usuarios.map((u) => (
                <tr key={u.identificador} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <AvatarPersona nombre={u.nombre} foto={u.foto} tamano="pequeno" />
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-900 leading-tight">{u.nombre}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-lg font-bold text-slate-600">{u.area}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      u.rol === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {u.rol || "usuario"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm font-mono text-slate-400">••••••</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => iniciarEdicion(u)}
                        className="rounded-lg bg-white border border-slate-200 p-1.5 text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all shadow-sm"
                        title="Editar credenciales"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleEliminar(u.identificador)}
                        className="rounded-lg bg-white border border-slate-200 p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
                        title="Eliminar usuario"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
