import { type SemanaInfo } from "@/tipos/tareas";

export function obtenerSemanaId(fecha: Date = new Date()): string {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

export function obtenerInfoSemana(semanaId: string): SemanaInfo {
  const [añoStr, semanaStr] = semanaId.split("-W");
  const año = parseInt(añoStr);
  const semana = parseInt(semanaStr);

  // Encontrar el primer día de la semana (Lunes)
  const primeroDeEnero = new Date(año, 0, 1);
  const diasSobrantes = primeroDeEnero.getDay() || 7;
  const primerLunes = new Date(año, 0, 1 + (diasSobrantes <= 4 ? 1 - diasSobrantes : 8 - diasSobrantes));
  
  const inicio = new Date(primerLunes);
  inicio.setDate(primerLunes.getDate() + (semana - 1) * 7);
  
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);

  return {
    id: semanaId,
    numero: semana,
    año: año,
    inicio: inicio.toISOString(),
    fin: fin.toISOString()
  };
}

export function obtenerSemanaRelativa(semanaId: string, delta: number): string {
  const info = obtenerInfoSemana(semanaId);
  const fechaReferencia = new Date(info.inicio);
  fechaReferencia.setDate(fechaReferencia.getDate() + delta * 7 + 2); // +2 para estar seguros en medio de la semana
  return obtenerSemanaId(fechaReferencia);
}

export function formatearRangoSemana(inicio: string, fin: string): string {
  const opciones: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const dInicio = new Date(inicio);
  const dFin = new Date(fin);
  return `${dInicio.toLocaleDateString("es-ES", opciones)} - ${dFin.toLocaleDateString("es-ES", opciones)}`;
}
export function obtenerSemanaActual(): SemanaInfo {
  return obtenerInfoSemana(obtenerSemanaId());
}

export function calcularRangoSemana(semanaId: string): string {
  const info = obtenerInfoSemana(semanaId);
  return formatearRangoSemana(info.inicio, info.fin);
}
