// ===========================================================================
// Aplicar filtros — filtrado y orden puros
// ===========================================================================
// Sin efectos secundarios: recibe productos + filtros, devuelve productos.
// Así se puede testear sin DOM y sin red.

import { normalizarTexto, porcentajeDescuento } from "../utils/formato.js";

export function aplicarFiltros(productos, filtros) {
  let resultado = productos;

  // Universales (compatibilidad: []) entran siempre. Regla del brief §4.
  if (filtros.modelo) {
    resultado = resultado.filter(
      (p) => p.esUniversal || p.compatibilidad.includes(filtros.modelo)
    );
  }

  if (filtros.categoria) {
    resultado = resultado.filter((p) => p.categoria === filtros.categoria);
  }

  if (filtros.marca) {
    resultado = resultado.filter((p) => p.marca === filtros.marca);
  }

  if (filtros.precioMin != null) {
    resultado = resultado.filter((p) => p.precio >= filtros.precioMin);
  }

  if (filtros.precioMax != null) {
    resultado = resultado.filter((p) => p.precio <= filtros.precioMax);
  }

  if (filtros.q) {
    const q = normalizarTexto(filtros.q);
    resultado = resultado.filter((p) => p._busqueda.includes(q));
  }

  return ordenar(resultado, filtros.orden);
}

function ordenar(productos, orden) {
  const copia = [...productos];

  switch (orden) {
    case "precio-asc":
      return copia.sort((a, b) => a.precio - b.precio);

    case "precio-desc":
      return copia.sort((a, b) => b.precio - a.precio);

    case "descuento":
      return copia.sort(
        (a, b) =>
          porcentajeDescuento(b.precio, b.precioAnterior) -
          porcentajeDescuento(a.precio, a.precioAnterior)
      );

    case "nuevo":
      return copia.sort((a, b) => Number(b.nuevo) - Number(a.nuevo));

    // "relevancia": sin stock al final, destacados primero. Array.sort es
    // estable desde ES2019: dentro de cada grupo se respeta el orden del JSON.
    default:
      return copia.sort((a, b) => {
        if (a.hayStock !== b.hayStock) return a.hayStock ? -1 : 1;
        if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
        return 0;
      });
  }
}
