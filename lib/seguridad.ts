const patronControlInseguro = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const patronControlPlano = /[\u0000-\u001F\u007F]/g;
const patronDataImagenSegura =
  /^data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml)(?:;charset=[^,;]+)?(?:;base64)?,/i;
const longitudMaximaUrl = 2048;

export const limitesSeguridad = {
  personasMaximas: 50,
  tareasMaximas: 500,
  nombreMaximo: 80,
  areaMaxima: 80,
  tituloMaximo: 140,
  observacionesMaximas: 2000,
  lineasCargaRapidaMaximas: 100
};

export function limpiarTextoPlano(valor: unknown, maximo: number) {
  if (typeof valor !== "string") {
    return "";
  }

  return valor
    .replace(patronControlPlano, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximo);
}

export function limpiarTextoMultilinea(valor: unknown, maximo: number) {
  if (typeof valor !== "string") {
    return "";
  }

  return valor
    .replace(/\r\n/g, "\n")
    .replace(patronControlInseguro, "")
    .trim()
    .slice(0, maximo);
}

export function normalizarEnteroSeguro(valor: unknown, porDefecto = 0) {
  return Number.isInteger(valor) && typeof valor === "number" && valor >= 0
    ? valor
    : porDefecto;
}

export function normalizarUrlNavegable(valor: unknown) {
  if (typeof valor !== "string") {
    return "";
  }

  const candidato = valor.trim();

  if (!candidato) {
    return "";
  }

  if (candidato.length > longitudMaximaUrl) {
    return "";
  }

  if (candidato.startsWith("/")) {
    return candidato;
  }

  try {
    const url = new URL(candidato);

    if (url.protocol !== "https:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

export function normalizarUrlImagen(valor: unknown) {
  if (typeof valor !== "string") {
    return "";
  }

  const candidato = valor.trim();

  if (!candidato) {
    return "";
  }

  if (candidato.length > longitudMaximaUrl) {
    return "";
  }

  if (patronDataImagenSegura.test(candidato)) {
    return candidato;
  }

  if (candidato.startsWith("/")) {
    return candidato;
  }

  try {
    const url = new URL(candidato);

    if (url.protocol !== "https:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

export function limitarColeccion<T>(elementos: T[], maximo: number) {
  return elementos.slice(0, maximo);
}
