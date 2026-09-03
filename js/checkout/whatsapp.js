// ===========================================================================
// Checkout por WhatsApp — implementación de Fase 1
// ===========================================================================
// Arma un mensaje legible con el pedido y abre wa.me con el texto prellenado.
// El cliente cierra la venta por chat: acuerda envío y forma de pago.

import { CONFIG } from "../config.js";
import { precio } from "../utils/formato.js";

/** Límite práctico de una URL de wa.me antes de que empiece a truncarse. */
const LARGO_MAXIMO_URL = 8000;

/**
 * Formatea una línea del pedido.
 *
 *   • Funda de Silicona MagSafe (iPhone 15 Pro) — Negro
 *     2 x $ 18.500 = $ 37.000
 */
function lineaItem(item) {
  const partes = [`• ${item.nombre}`];

  // El modelo solo aporta si el producto no es universal.
  if (item.compatibilidad?.length) {
    partes.push(` (${item.compatibilidad.join(" / ")})`);
  }
  if (item.variante?.nombre) {
    partes.push(` — ${item.variante.nombre}`);
  }

  const subtotalLinea = item.precio * item.cantidad;
  return (
    partes.join("") +
    `\n  ${item.cantidad} x ${precio(item.precio)} = ${precio(subtotalLinea)}`
  );
}

/**
 * Construye el texto del pedido. Exportado aparte de la apertura de la URL
 * para poder testearlo y para previsualizarlo en la UI antes de enviar.
 */
export function armarMensaje(carrito, datosCliente = {}) {
  const { items, totales } = carrito;

  const bloques = [
    "¡Hola Wo!! Quiero hacer este pedido:",
    "",
    items.map(lineaItem).join("\n\n"),
    "",
    `Subtotal: ${precio(totales.subtotal)}`,
    totales.envioGratis ? "Envío: GRATIS" : "Envío: a coordinar",
    `Total: ${precio(totales.total)}`,
  ];

  // Datos opcionales: en Fase 1 el formulario puede no pedirlos.
  const extras = [];
  if (datosCliente.nombre) extras.push(`Nombre: ${datosCliente.nombre}`);
  if (datosCliente.localidad) extras.push(`Localidad: ${datosCliente.localidad}`);
  if (datosCliente.entrega) extras.push(`Entrega: ${datosCliente.entrega}`);
  if (datosCliente.notas) extras.push(`Notas: ${datosCliente.notas}`);

  if (extras.length) {
    bloques.push("", "---", ...extras);
  }

  return bloques.join("\n");
}

/**
 * Finaliza la compra abriendo WhatsApp.
 *
 * Firma idéntica a la de mercadopago.js: eso es lo que permite cambiar
 * CONFIG.metodoCheckout sin tocar nada más. Ver checkout/index.js.
 *
 * @param {{items: Array, totales: object}} carrito
 * @param {object} datosCliente
 * @returns {Promise<{ok: boolean, metodo: string, url?: string, motivo?: string}>}
 */
export async function checkoutWhatsapp(carrito, datosCliente = {}) {
  if (!carrito?.items?.length) {
    return { ok: false, metodo: "whatsapp", motivo: "El carrito está vacío." };
  }

  const numero = CONFIG.whatsapp;

  // El placeholder del brief tiene X. Mejor un error claro acá que un chat
  // que se abre contra un número inexistente.
  if (!numero || /[^0-9]/.test(numero)) {
    return {
      ok: false,
      metodo: "whatsapp",
      motivo:
        "El número de WhatsApp no está configurado. Revisá CONFIG.whatsapp en js/config.js.",
    };
  }

  const mensaje = armarMensaje(carrito, datosCliente);
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  if (url.length > LARGO_MAXIMO_URL) {
    return {
      ok: false,
      metodo: "whatsapp",
      motivo:
        "El pedido es demasiado largo para enviarlo por WhatsApp. " +
        "Escribinos y lo armamos juntos.",
    };
  }

  // _blank + noopener: la pestaña nueva no puede tocar la nuestra.
  const ventana = window.open(url, "_blank", "noopener,noreferrer");

  if (!ventana) {
    // Bloqueador de popups. Devolvemos la URL para que la UI ofrezca un link
    // clickeable, que sí pasa el bloqueo por venir de un gesto del usuario.
    return {
      ok: false,
      metodo: "whatsapp",
      url,
      motivo: "El navegador bloqueó la ventana. Tocá el link para abrir WhatsApp.",
    };
  }

  return { ok: true, metodo: "whatsapp", url, mensaje };
}
