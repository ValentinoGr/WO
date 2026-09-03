// ===========================================================================
// Persistencia del carrito — localStorage con versionado de schema
// ===========================================================================
// El versionado importa: si mañana cambia la forma del item del carrito, los
// clientes que tengan un carrito viejo guardado romperían la página al volver.
// Con la versión, un carrito de schema viejo se descarta en silencio.

import { CONFIG } from "../config.js";

const { claveCarrito, version } = CONFIG.storage;

/**
 * localStorage puede tirar excepción: modo privado de Safari, cuota llena,
 * cookies bloqueadas. Nunca puede tumbar el sitio, así que se detecta una vez.
 */
const disponible = (() => {
  try {
    const prueba = "__wo_test__";
    window.localStorage.setItem(prueba, "1");
    window.localStorage.removeItem(prueba);
    return true;
  } catch {
    return false;
  }
})();

export function storageDisponible() {
  return disponible;
}

/**
 * Lee el carrito guardado.
 * @returns {Array} items, o [] si no hay nada / el schema es viejo / está corrupto
 */
export function leerCarrito() {
  if (!disponible) return [];

  let crudo;
  try {
    crudo = window.localStorage.getItem(claveCarrito);
  } catch {
    return [];
  }
  if (!crudo) return [];

  let guardado;
  try {
    guardado = JSON.parse(crudo);
  } catch {
    // JSON corrupto: se limpia para no volver a fallar en cada carga.
    borrarCarrito();
    return [];
  }

  // Schema viejo (o sin versión, de antes de que existiera): se descarta.
  if (!guardado || guardado.version !== version || !Array.isArray(guardado.items)) {
    borrarCarrito();
    return [];
  }

  return guardado.items;
}

/**
 * Guarda el carrito. Devuelve false si no se pudo (cuota llena, modo privado)
 * para que la UI pueda avisar en vez de fingir que guardó.
 */
export function guardarCarrito(items) {
  if (!disponible) return false;

  try {
    window.localStorage.setItem(
      claveCarrito,
      JSON.stringify({
        version,
        actualizado: new Date().toISOString(),
        items,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function borrarCarrito() {
  if (!disponible) return;
  try {
    window.localStorage.removeItem(claveCarrito);
  } catch {
    /* sin recuperación posible, y tampoco hace falta */
  }
}

// --- Modelo de iPhone elegido ----------------------------------------------
// Se recuerda entre visitas: es el filtro principal del sitio y volver a
// elegirlo en cada entrada sería molesto.

export function leerModeloElegido() {
  if (!disponible) return null;
  try {
    const modelo = window.localStorage.getItem(CONFIG.storage.claveModelo);
    // Se valida contra la lista actual: si el cliente saca un modelo de
    // config.js, el guardado deja de ser válido.
    return CONFIG.modelosIphone.includes(modelo) ? modelo : null;
  } catch {
    return null;
  }
}

export function guardarModeloElegido(modelo) {
  if (!disponible) return false;
  try {
    if (modelo) {
      window.localStorage.setItem(CONFIG.storage.claveModelo, modelo);
    } else {
      window.localStorage.removeItem(CONFIG.storage.claveModelo);
    }
    return true;
  } catch {
    return false;
  }
}
