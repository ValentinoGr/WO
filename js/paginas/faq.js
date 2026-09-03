// ===========================================================================
// FAQ
// ===========================================================================
// El acordeón es <details>/<summary> nativo: gratis en accesibilidad y
// teclado, sin reinventar un disclosure widget en JS.
//
// Este módulo solo resuelve un detalle que el HTML nativo no cubre: si el
// link apunta a una pregunta puntual (no solo a la sección), esa pregunta
// tiene que abrirse sola al llegar.

function abrirDesdeHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return;

  const objetivo = document.getElementById(id);
  if (!objetivo) return;

  const details = objetivo.matches("details") ? objetivo : objetivo.closest("details");
  if (details) details.open = true;

  objetivo.scrollIntoView({ block: "start" });
}

abrirDesdeHash();
window.addEventListener("hashchange", abrirDesdeHash);
