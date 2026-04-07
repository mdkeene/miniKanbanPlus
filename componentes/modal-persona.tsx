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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[30px] border border-white/70 bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
              Equipo
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Añadir nueva persona
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[1fr_160px]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Nombre</span>
              <input
                value={formulario.nombre}
                onChange={(evento) => actualizarCampo("nombre", evento.target.value)}
                className="campo-formulario"
                maxLength={limitesSeguridad.nombreMaximo}
                placeholder="Ejemplo: Lucía"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Área</span>
              <input
                value={formulario.area}
                onChange={(evento) => actualizarCampo("area", evento.target.value)}
                className="campo-formulario"
                maxLength={limitesSeguridad.areaMaxima}
                placeholder="Ejemplo: Marketing"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 font-bold text-indigo-600">Email Corporativo (Para vincular login)</span>
              <input
                type="email"
                value={formulario.email}
                onChange={(evento) => actualizarCampo("email", evento.target.value)}
                className="campo-formulario border-indigo-100 bg-indigo-50/10 placeholder:text-indigo-300"
                placeholder="ejemplo@innovaexport.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Foto o URL de avatar
              </span>
              <input
                value={formulario.foto}
                onChange={(evento) => actualizarCampo("foto", evento.target.value)}
                className="campo-formulario"
                maxLength={2048}
                placeholder="https://... o dejar vacío para avatar automático"
              />
            </label>
          </div>

          <div className="rounded-[28px] border border-indigo-100 bg-indigo-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              Vista previa
            </p>
            <div className="mt-4 flex flex-col items-center text-center">
              <AvatarPersona
                nombre={formulario.nombre || "Persona"}
                foto={vistaPrevia}
                tamano="grande"
              />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {formulario.nombre || "Nueva persona"}
              </p>
              <p className="text-sm text-slate-500">
                {formulario.area || "Área pendiente"}
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Crear persona
          </button>
        </div>
      </div>
    </div>
  );
}
