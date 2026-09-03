// ===========================================================================
// Header — comportamiento
// ===========================================================================
// El HTML del header está escrito en cada página, no se inyecta desde acá:
// inyectarlo costaría SEO (el crawler vería un body vacío) y produciría CLS.
// Este módulo solo le da comportamiento a un markup que ya existe.

import { $, $$, delegar, bloquearScroll, atraparFoco, throttle } from "../utils/dom.js";
import * as carrito from "../carrito/estado.js";
import { abrir as abrirDrawer } from "./drawerCarrito.js";
import { normalizarTexto } from "../utils/formato.js";
import { cargarProductos } from "../data/productos.js";

let liberarFocoMenu = null;

// --- Contador del carrito --------------------------------------------------

function actualizarContador() {
  const cantidad = carrito.cantidadTotal();

  $$("[data-contador-carrito]").forEach((el) => {
    const previo = Number(el.textContent) || 0;
    el.textContent = String(cantidad);
    el.hidden = cantidad === 0;

    // Pulso solo cuando sube: al restar no hace falta llamar la atención.
    if (cantidad > previo) {
      el.classList.remove("contador--pulso");
      void el.offsetWidth;
      el.classList.add("contador--pulso");
    }
  });

  $$("[data-abrir-carrito]").forEach((el) => {
    el.setAttribute(
      "aria-label",
      cantidad === 0
        ? "Carrito vacío"
        : `Carrito, ${cantidad} ${cantidad === 1 ? "producto" : "productos"}`
    );
  });
}

// --- Menú mobile -----------------------------------------------------------

function iniciarMenuMobile() {
  const boton = $("[data-abrir-menu]");
  const menu = $("#menu-mobile");
  if (!boton || !menu) return;

  const abrir = () => {
    menu.hidden = false;
    void menu.offsetWidth;
    menu.classList.add("menu-mobile--abierto");
    boton.setAttribute("aria-expanded", "true");
    bloquearScroll(true);
    liberarFocoMenu = atraparFoco(menu);
    $("[data-cerrar-menu]", menu)?.focus();
  };

  const cerrar = () => {
    menu.classList.remove("menu-mobile--abierto");
    boton.setAttribute("aria-expanded", "false");
    bloquearScroll(false);
    liberarFocoMenu?.();
    liberarFocoMenu = null;
    menu.addEventListener("transitionend", () => {
      if (boton.getAttribute("aria-expanded") === "false") menu.hidden = true;
    }, { once: true });
  };

  boton.addEventListener("click", () =>
    boton.getAttribute("aria-expanded") === "true" ? cerrar() : abrir()
  );

  $$("[data-cerrar-menu]", menu).forEach((b) => b.addEventListener("click", cerrar));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && boton.getAttribute("aria-expanded") === "true") cerrar();
  });

  // Al navegar a un link del menú, se cierra.
  delegar(menu, "click", "a", cerrar);
}

// --- Buscador --------------------------------------------------------------
// Envía a tienda.html?q=... El filtrado en vivo lo hace el catálogo, que es
// donde están los resultados. Acá solo se sugieren coincidencias.

function iniciarBuscador() {
  const forms = $$("[data-form-busqueda]");
  if (!forms.length) return;

  forms.forEach((form) => {
    const input = $("input[type='search']", form);
    const sugerencias = $("[data-sugerencias]", form);

    form.addEventListener("submit", (e) => {
      const q = input?.value.trim();
      if (!q) { e.preventDefault(); return; }
      // El submit natural navega a tienda.html?q=... — no hace falta JS.
    });

    if (!input || !sugerencias) return;

    let productos = null;

    const buscar = async () => {
      const q = normalizarTexto(input.value);
      if (q.length < 2) {
        sugerencias.hidden = true;
        sugerencias.replaceChildren();
        return;
      }

      productos ??= await cargarProductos().catch(() => []);

      const encontrados = productos
        .filter((p) => p._busqueda.includes(q))
        .slice(0, 5);

      if (!encontrados.length) {
        sugerencias.hidden = true;
        return;
      }

      sugerencias.replaceChildren(
        ...encontrados.map((p) => {
          const a = document.createElement("a");
          a.className = "sugerencia";
          a.href = `producto.html?id=${encodeURIComponent(p.id)}`;
          a.textContent = p.nombre;
          return a;
        })
      );
      sugerencias.hidden = false;
    };

    let temporizador;
    input.addEventListener("input", () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(buscar, 220);
    });

    // Cerrar sugerencias al hacer clic afuera.
    document.addEventListener("click", (e) => {
      if (!form.contains(e.target)) sugerencias.hidden = true;
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") sugerencias.hidden = true;
    });
  });
}

// --- Header sticky con sombra al scrollear ---------------------------------

function iniciarSticky() {
  const header = $("[data-header]");
  if (!header) return;

  const alScrollear = throttle(() => {
    header.classList.toggle("header--scroll", window.scrollY > 8);
  }, 100);

  window.addEventListener("scroll", alScrollear, { passive: true });
  alScrollear();
}

// --- Inicio ----------------------------------------------------------------

export function iniciarHeader() {
  iniciarSticky();
  iniciarMenuMobile();
  iniciarBuscador();

  // Abre el drawer desde cualquier botón de carrito de la página.
  $$("[data-abrir-carrito]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      abrirDrawer();
    })
  );

  carrito.alCambiar(actualizarContador);
  actualizarContador();

  // Marca el link de la sección actual. Incluye el nav de escritorio Y el
  // menú mobile: antes solo marcaba [data-nav], así que en mobile ningún
  // link se marcaba nunca.
  const pagina = window.location.pathname.split("/").pop() || "index.html";
  $$("[data-nav] a, .menu-mobile__lista a").forEach((a) => {
    if (a.getAttribute("href") === pagina) a.setAttribute("aria-current", "page");
  });
}
