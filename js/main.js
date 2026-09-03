// ===========================================================================
// main.js — arranque común a todas las páginas
// ===========================================================================
// Lo carga cada página con <script type="module" src="js/main.js">.
// Solo se ocupa de lo global: header, drawer y botón de WhatsApp.
// La lógica de cada página vive en su propio módulo.

import { iniciarHeader } from "./ui/header.js";
import { iniciarDrawer } from "./ui/drawerCarrito.js";
import { CONFIG } from "./config.js";
import { $$ } from "./utils/dom.js";

function iniciarWhatsappFlotante() {
  const mensaje = encodeURIComponent(
    "¡Hola Wo!! Tengo una consulta sobre accesorios para iPhone."
  );

  $$("[data-wsp]").forEach((el) => {
    // Con el placeholder sin completar, el botón se oculta en vez de abrir
    // un chat contra un número inexistente.
    if (!CONFIG.whatsapp || /[^0-9]/.test(CONFIG.whatsapp)) {
      el.hidden = true;
      console.warn(
        "[Wo!] CONFIG.whatsapp no está configurado — el botón de WhatsApp queda oculto. " +
        "Completalo en js/config.js."
      );
      return;
    }
    el.href = `https://wa.me/${CONFIG.whatsapp}?text=${mensaje}`;
  });
}

function iniciarAnioFooter() {
  $$("[data-anio]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

iniciarDrawer();
iniciarHeader();
iniciarWhatsappFlotante();
iniciarAnioFooter();
