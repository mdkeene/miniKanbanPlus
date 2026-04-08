"use client";

import { useMemo, useState } from "react";
import { AvatarPersona } from "@/componentes/avatar-persona";
import { crearBorradorPersona, crearFotoAvatar } from "@/lib/personas";
import { limpiarTextoPlano, limitesSeguridad, normalizarUrlImagen } from "@/lib/seguridad";
import type { BorradorPersona } from "@/tipos/tareas";

type PropiedadesModalPersona = {
  onCerrar: () => void;
  onGuardar: (borrador: BorradorPersona) => void;
};

export function ModalPersona({ onCerrar, onGuardar }: PropiedadesModalPersona) {
  const [formulario, setFormulario] = useState<BorradorPersona>(crearBorradorPersona());
  const [error, setError] = useState("");

  const vistaPrevia = useMemo(
    () => formulario.foto.trim() || crearFotoAvatar(formulario.nombre || "Persona", 4),
    [formulario.foto, formulario.nombre]
  );

  function actualizarCampo<Clave extends keyof BorradorPersona>(
    clave: Clave,
    valor: BorradorPersona[Clave]
  ) {
    setFormulario((valorActual) => ({ ...valorActual, [clave]: valor }));
  }

  function guardar() {
    const nombre = limpiarTextoPlano(formulario.nombre, limitesSeguridad.nombreMaximo);
    const area = limpiarTextoPlano(formulario.area, limitesSeguridad.areaMaxima);
    const foto = formulario.foto.trim();

    if (!nombre) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!area) {
      setError("El área es obligatoria.");
      return;
    }

    if (foto && !normalizarUrlImagen(foto)) {
      setError("La foto debe ser una URL https segura o dejarse vacía.");
      return;
    }

    onGuardar({
      nombre,
      email: formulario.email.trim(),
      area,
      foto
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-auto w-full max-w-2xl rounded-[32px] border border-white/80 bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[calc(100vh-3rem)]">
        {/* Header - Anclado */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4 sm:p-8 sm:pb-5 border-b border-slate-50">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600">
              Gestión de Equipo
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Configurar Perfil
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="group rounded-2xl border border-slate-200 p-2 text-slate-400 transition hover:border-slate-300 hover:text-slate-950"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo - Scrolleable si es necesario */}
        <div className="overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <div className="grid gap-8 md:grid-cols-[1fr_200px]">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</span>
                  <input
                    value={formulario.nombre}
                    onChange={(evento) => actualizarCampo("nombre", evento.target.value)}
                    className="block w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-slate-950 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white"
                    maxLength={limitesSeguridad.nombreMaximo}
                    placeholder="Ejemplo: Marc Canales"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Área / Departamento</span>
                  <input
                    value={formulario.area}
                    onChange={(evento) => actualizarCampo("area", evento.target.value)}
                    className="block w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-slate-950 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white"
                    maxLength={limitesSeguridad.areaMaxima}
                    placeholder="Ejemplo: Dirección Estratégica"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-indigo-600 ml-1">Email (Vínculo de Sistema)</span>
                  <input
                    type="email"
                    value={formulario.email}
                    onChange={(evento) => actualizarCampo("email", evento.target.value)}
                    className="block w-full rounded-2xl border-2 border-indigo-100 bg-indigo-50/10 px-4 py-3.5 text-slate-950 placeholder-indigo-300 outline-none transition focus:border-indigo-500 focus:bg-white"
                    placeholder="ejemplo@innovaexport.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    URL de Fotografía
                  </span>
                  <input
                    value={formulario.foto}
                    onChange={(evento) => actualizarCampo("foto", evento.target.value)}
                    className="block w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-slate-950 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white"
                    maxLength={2048}
                    placeholder="https://... o dejar vacío"
                  />
                </label>
              </div>
            </div>

            {/* Vista Previa Premium */}
            <div className="flex flex-col items-center">
              <div className="sticky top-0 w-full rounded-[32px] border border-indigo-50 bg-indigo-50/30 p-6 text-center">
                <p className="mb-4 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  Vista Previa
                </p>
                <div className="relative">
                  <AvatarPersona
                    nombre={formulario.nombre || "Nuevo"}
                    foto={vistaPrevia}
                    tamano="grande"
                  />
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg border-4 border-white">
                    ✨
                  </div>
                </div>
                <h4 className="mt-5 text-lg font-black text-slate-900 leading-tight">
                  {formulario.nombre || "Sin Nombre"}
                </h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">
                  {formulario.area || "Área no definida"}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 border border-rose-100 animate-in fade-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer - Anclado */}
        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 sm:pt-5 border-t border-slate-50 bg-slate-50/50 rounded-b-[32px]">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            className="rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-black text-white shadow-xl shadow-indigo-200 transition hover:bg-indigo-500 active:scale-95"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
