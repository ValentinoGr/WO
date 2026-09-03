// ===========================================================================
// Página de carrito
// ===========================================================================
// Versión completa del carrito. El drawer (ui/drawerCarrito.js) muestra un
// resumen rápido; acá está el detalle editable y los datos opcionales del
// pedido que se mandan por WhatsApp.

import { $, crear, vaciar } from "../utils/dom.js";
import * as carrito from "../carrito/estado.js";
import { precio, pluralizar } from "../utils/formato.js";
import { finalizarCompra, textoBotonCheckout } from "../checkout/index.js";
import { toastError, toastExito } from "../ui/toast.js";

const el = {
  contenido: $("#carrito-contenido"),
  lista: $("#carrito-lista"),
  envioTexto: $("#carrito-envio-texto"),
  envioBarra: $("#carrito-envio-barra"),
  subtotal: $("#carrito-subtotal"),
  envio: $("#carrito-envio"),
  total: $("#carrito-total"),
  form: $("#form-datos-cliente"),
  btnFinalizar: $("#btn-finalizar"),
  vacio: $("#carrito-vacio"),
  resumen: $("#carrito-resumen"),
};

// Antes de mostrar nada, se revalida contra el catálogo: el carrito puede
// tener días y los precios o el stock pueden haber cambiado.
const { cambios } = await carrito.sincronizar();

if (cambios.length) {
  avisarCambios(cambios);
}

carrito.alCambiar(render);
render();

function avisarCambios(cambios) {
  const detalle = cambios
    .map((c) => {
      if (c.tipo === "eliminado") return `${c.nombre}: ya no está disponible`;
      if (c.tipo === "sin-stock") return `${c.nombre}: se quedó sin stock`;
      if (c.tipo === "precio") return `${c.nombre}: el precio cambió a ${precio(c.actual)}`;
      if (c.tipo === "cantidad") return `${c.nombre}: solo quedan ${c.actual} unidades`;
      return c.nombre;
    })
    .join(" · ");

  toastError(`Actualizamos tu carrito: ${detalle}`);
}

function filaItem(item) {
  const media = crear("div", { class: "media media--producto carrito-item__miniatura" });
  if (item.imagen) {
    media.append(crear("img", {
      src: item.imagen, alt: "", width: 160, height: 160, loading: "lazy",
      onError: (e) => e.target.remove(),
    }));
  }

  return crear("li", { class: "carrito-item" }, [
    crear("a", { href: `producto.html?id=${encodeURIComponent(item.id)}`, class: "carrito-item__media-link" }, [media]),

    crear("div", { class: "carrito-item__datos" }, [
      crear("a", {
        href: `producto.html?id=${encodeURIComponent(item.id)}`,
        class: "carrito-item__nombre",
      }, [item.nombre]),
      item.variante?.nombre &&
        crear("p", { class: "carrito-item__variante" }, [item.variante.nombre]),
      crear("p", { class: "carrito-item__precio-unit" }, [`${precio(item.precio)} c/u`]),

      crear("button", {
        class: "carrito-item__quitar",
        type: "button",
        onClick: () => carrito.quitar(item.clave),
      }, ["Quitar"]),
    ]),

    crear("div", { class: "cantidad cantidad--grande carrito-item__cantidad",
      role: "group", "aria-label": `Cantidad de ${item.nombre}` }, [
      crear("button", {
        class: "cantidad__btn", type: "button", "aria-label": "Restar uno",
        onClick: () => carrito.actualizarCantidad(item.clave, item.cantidad - 1),
      }, ["−"]),
      crear("span", { class: "cantidad__valor", "aria-live": "polite" }, [String(item.cantidad)]),
      crear("button", {
        class: "cantidad__btn", type: "button", "aria-label": "Sumar uno",
        disabled: item.cantidad >= item.stockMaximo,
        onClick: () => {
          const r = carrito.actualizarCantidad(item.clave, item.cantidad + 1);
          if (!r.ok) toastError(r.motivo);
        },
      }, ["+"]),
    ]),

    crear("p", { class: "carrito-item__subtotal" }, [precio(item.precio * item.cantidad)]),
  ]);
}

function render() {
  const items = carrito.obtenerItems();
  const t = carrito.totales();

  el.vacio.hidden = items.length > 0;
  el.resumen.hidden = items.length === 0;
  el.lista.parentElement.hidden = items.length === 0;

  if (!items.length) return;

  el.lista.replaceChildren(...items.map(filaItem));

  el.envioTexto.textContent = t.textoEnvio;
  el.envioTexto.classList.toggle("carrito-envio__texto--ok", t.envioGratis);
  el.envioBarra.style.width = `${t.progresoEnvioGratis * 100}%`;
  el.envioBarra.parentElement.setAttribute("aria-valuenow", String(Math.round(t.progresoEnvioGratis * 100)));

  el.subtotal.textContent = precio(t.subtotal);
  el.envio.textContent = t.envioGratis ? "Gratis" : "A coordinar";
  el.total.textContent = precio(t.total);

  $("#carrito-cantidad").textContent = pluralizar(t.cantidad, "producto");
}

// --- Finalizar compra --------------------------------------------------------

el.btnFinalizar.addEventListener("click", async () => {
  const datosCliente = {
    nombre: $("#dato-nombre")?.value.trim() || undefined,
    localidad: $("#dato-localidad")?.value.trim() || undefined,
    entrega: $("#dato-entrega")?.value || undefined,
    notas: $("#dato-notas")?.value.trim() || undefined,
  };

  el.btnFinalizar.disabled = true;
  el.btnFinalizar.textContent = "Preparando pedido…";

  try {
    const r = await finalizarCompra(datosCliente);

    if (!r.ok) {
      toastError(r.motivo ?? "No se pudo finalizar el pedido.");
      if (r.cambios?.length) avisarCambios(r.cambios);
    } else {
      toastExito("Te llevamos a WhatsApp para confirmar el pedido.");
    }
  } catch (error) {
    toastError(error.message);
  } finally {
    el.btnFinalizar.disabled = false;
    el.btnFinalizar.textContent = textoBotonCheckout();
  }
});

el.btnFinalizar.textContent = textoBotonCheckout();
