// ===========================================================================
// Tienda — catálogo con filtros, orden y búsqueda
// ===========================================================================

import { CONFIG } from "../config.js";
import { $, $$, crear, vaciar, debounce, atraparFoco, bloquearScroll, anunciar } from "../utils/dom.js";
import { cargarProductos, obtenerMarcas } from "../data/productos.js";
import { renderizarGrilla } from "../ui/cardProducto.js";
import { agruparModelos } from "../ui/selectorModelo.js";
import {
  leerFiltros,
  guardarFiltros,
  filtrosVacios,
  hayFiltrosActivos,
  alCambiarHistorial,
} from "../filtros/estado.js";
import { aplicarFiltros } from "../filtros/aplicar.js";
import { pluralizar } from "../utils/formato.js";

// --- Referencias al DOM esperado en tienda.html -----------------------------
const el = {
  titulo: $("#tienda-titulo"),
  resultado: $("#tienda-resultado"),
  chips: $("#chips-activos"),
  orden: $("#select-orden"),
  grilla: $("#grilla-tienda"),
  panel: $("#panel-filtros"),
  panelFondo: $("#panel-filtros-fondo"),
  abrirFiltros: $("#abrir-filtros"),
  cerrarFiltros: $("#cerrar-filtros"),
  limpiarFiltros: $("#limpiar-filtros"),
  selectModelo: $("#filtro-modelo"),
  selectMarca: $("#filtro-marca"),
  contenedorCategoria: $("#filtro-categoria"),
  precioMin: $("#precio-min"),
  precioMax: $("#precio-max"),
};

let productos = [];
let liberarFocoPanel = null;

// --- Carga inicial -----------------------------------------------------------

let error = null;
try {
  productos = await cargarProductos();
} catch (e) {
  error = e;
}

if (error) {
  mostrarError(error.message);
} else {
  poblarSelects();
  poblarCategorias();
  render(leerFiltros());

  alCambiarHistorial(render);   // botón atrás/adelante del navegador

  el.orden.addEventListener("change", () => {
    const filtros = { ...leerFiltros(), orden: el.orden.value };
    guardarFiltros(filtros);
    render(filtros);
  });

  el.selectModelo.addEventListener("change", () => aplicarDesdePanel({ modelo: el.selectModelo.value }));
  el.selectMarca.addEventListener("change", () => aplicarDesdePanel({ marca: el.selectMarca.value }));

  const aplicarPrecio = debounce(() => {
    aplicarDesdePanel({
      precioMin: el.precioMin.value ? Number(el.precioMin.value) : null,
      precioMax: el.precioMax.value ? Number(el.precioMax.value) : null,
    });
  }, 400);
  el.precioMin.addEventListener("input", aplicarPrecio);
  el.precioMax.addEventListener("input", aplicarPrecio);

  el.limpiarFiltros.addEventListener("click", () => {
    const vacios = filtrosVacios();
    guardarFiltros(vacios);
    render(vacios);
    anunciar("Filtros borrados");
  });

  iniciarPanelMobile();
}

// --- Poblar selects estáticos ------------------------------------------------

function poblarSelects() {
  // Modelo, agrupado igual que en el selector del home.
  const grupos = agruparModelos();
  el.selectModelo.append(
    ...[...grupos.entries()].map(([nombreGrupo, modelos]) =>
      crear(
        "optgroup",
        { label: nombreGrupo },
        modelos.map((m) => crear("option", { value: m }, [m]))
      )
    )
  );

  // Marca: solo las que existen en el catálogo actual.
  obtenerMarcas().then((marcas) => {
    el.selectMarca.append(...marcas.map((m) => crear("option", { value: m }, [m])));
    // Si la URL ya traía una marca (link compartido), reflejarla ahora que
    // las opciones existen.
    const actual = leerFiltros().marca;
    if (actual) el.selectMarca.value = actual;
  });
}

function poblarCategorias() {
  const filtros = leerFiltros();

  el.contenedorCategoria.replaceChildren(
    ...CONFIG.categorias.map((cat) =>
      crear(
        "button",
        {
          class: `chip-filtro${filtros.categoria === cat.id ? " chip-filtro--activo" : ""}`,
          type: "button",
          "aria-pressed": String(filtros.categoria === cat.id),
          dataset: { categoria: cat.id },
          onClick: () => {
            const actual = leerFiltros().categoria;
            aplicarDesdePanel({ categoria: actual === cat.id ? "" : cat.id });
          },
        },
        [cat.nombre]
      )
    )
  );
}

/** Combina el filtro tocado en el panel con el resto del estado actual. */
function aplicarDesdePanel(parcial) {
  const filtros = { ...leerFiltros(), ...parcial };
  guardarFiltros(filtros);
  render(filtros);
}

// --- Render principal ---------------------------------------------------------

function render(filtros) {
  const resultado = aplicarFiltros(productos, filtros);

  el.orden.value = filtros.orden;
  el.selectModelo.value = filtros.modelo;
  if (el.selectMarca.options.length > 1) el.selectMarca.value = filtros.marca;
  el.precioMin.value = filtros.precioMin ?? "";
  el.precioMax.value = filtros.precioMax ?? "";

  $$(".chip-filtro", el.contenedorCategoria).forEach((chip) => {
    const activo = chip.dataset.categoria === filtros.categoria;
    chip.classList.toggle("chip-filtro--activo", activo);
    chip.setAttribute("aria-pressed", String(activo));
  });

  el.titulo.textContent = tituloSegunFiltros(filtros);
  el.resultado.textContent = pluralizar(resultado.length, "producto encontrado", "productos encontrados");

  renderizarChips(filtros);

  if (!resultado.length) {
    mostrarVacio(filtros);
  } else {
    // Sobre fondo blanco: badge de descuento en $nude-oscuro.
    renderizarGrilla(el.grilla, resultado, { superficieClara: true });
  }
}

function tituloSegunFiltros(filtros) {
  if (filtros.q) return `Resultados para "${filtros.q}"`;
  if (filtros.categoria) {
    return CONFIG.categorias.find((c) => c.id === filtros.categoria)?.nombre ?? "Tienda";
  }
  return "Tienda";
}

// --- Chips de filtros activos -------------------------------------------------

function renderizarChips(filtros) {
  const activos = [];

  if (filtros.modelo) activos.push({ etiqueta: filtros.modelo, quitar: { modelo: "" } });
  if (filtros.categoria) {
    const nombre = CONFIG.categorias.find((c) => c.id === filtros.categoria)?.nombre ?? filtros.categoria;
    activos.push({ etiqueta: nombre, quitar: { categoria: "" } });
  }
  if (filtros.marca) activos.push({ etiqueta: filtros.marca, quitar: { marca: "" } });
  if (filtros.precioMin != null || filtros.precioMax != null) {
    const min = filtros.precioMin != null ? `$${filtros.precioMin}` : "";
    const max = filtros.precioMax != null ? `$${filtros.precioMax}` : "";
    activos.push({
      etiqueta: `Precio: ${min || "0"} – ${max || "∞"}`,
      quitar: { precioMin: null, precioMax: null },
    });
  }
  if (filtros.q) activos.push({ etiqueta: `Búsqueda: "${filtros.q}"`, quitar: { q: "" } });

  if (!activos.length) {
    vaciar(el.chips);
    return;
  }

  el.chips.replaceChildren(
    ...activos.map((chip) =>
      crear(
        "button",
        {
          class: "chip-activo",
          type: "button",
          "aria-label": `Quitar filtro: ${chip.etiqueta}`,
          onClick: () => aplicarDesdePanel(chip.quitar),
        },
        [chip.etiqueta, crear("span", { "aria-hidden": "true" }, [" ✕"])]
      )
    ),
    crear(
      "button",
      { class: "chip-activo chip-activo--limpiar", type: "button", onClick: () => el.limpiarFiltros.click() },
      ["Limpiar todo"]
    )
  );
}

// --- Estados vacío y de error --------------------------------------------------

function mostrarVacio(filtros) {
  vaciar(el.grilla);
  el.grilla.append(
    crear("div", { class: "grilla-estado" }, [
      crear("p", { class: "grilla-estado__titulo" }, ["No encontramos productos"]),
      crear("p", {}, [
        hayFiltrosActivos(filtros)
          ? "Probá sacando algún filtro."
          : "Todavía no hay productos cargados en esta categoría.",
      ]),
      hayFiltrosActivos(filtros) &&
        crear(
          "button",
          { class: "btn btn--secundario", type: "button", style: "margin-top:1rem",
            onClick: () => el.limpiarFiltros.click() },
          ["Limpiar filtros"]
        ),
    ])
  );
}

function mostrarError(mensaje) {
  const grilla = $("#grilla-tienda");
  grilla?.replaceChildren(
    crear("div", { class: "grilla-estado" }, [
      crear("p", { class: "grilla-estado__titulo" }, ["No pudimos cargar el catálogo"]),
      crear("p", {}, [mensaje]),
    ])
  );
}

// --- Panel de filtros en mobile (drawer) --------------------------------------

function iniciarPanelMobile() {
  const abrir = () => {
    el.panel.classList.add("panel-filtros--abierto");
    el.panelFondo.hidden = false;
    void el.panelFondo.offsetWidth;
    el.panelFondo.classList.add("panel-filtros-fondo--visible");
    el.abrirFiltros.setAttribute("aria-expanded", "true");
    bloquearScroll(true);
    liberarFocoPanel = atraparFoco(el.panel);
    el.cerrarFiltros?.focus();
  };

  const cerrar = () => {
    el.panel.classList.remove("panel-filtros--abierto");
    el.panelFondo.classList.remove("panel-filtros-fondo--visible");
    el.abrirFiltros.setAttribute("aria-expanded", "false");
    bloquearScroll(false);
    liberarFocoPanel?.();
    liberarFocoPanel = null;
    el.panelFondo.addEventListener("transitionend", () => { el.panelFondo.hidden = true; }, { once: true });
  };

  el.abrirFiltros?.addEventListener("click", abrir);
  el.cerrarFiltros?.addEventListener("click", cerrar);
  el.panelFondo?.addEventListener("click", cerrar);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.abrirFiltros.getAttribute("aria-expanded") === "true") cerrar();
  });
}
