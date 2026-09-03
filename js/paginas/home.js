// ===========================================================================
// Home
// ===========================================================================

import { $, crear } from "../utils/dom.js";
import { CONFIG } from "../config.js";
import { obtenerDestacados, obtenerNovedades } from "../data/productos.js";
import { renderizarGrilla } from "../ui/cardProducto.js";
import { montarSelectorModelo } from "../ui/selectorModelo.js";

// --- Selector de modelo (lo más importante del home) -----------------------
montarSelectorModelo($("#selector-modelo"));

// --- Categorías ------------------------------------------------------------
const FONDOS = ["media--nude", "media--beige", "media--gris"];

$("#categorias")?.replaceChildren(
  ...CONFIG.categorias.map((cat, i) =>
    crear("a", {
      class: "categoria",
      href: `tienda.html?categoria=${encodeURIComponent(cat.id)}`,
    }, [
      crear("div", { class: `media media--categoria ${FONDOS[i % FONDOS.length]}` }),
      crear("span", { class: "categoria__nombre" }, [cat.nombre]),
    ])
  )
);

// --- Grillas de productos --------------------------------------------------

function esqueletos(cantidad = 4) {
  return Array.from({ length: cantidad }, () =>
    crear("div", { class: "esqueleto" }, [
      crear("div", { class: "esqueleto__media" }),
      crear("div", { class: "esqueleto__linea" }),
      crear("div", { class: "esqueleto__linea" }),
    ])
  );
}

function mostrarError(contenedor, mensaje) {
  contenedor?.replaceChildren(
    crear("div", { class: "grilla-estado" }, [
      crear("p", { class: "grilla-estado__titulo" }, ["No pudimos cargar los productos"]),
      crear("p", {}, [mensaje]),
    ])
  );
}

function mostrarVacio(contenedor, mensaje) {
  contenedor?.replaceChildren(
    crear("div", { class: "grilla-estado" }, [crear("p", {}, [mensaje])])
  );
}

async function cargarSeccion(selector, obtener, mensajeVacio) {
  const contenedor = $(selector);
  if (!contenedor) return;

  contenedor.replaceChildren(...esqueletos());

  try {
    const productos = await obtener();

    if (!productos.length) {
      mostrarVacio(contenedor, mensajeVacio);
      return;
    }

    // Las grillas del home están sobre fondo blanco → badge de descuento cálido.
    renderizarGrilla(contenedor, productos, { superficieClara: true });
  } catch (error) {
    mostrarError(contenedor, error.message);
  }
}

await Promise.all([
  cargarSeccion("#destacados", () => obtenerDestacados(4),
    "Todavía no hay productos destacados."),
  cargarSeccion("#novedades", () => obtenerNovedades(4),
    "Todavía no hay novedades."),
]);
