// ===========================================================================
// Estado de filtros — sincronizado con la URL
// ===========================================================================
// Los filtros viven en el querystring, no en una variable de módulo aislada:
// así el botón "atrás" del navegador funciona y los links de tienda.html son
// compartibles con los filtros aplicados.

import { leerParametros, escribirParametros } from "../utils/dom.js";

export const ORDEN_POR_DEFECTO = "relevancia";

/** Filtros vacíos. Punto de partida y valor de "Limpiar filtros". */
export function filtrosVacios() {
  return {
    modelo: "",
    categoria: "",
    marca: "",
    precioMin: null,
    precioMax: null,
    q: "",
    orden: ORDEN_POR_DEFECTO,
  };
}

/** Lee el estado actual de filtros desde la URL. */
export function leerFiltros() {
  const p = leerParametros();
  const min = Number(p.precioMin);
  const max = Number(p.precioMax);

  return {
    modelo: p.modelo ?? "",
    categoria: p.categoria ?? "",
    marca: p.marca ?? "",
    precioMin: p.precioMin && Number.isFinite(min) ? min : null,
    precioMax: p.precioMax && Number.isFinite(max) ? max : null,
    q: p.q ?? "",
    orden: p.orden || ORDEN_POR_DEFECTO,
  };
}

/**
 * Escribe los filtros en la URL sin recargar.
 * El orden por defecto no se escribe: mantiene la URL limpia cuando no hay
 * nada especial elegido.
 */
export function guardarFiltros(filtros, opciones = {}) {
  escribirParametros(
    {
      modelo: filtros.modelo,
      categoria: filtros.categoria,
      marca: filtros.marca,
      precioMin: filtros.precioMin,
      precioMax: filtros.precioMax,
      q: filtros.q,
      orden: filtros.orden === ORDEN_POR_DEFECTO ? "" : filtros.orden,
    },
    opciones
  );
}

export function hayFiltrosActivos(filtros) {
  return Boolean(
    filtros.modelo ||
      filtros.categoria ||
      filtros.marca ||
      filtros.precioMin != null ||
      filtros.precioMax != null ||
      filtros.q
  );
}

/** Reacciona al botón atrás/adelante del navegador. Devuelve función de limpieza. */
export function alCambiarHistorial(callback) {
  const manejador = () => callback(leerFiltros());
  window.addEventListener("popstate", manejador);
  return () => window.removeEventListener("popstate", manejador);
}
