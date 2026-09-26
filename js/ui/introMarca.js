// ===========================================================================
// Intro de marca — orquestación
// ===========================================================================
// Todo el timing visual vive en CSS (scss/components/_intro-marca.scss); acá
// se coordina CUÁNDO se dispara la transformación y la limpieza final.
//
// La composición (logo → blobs → título → bajada → cta) se arma sola y
// después SE QUEDA QUIETA — sin timer ni botón de saltar. Se revela el hero
// real (quedándose en el home, no navega a tienda.html) recién cuando el
// usuario hace algo: intenta scrollear (mouse/trackpad/touch/teclado) o
// clickea el botón "Ver toda la tienda".
//
// El script inline en <head> de index.html ya decidió, antes del primer
// paint, si esta sesión tiene que ver la intro (sessionStorage +
// prefers-reduced-motion) y si no corresponde le agregó "sin-intro" a
// <html>. Acá solo hace falta respetar esa decisión.

import { CONFIG } from "../config.js";
import { $, bloquearScroll } from "../utils/dom.js";

const DURACION_SALIDA_MS = 550;   // duración de .intro-marca--saliendo
const TECLAS_DE_SCROLL = new Set(["ArrowDown", "PageDown", " ", "Spacebar", "End"]);

export function iniciarIntroMarca() {
  const overlay = $("#intro-marca");
  if (!overlay) return;   // esta pantalla solo existe en index.html

  if (document.documentElement.classList.contains("sin-intro")) {
    overlay.remove();
    return;
  }

  bloquearScroll(true);
  overlay.classList.add("intro-marca--activa");

  let finalizado = false;
  const finalizar = () => {
    if (finalizado) return;
    finalizado = true;

    try {
      sessionStorage.setItem(CONFIG.storage.claveIntroVista, "1");
    } catch {
      // Modo privado o storage bloqueado: no es grave, en la próxima carga
      // de esta sesión se vuelve a mostrar la intro una vez más.
    }

    bloquearScroll(false);
    overlay.remove();
  };

  let revelando = false;

  function revelar() {
    if (revelando) return;
    revelando = true;
    window.removeEventListener("wheel", revelar);
    window.removeEventListener("touchmove", revelar);
    window.removeEventListener("keydown", alTeclado);
    overlay.classList.add("intro-marca--saliendo");
    setTimeout(finalizar, DURACION_SALIDA_MS);
  }

  function alTeclado(evento) {
    if (TECLAS_DE_SCROLL.has(evento.key)) revelar();
  }

  // El scroll real está bloqueado (bloquearScroll), pero los eventos de
  // intención de scroll siguen disparando igual — los usamos como señal.
  window.addEventListener("wheel", revelar, { passive: true });
  window.addEventListener("touchmove", revelar, { passive: true });
  window.addEventListener("keydown", alTeclado);

  // Mismo gatillo que el scroll: revela el home, no navega a otra página.
  $("[data-revelar-intro]", overlay)?.addEventListener("click", revelar);
}
