// ===========================================================================
// Página de contacto
// ===========================================================================
// Sin backend en Fase 1: el formulario arma un mensaje y abre WhatsApp con
// el texto prellenado, igual que el checkout. Consistente con la arquitectura
// del brief (sin servidor propio hasta Fase 2).

import { CONFIG } from "../config.js";
import { $ } from "../utils/dom.js";
import { toastError } from "../ui/toast.js";

const form = $("#form-contacto");
const campoNombre = $("#contacto-nombre");
const campoMensaje = $("#contacto-mensaje");
const errorNombre = $("#error-nombre");
const errorMensaje = $("#error-mensaje");

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  let valido = true;

  if (!campoNombre.value.trim()) {
    campoNombre.setAttribute("aria-invalid", "true");
    errorNombre.textContent = "Contanos tu nombre.";
    valido = false;
  } else {
    campoNombre.removeAttribute("aria-invalid");
    errorNombre.textContent = "";
  }

  if (!campoMensaje.value.trim()) {
    campoMensaje.setAttribute("aria-invalid", "true");
    errorMensaje.textContent = "Escribinos tu consulta.";
    valido = false;
  } else {
    campoMensaje.removeAttribute("aria-invalid");
    errorMensaje.textContent = "";
  }

  if (!valido) {
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  if (!CONFIG.whatsapp || /[^0-9]/.test(CONFIG.whatsapp)) {
    toastError("El número de WhatsApp todavía no está configurado.");
    return;
  }

  const mensaje =
    `¡Hola Wo!! Soy ${campoNombre.value.trim()}.\n\n${campoMensaje.value.trim()}`;

  const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  form.reset();
});
