// ===========================================================================
// Página de producto
// ===========================================================================

import { CONFIG } from "../config.js";
import { $, crear, leerParametro } from "../utils/dom.js";
import { obtenerProducto, obtenerRelacionados } from "../data/productos.js";
import { montarGaleria } from "../ui/galeria.js";
import { renderizarGrilla } from "../ui/cardProducto.js";
import * as carrito from "../carrito/estado.js";
import { abrir as abrirDrawer } from "../ui/drawerCarrito.js";
import { toastExito, toastError } from "../ui/toast.js";
import {
  precio,
  porcentajeDescuento,
  textoCompatibilidad,
} from "../utils/formato.js";

const contenedor = $("#producto-contenido");
const id = leerParametro("id");

let producto = null;
try {
  producto = id ? await obtenerProducto(id) : null;
} catch (error) {
  mostrarError(error.message);
}

if (!producto) {
  mostrarNoEncontrado();
} else {
  await renderizarProducto(producto);
}

// ---------------------------------------------------------------------------

// Estas dos vistas reemplazan todo el contenido de la página: sin producto
// que renderizar, no hay otro <h1> — este pasa a serlo, para que la página
// nunca quede sin encabezado principal.
function mostrarError(mensaje) {
  contenedor.replaceChildren(
    crear("div", { class: "grilla-estado" }, [
      crear("h1", { class: "grilla-estado__titulo" }, ["No pudimos cargar el producto"]),
      crear("p", {}, [mensaje]),
    ])
  );
}

function mostrarNoEncontrado() {
  contenedor.replaceChildren(
    crear("div", { class: "grilla-estado" }, [
      crear("h1", { class: "grilla-estado__titulo" }, ["Este producto no existe o fue dado de baja"]),
      crear("a", { class: "btn btn--primario", href: "tienda.html", style: "margin-top:1rem" },
        ["Volver a la tienda"]),
    ])
  );
}

async function renderizarProducto(producto) {
  // --- Metadatos de la página (una sola producto.html sirve a todos) -------
  document.title = `${producto.nombre} — Wo!`;
  setMeta("description", producto.descripcion.slice(0, 155));
  setMetaProp("og:title", producto.nombre);
  setMetaProp("og:description", producto.descripcion.slice(0, 155));
  setMetaProp("og:type", "product");
  inyectarJsonLd(producto);

  // --- Breadcrumb ------------------------------------------------------------
  // Element.replaceChildren() nativo no descarta valores falsy como el
  // helper crear(): un `categoria` no encontrado (undefined) se vería como
  // el texto literal "undefined" en el breadcrumb si no se filtra a mano.
  const categoria = CONFIG.categorias.find((c) => c.id === producto.categoria);
  $("#breadcrumb").replaceChildren(
    ...[
      crear("a", { href: "index.html" }, ["Inicio"]),
      crear("span", { "aria-hidden": "true" }, [" / "]),
      crear("a", { href: "tienda.html" }, ["Tienda"]),
      categoria &&
        crear("span", {}, [
          crear("span", { "aria-hidden": "true" }, [" / "]),
          crear("a", { href: `tienda.html?categoria=${categoria.id}` }, [categoria.nombre]),
        ]),
      crear("span", { "aria-hidden": "true" }, [" / "]),
      crear("span", { "aria-current": "page" }, [producto.nombre]),
    ].filter(Boolean)
  );

  // --- Galería -----------------------------------------------------------
  montarGaleria($("#galeria"), producto);

  // --- Estado de variante elegida ------------------------------------------
  let varianteElegida = producto.tieneVariantes
    ? producto.variantes.find((v) => v.stock > 0) ?? null
    : null;
  let cantidad = 1;

  // --- Cuerpo: marca, título, precio, compat --------------------------------
  const descuento = porcentajeDescuento(producto.precio, producto.precioAnterior);

  const cuerpo = $("#producto-cuerpo");
  cuerpo.replaceChildren(
    crear("p", { class: "producto__marca" }, [producto.marca]),
    crear("h1", { class: "producto__titulo" }, [producto.nombre]),
    crear("p", { class: "producto__compat" }, [textoCompatibilidad(producto.compatibilidad)]),

    crear("div", { class: "producto__precios" }, [
      crear("span", { class: "producto__precio" }, [precio(producto.precio)]),
      descuento > 0 &&
        crear("s", { class: "producto__precio-anterior" }, [precio(producto.precioAnterior)]),
      descuento > 0 &&
        // Fondo blanco (la página de producto no está sobre card nude) → nude-oscuro.
        crear("span", { class: "badge badge--descuento-calido" }, [`${descuento}% OFF`]),
    ])
  );

  // --- Variantes -------------------------------------------------------------
  const contVariantes = $("#producto-variantes");
  const botonesVariante = [];

  if (producto.tieneVariantes) {
    contVariantes.replaceChildren(
      crear("h2", { class: "producto__seccion-titulo" }, [
        "Color: ",
        crear("span", { id: "variante-nombre" }, [varianteElegida?.nombre ?? "elegí una opción"]),
      ]),
      crear(
        "div",
        { class: "producto__swatches", role: "group", "aria-label": "Elegir color" },
        producto.variantes.map((v) => {
          const btn = crear(
            "button",
            {
              class: `swatch${v === varianteElegida ? " swatch--activo" : ""}`,
              type: "button",
              style: `--color:${v.hex ?? "#ccc"}`,
              disabled: v.stock <= 0,
              "aria-pressed": String(v === varianteElegida),
              "aria-label": v.stock > 0 ? v.nombre : `${v.nombre} — sin stock`,
              onClick: () => {
                varianteElegida = v;
                cantidad = 1;
                botonesVariante.forEach((b) => {
                  const activo = b.dataset.nombre === v.nombre;
                  b.classList.toggle("swatch--activo", activo);
                  b.setAttribute("aria-pressed", String(activo));
                });
                $("#variante-nombre").textContent = v.nombre;
                actualizarStepper();
              },
            },
            []
          );
          btn.dataset.nombre = v.nombre;
          botonesVariante.push(btn);
          return btn;
        })
      )
    );
  } else {
    contVariantes.replaceChildren();
  }

  // --- Selector de cantidad + agregar -----------------------------------------
  const stockDisponible = () => (varianteElegida ? varianteElegida.stock : producto.stock);

  const valorCantidad = crear("span", { class: "cantidad__valor", "aria-live": "polite" }, ["1"]);
  const btnMenos = crear("button", {
    class: "cantidad__btn", type: "button", "aria-label": "Restar uno",
    onClick: () => { if (cantidad > 1) { cantidad--; actualizarStepper(); } },
  }, ["−"]);
  const btnMas = crear("button", {
    class: "cantidad__btn", type: "button", "aria-label": "Sumar uno",
    onClick: () => { if (cantidad < stockDisponible()) { cantidad++; actualizarStepper(); } },
  }, ["+"]);

  function actualizarStepper() {
    valorCantidad.textContent = String(cantidad);
    btnMas.disabled = cantidad >= stockDisponible();
    btnMenos.disabled = cantidad <= 1;
  }

  const btnAgregar = crear(
    "button",
    { class: "btn btn--primario btn--lg btn--bloque", type: "button" },
    ["Agregar al carrito"]
  );

  btnAgregar.addEventListener("click", () => {
    const r = carrito.agregar(producto, { variante: varianteElegida, cantidad });
    if (!r.ok) {
      toastError(r.motivo);
      return;
    }
    toastExito(`${producto.nombre} agregado al carrito`, {
      accion: { texto: "Ver carrito", alHacerClic: abrirDrawer },
    });
    cantidad = 1;
    actualizarStepper();
  });

  const sinStock = stockDisponible() <= 0;

  $("#producto-acciones").replaceChildren(
    crear("div", { class: "cantidad cantidad--grande", role: "group", "aria-label": "Cantidad" }, [
      btnMenos, valorCantidad, btnMas,
    ]),
    sinStock
      ? crear("p", { class: "producto__sin-stock" }, ["Sin stock por el momento"])
      : btnAgregar
  );

  actualizarStepper();

  // --- Especificaciones --------------------------------------------------
  // Element.replaceChildren() nativo, a diferencia del helper crear(), no
  // descarta valores falsy: convierte cualquier argumento que no sea un Node
  // a texto (false → "false"), así que acá hay que filtrar a mano.
  const specs = Object.entries(producto.especificaciones ?? {});
  $("#producto-specs").replaceChildren(
    ...[
      crear("h2", { class: "producto__seccion-titulo" }, ["Descripción"]),
      crear("p", { class: "producto__descripcion" }, [producto.descripcion]),
      specs.length > 0 &&
        crear("h2", { class: "producto__seccion-titulo", style: "margin-top:2rem" }, ["Especificaciones"]),
      specs.length > 0 &&
        crear(
          "dl",
          { class: "producto__tabla-specs" },
          specs.flatMap(([clave, valor]) => [
            crear("dt", {}, [clave]),
            crear("dd", {}, [String(valor)]),
          ])
        ),
    ].filter(Boolean)
  );

  // --- Relacionados --------------------------------------------------------
  const relacionados = await obtenerRelacionados(producto, 4);
  const seccionRelacionados = $("#producto-relacionados");

  if (relacionados.length) {
    const grilla = crear("div", { class: "grilla-productos" });
    renderizarGrilla(grilla, relacionados, { superficieClara: true });
    seccionRelacionados.replaceChildren(
      crear("h2", { class: "seccion__titulo", style: "margin-bottom:1.5rem" }, ["También te puede interesar"]),
      grilla
    );
  } else {
    seccionRelacionados.replaceChildren();
  }
}

// --- Metadatos ---------------------------------------------------------------

function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.append(tag);
  }
  tag.setAttribute("content", content);
}

function setMetaProp(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.append(tag);
  }
  tag.setAttribute("content", content);
}

/** JSON-LD Product, requerido por el brief §9. Se arma en runtime: una sola
 * producto.html sirve a los 15+ productos del catálogo. */
function inyectarJsonLd(producto) {
  const data = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: producto.nombre,
    description: producto.descripcion,
    brand: { "@type": "Brand", name: producto.marca },
    offers: {
      "@type": "Offer",
      price: producto.precio,
      priceCurrency: CONFIG.moneda,
      availability: producto.hayStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: window.location.href,
    },
  };

  let script = document.querySelector('script[type="application/ld+json"]');
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    document.head.append(script);
  }
  script.textContent = JSON.stringify(data);
}
