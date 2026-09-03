// ===========================================================================
// Formato — precios, cuotas, descuentos
// ===========================================================================

import { CONFIG } from "../config.js";

// Los formatters de Intl son caros de construir: se instancian una sola vez.
const fmtMoneda = new Intl.NumberFormat(CONFIG.locale, {
  style: "currency",
  currency: CONFIG.moneda,
  maximumFractionDigits: 0,
});

const fmtMonedaDecimales = new Intl.NumberFormat(CONFIG.locale, {
  style: "currency",
  currency: CONFIG.moneda,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatea un precio entero en pesos. 18500 → "$ 18.500"
 * Intl devuelve "$ 18.500" con NBSP; lo dejamos así, es lo correcto
 * tipográficamente y evita que el símbolo quede huérfano en un salto de línea.
 */
export function precio(valor) {
  if (!Number.isFinite(valor)) return fmtMoneda.format(0);
  return fmtMoneda.format(valor);
}

/** Para montos de cuota, donde los centavos importan. 6166.67 → "$ 6.166,67" */
export function precioConDecimales(valor) {
  if (!Number.isFinite(valor)) return fmtMonedaDecimales.format(0);
  return fmtMonedaDecimales.format(valor);
}

/**
 * Porcentaje de descuento, redondeado hacia abajo.
 * Hacia abajo y no al más cercano: prometer "25% OFF" cuando el descuento
 * real es 24.6% es publicidad engañosa. Mejor mostrar 24.
 */
export function porcentajeDescuento(precioActual, precioAnterior) {
  if (!precioAnterior || precioAnterior <= precioActual) return 0;
  return Math.floor(((precioAnterior - precioActual) / precioAnterior) * 100);
}

export function tieneDescuento(producto) {
  return porcentajeDescuento(producto.precio, producto.precioAnterior) > 0;
}

/**
 * Cuota sin interés más conveniente para mostrar debajo del precio.
 * Devuelve la de mayor cantidad de cuotas: "6 cuotas sin interés de $ 3.083,33"
 * vende mejor que "3 cuotas de $ 6.166,67".
 * @returns {{cantidad: number, monto: number, texto: string} | null}
 */
export function cuotas(monto) {
  const planes = CONFIG.cuotasSinInteres;
  if (!Array.isArray(planes) || planes.length === 0 || !monto) return null;

  const cantidad = Math.max(...planes);
  const valorCuota = monto / cantidad;

  return {
    cantidad,
    monto: valorCuota,
    texto: `${cantidad} cuotas sin interés de ${precioConDecimales(valorCuota)}`,
  };
}

/** Todos los planes disponibles, para la página de producto. */
export function todosLosPlanesDeCuotas(monto) {
  if (!monto) return [];
  return [...CONFIG.cuotasSinInteres]
    .sort((a, b) => a - b)
    .map((cantidad) => ({
      cantidad,
      monto: monto / cantidad,
      texto: `${cantidad} cuotas sin interés de ${precioConDecimales(monto / cantidad)}`,
    }));
}

/**
 * Estado del envío gratis, para la barra de progreso del carrito.
 * @returns {{alcanzado: boolean, faltan: number, progreso: number, texto: string}}
 */
export function estadoEnvioGratis(subtotal) {
  const umbral = CONFIG.envioGratisDesde;
  const alcanzado = subtotal >= umbral;
  const faltan = Math.max(0, umbral - subtotal);

  return {
    alcanzado,
    faltan,
    progreso: umbral > 0 ? Math.min(1, subtotal / umbral) : 1,
    texto: alcanzado
      ? "¡Tenés envío gratis!"
      : `Te faltan ${precio(faltan)} para el envío gratis`,
  };
}

/** Pluralización simple. (1, "producto") → "1 producto" · (3, …) → "3 productos" */
export function pluralizar(cantidad, singular, plural = `${singular}s`) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/** Texto de compatibilidad legible. [] → "Compatible con todos los modelos" */
export function textoCompatibilidad(compatibilidad) {
  if (!Array.isArray(compatibilidad) || compatibilidad.length === 0) {
    return "Compatible con todos los modelos";
  }
  if (compatibilidad.length === 1) return `Para ${compatibilidad[0]}`;

  const ultimo = compatibilidad[compatibilidad.length - 1];
  const resto = compatibilidad.slice(0, -1);
  return `Para ${resto.join(", ")} y ${ultimo}`;
}

/** Normaliza texto para búsqueda: minúsculas y sin tildes. */
export function normalizarTexto(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // marcas diacriticas combinantes
    .trim();
}
