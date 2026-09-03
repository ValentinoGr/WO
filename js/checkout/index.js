// ===========================================================================
// Checkout — capa de abstracción
// ===========================================================================
// El resto del sitio nunca sabe cómo se paga. Llama a finalizarCompra() y
// listo. Cambiar de WhatsApp a Mercado Pago es cambiar un flag en config.js.
//
// Regla: ningún módulo fuera de esta carpeta importa whatsapp.js ni
// mercadopago.js directamente.

import { CONFIG } from "../config.js";
import { checkoutWhatsapp } from "./whatsapp.js";
import { checkoutMercadoPago } from "./mercadopago.js";
import * as carrito from "../carrito/estado.js";

const IMPLEMENTACIONES = {
  whatsapp: checkoutWhatsapp,
  mercadopago: checkoutMercadoPago,
};

/**
 * Finaliza la compra con el método configurado.
 *
 * Antes de delegar, revalida el carrito contra el catálogo: si un precio
 * cambió o un producto se quedó sin stock mientras el carrito dormía en
 * localStorage, se corrige y se avisa en vez de mandar un pedido inválido.
 *
 * @param {object} [datosCliente]  nombre, localidad, entrega, notas
 * @returns {Promise<{ok: boolean, metodo: string, cambios?: Array, url?: string, motivo?: string}>}
 */
export async function finalizarCompra(datosCliente = {}) {
  const impl = IMPLEMENTACIONES[CONFIG.metodoCheckout];

  if (!impl) {
    throw new Error(`Método de checkout no soportado: ${CONFIG.metodoCheckout}`);
  }

  if (carrito.estaVacio()) {
    return { ok: false, metodo: CONFIG.metodoCheckout, motivo: "El carrito está vacío." };
  }

  // Revalidación contra el catálogo actual.
  const { cambios } = await carrito.sincronizar();

  if (carrito.estaVacio()) {
    return {
      ok: false,
      metodo: CONFIG.metodoCheckout,
      cambios,
      motivo: "Los productos del carrito ya no están disponibles.",
    };
  }

  // Si algo cambió, se frena y se le muestra al cliente qué pasó. Confirmar
  // un total distinto al que tenía en pantalla sería una mala sorpresa.
  if (cambios.length) {
    return {
      ok: false,
      metodo: CONFIG.metodoCheckout,
      cambios,
      requiereConfirmacion: true,
      motivo: "Algunos productos cambiaron. Revisá el pedido antes de confirmar.",
    };
  }

  const resultado = await impl(
    { items: carrito.obtenerItems(), totales: carrito.totales() },
    datosCliente
  );

  return { ...resultado, cambios };
}

/** Para que la UI etiquete el botón sin conocer la implementación. */
export function metodoActual() {
  return CONFIG.metodoCheckout;
}

export function textoBotonCheckout() {
  return CONFIG.metodoCheckout === "whatsapp"
    ? "Finalizar pedido por WhatsApp"
    : "Ir a pagar";
}
