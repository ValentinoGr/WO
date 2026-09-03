// ===========================================================================
// Checkout con Mercado Pago — STUB de Fase 2
// ===========================================================================
// NO IMPLEMENTAR TODAVÍA. Este archivo existe para fijar el contrato.
//
// Su firma es idéntica a la de checkoutWhatsapp. Cuando llegue la Fase 2,
// lo único que hay que hacer es:
//
//   1. Completar checkoutMercadoPago() acá abajo.
//   2. Poner CONFIG.metodoCheckout = "mercadopago" en js/config.js.
//
// Ningún otro archivo del front se toca. Esa es toda la razón de ser de
// checkout/index.js.

import { CONFIG } from "../config.js";

/**
 * URL del backend en Python (FastAPI). Vive acá y no en config.js porque
 * ningún módulo de Fase 1 tiene por qué conocerla.
 * Producción: Render o Railway. GitHub Pages no corre Python.
 */
const API_BASE = "";   // ej. "https://wo-api.onrender.com"

/**
 * Finaliza la compra creando una preferencia en Mercado Pago y redirigiendo
 * al Checkout Pro.
 *
 * Implementación esperada:
 *
 *   const r = await fetch(`${API_BASE}/api/crear-preferencia`, {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       items: carrito.items.map(i => ({
 *         title: i.nombre,
 *         quantity: i.cantidad,
 *         unit_price: i.precio,
 *         currency_id: CONFIG.moneda,
 *       })),
 *       payer: datosCliente,
 *     }),
 *   });
 *   const { init_point } = await r.json();
 *   window.location.href = init_point;
 *
 * ⚠ El precio NUNCA se toma del front para cobrar: el backend tiene que
 * recalcular el total contra su propia fuente de productos antes de crear la
 * preferencia. Si no, cualquiera edita el precio desde la consola del navegador.
 *
 * @param {{items: Array, totales: object}} carrito
 * @param {object} datosCliente
 * @returns {Promise<{ok: boolean, metodo: string, url?: string, motivo?: string}>}
 */
export async function checkoutMercadoPago(carrito, datosCliente = {}) {
  throw new Error(
    "Pendiente Fase 2: el checkout con Mercado Pago todavía no está implementado."
  );
}
