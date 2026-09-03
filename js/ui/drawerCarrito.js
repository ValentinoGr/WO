// ===========================================================================
// Drawer del carrito
// ===========================================================================
// Panel lateral que se abre al agregar un producto. La página carrito.html
// muestra lo mismo pero con más detalle; este drawer es para no sacar al
// cliente del catálogo mientras compra.

import { crear, $, vaciar, atraparFoco, bloquearScroll, anunciar } from "../utils/dom.js";
import * as carrito from "../carrito/estado.js";
import { precio, pluralizar } from "../utils/formato.js";
import { textoBotonCheckout, finalizarCompra } from "../checkout/index.js";
import { toastError } from "./toast.js";

let elementos = null;
let liberarFoco = null;
let abierto = false;

// --- Construcción ----------------------------------------------------------

function construir() {
  const panel = crear("aside", {
    class: "drawer",
    id: "drawer-carrito",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "drawer-titulo",
    hidden: true,
  });

  const titulo = crear("h2", { class: "drawer__titulo", id: "drawer-titulo" }, ["Tu carrito"]);
  const btnCerrar = crear(
    "button",
    { class: "btn-icono drawer__cerrar", type: "button", "aria-label": "Cerrar carrito" },
    ["✕"]
  );

  const lista = crear("ul", { class: "drawer__lista", role: "list" });
  const barraEnvio = crear("div", { class: "drawer__envio" });
  const pie = crear("div", { class: "drawer__pie" });

  panel.append(
    crear("header", { class: "drawer__encabezado" }, [titulo, btnCerrar]),
    crear("div", { class: "drawer__cuerpo" }, [lista]),
    crear("footer", { class: "drawer__footer" }, [barraEnvio, pie])
  );

  const fondo = crear("div", { class: "drawer-fondo", hidden: true });

  document.body.append(fondo, panel);

  btnCerrar.addEventListener("click", cerrar);
  fondo.addEventListener("click", cerrar);

  return { panel, fondo, lista, barraEnvio, pie };
}

function obtener() {
  if (!elementos?.panel?.isConnected) elementos = construir();
  return elementos;
}

// --- Render ----------------------------------------------------------------

function filaItem(item) {
  const controlCantidad = crear("div", { class: "cantidad", role: "group",
    "aria-label": `Cantidad de ${item.nombre}` }, [
    crear("button", {
      class: "cantidad__btn",
      type: "button",
      "aria-label": "Restar uno",
      onClick: () => carrito.actualizarCantidad(item.clave, item.cantidad - 1),
    }, ["−"]),
    crear("span", { class: "cantidad__valor", "aria-live": "polite" }, [String(item.cantidad)]),
    crear("button", {
      class: "cantidad__btn",
      type: "button",
      "aria-label": "Sumar uno",
      disabled: item.cantidad >= item.stockMaximo,
      onClick: () => {
        const r = carrito.actualizarCantidad(item.clave, item.cantidad + 1);
        if (!r.ok) toastError(r.motivo);
      },
    }, ["+"]),
  ]);

  const media = crear("div", { class: "media media--producto drawer__miniatura" });
  if (item.imagen) {
    media.append(crear("img", {
      src: item.imagen, alt: "", width: 120, height: 120, loading: "lazy",
    }));
  }

  return crear("li", { class: "drawer__item" }, [
    media,
    crear("div", { class: "drawer__item-datos" }, [
      crear("p", { class: "drawer__item-nombre" }, [item.nombre]),
      item.variante?.nombre &&
        crear("p", { class: "drawer__item-variante" }, [item.variante.nombre]),
      crear("p", { class: "drawer__item-precio" }, [
        `${item.cantidad} × ${precio(item.precio)}`,
      ]),
      controlCantidad,
    ]),
    crear("div", { class: "drawer__item-derecha" }, [
      crear("p", { class: "drawer__item-subtotal" }, [precio(item.precio * item.cantidad)]),
      crear("button", {
        class: "drawer__quitar",
        type: "button",
        "aria-label": `Quitar ${item.nombre} del carrito`,
        onClick: () => {
          carrito.quitar(item.clave);
          anunciar(`${item.nombre} eliminado del carrito`);
        },
      }, ["Quitar"]),
    ]),
  ]);
}

function vacio() {
  return crear("div", { class: "drawer__vacio" }, [
    crear("p", { class: "drawer__vacio-titulo" }, ["Tu carrito está vacío"]),
    crear("p", { class: "drawer__vacio-texto" }, [
      "Encontrá el accesorio que necesitás para tu iPhone.",
    ]),
    crear("a", { class: "btn btn--primario", href: "tienda.html" }, ["Ver productos"]),
  ]);
}

function renderizar() {
  const { lista, barraEnvio, pie } = obtener();
  const items = carrito.obtenerItems();
  const t = carrito.totales();

  if (!items.length) {
    vaciar(lista);
    lista.append(vacio());
    vaciar(barraEnvio);
    vaciar(pie);
    return;
  }

  lista.replaceChildren(...items.map(filaItem));

  // --- Barra de envío gratis ---
  barraEnvio.replaceChildren(
    crear("p", { class: `drawer__envio-texto${t.envioGratis ? " drawer__envio-texto--ok" : ""}` },
      [t.textoEnvio]),
    crear("div", {
      class: "barra-progreso",
      role: "progressbar",
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuenow": String(Math.round(t.progresoEnvioGratis * 100)),
      "aria-label": "Progreso hacia el envío gratis",
    }, [
      crear("span", {
        class: "barra-progreso__relleno",
        style: `width: ${t.progresoEnvioGratis * 100}%`,
      }),
    ])
  );

  // --- Totales y checkout ---
  const btnFinalizar = crear("button", {
    class: "btn btn--primario btn--bloque btn--lg",
    type: "button",
  }, [textoBotonCheckout()]);

  btnFinalizar.addEventListener("click", async () => {
    btnFinalizar.disabled = true;
    btnFinalizar.textContent = "Preparando pedido…";

    try {
      const r = await finalizarCompra();

      if (!r.ok) {
        toastError(r.motivo ?? "No se pudo finalizar el pedido.");
        // Si el popup fue bloqueado, se ofrece un link que sí pasa.
        if (r.url) {
          pie.prepend(crear("a", {
            class: "drawer__link-alternativo",
            href: r.url,
            target: "_blank",
            rel: "noopener noreferrer",
          }, ["Abrir WhatsApp manualmente"]));
        }
      }
    } catch (error) {
      toastError(error.message);
    } finally {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = textoBotonCheckout();
    }
  });

  pie.replaceChildren(
    crear("div", { class: "drawer__total" }, [
      crear("span", {}, [pluralizar(t.cantidad, "producto")]),
      crear("strong", { class: "drawer__total-monto" }, [precio(t.subtotal)]),
    ]),
    crear("p", { class: "drawer__aclaracion" }, [
      t.envioGratis ? "Envío sin cargo" : "El costo de envío se coordina por WhatsApp",
    ]),
    btnFinalizar,
    crear("a", { class: "btn btn--fantasma btn--bloque", href: "carrito.html" },
      ["Ver carrito completo"])
  );
}

// --- Apertura y cierre -----------------------------------------------------

export function abrir() {
  const { panel, fondo } = obtener();
  if (abierto) return;

  renderizar();

  fondo.hidden = false;
  panel.hidden = false;
  void panel.offsetWidth;

  fondo.classList.add("drawer-fondo--visible");
  panel.classList.add("drawer--abierto");
  abierto = true;

  bloquearScroll(true);
  liberarFoco = atraparFoco(panel);
  $(".drawer__cerrar", panel)?.focus();

  document.addEventListener("keydown", alPresionarEscape);
}

export function cerrar() {
  const { panel, fondo } = obtener();
  if (!abierto) return;

  fondo.classList.remove("drawer-fondo--visible");
  panel.classList.remove("drawer--abierto");
  abierto = false;

  bloquearScroll(false);
  liberarFoco?.();
  liberarFoco = null;

  document.removeEventListener("keydown", alPresionarEscape);

  panel.addEventListener("transitionend", () => {
    if (!abierto) { panel.hidden = true; fondo.hidden = true; }
  }, { once: true });
}

function alPresionarEscape(e) {
  if (e.key === "Escape") cerrar();
}

export function alternar() {
  abierto ? cerrar() : abrir();
}

/** Se llama una vez desde main.js. */
export function iniciarDrawer() {
  obtener();
  // Si el drawer está abierto cuando cambia el carrito, se repinta solo.
  carrito.alCambiar(() => { if (abierto) renderizar(); });
}
