// ===========================================================================
// Card de producto
// ===========================================================================
// Se usa en el home (destacados, novedades), en el catálogo y en relacionados.
// Mientras no haya fotos, `.media` se renderiza como bloque de color con la
// relación de aspecto final: el layout no se mueve cuando lleguen las imágenes.

import { crear } from "../utils/dom.js";
import {
  precio,
  porcentajeDescuento,
  textoCompatibilidad,
} from "../utils/formato.js";

// Rota los fondos de los bloques vacíos para que una grilla sin fotos no sea
// un muro de un solo color. Se descarta solo cuando haya imágenes.
const FONDOS = ["media--nude", "media--beige", "media--gris"];

/**
 * Badges del producto, en orden de prioridad visual.
 *
 * El fondo del badge depende de la superficie: sobre una card $nude, un badge
 * $nude-oscuro tiene 2.95 de separación y se hunde. Ver CLAUDE.md §8.3.
 */
function construirBadges(producto, { superficieClara }) {
  const badges = [];
  const descuento = porcentajeDescuento(producto.precio, producto.precioAnterior);

  if (!producto.hayStock) {
    badges.push(crear("span", { class: "badge badge--sin-stock" }, ["Sin stock"]));
    return badges;   // si no hay stock, el resto de los badges sobra
  }

  if (descuento > 0) {
    badges.push(
      crear(
        "span",
        {
          class: superficieClara
            ? "badge badge--descuento-calido"
            : "badge badge--descuento",
        },
        [`${descuento}% OFF`]
      )
    );
  }

  if (producto.nuevo) {
    badges.push(crear("span", { class: "badge badge--nuevo" }, ["Nuevo"]));
  }

  if (producto.envioGratis) {
    badges.push(crear("span", { class: "badge badge--envio" }, ["Envío gratis"]));
  }

  return badges;
}

/** Puntitos de color de las variantes. Las agotadas se muestran tachadas. */
function construirVariantes(producto) {
  if (!producto.tieneVariantes) return null;

  const puntos = producto.variantes.map((v) =>
    crear("li", {
      class: `punto-color${v.stock <= 0 ? " punto-color--agotado" : ""}`,
      style: `--color: ${v.hex ?? "#ccc"}`,
      title: v.stock > 0 ? v.nombre : `${v.nombre} — sin stock`,
    })
  );

  return crear("ul", { class: "card-producto__colores", role: "list" }, [
    ...puntos,
    // El detalle de colores también tiene que existir como texto: los puntos
    // de color solos no le dicen nada a un lector de pantalla.
    crear("li", { class: "solo-lectores" }, [
      `Colores: ${producto.variantes
        .map((v) => `${v.nombre}${v.stock <= 0 ? " (sin stock)" : ""}`)
        .join(", ")}`,
    ]),
  ]);
}

/**
 * Crea la card de un producto.
 *
 * @param {object} producto  producto normalizado
 * @param {{indice?: number, superficieClara?: boolean}} opciones
 *        superficieClara: true si la card se apoya sobre fondo blanco.
 *        Cambia el color del badge de descuento. Ver CLAUDE.md §8.3.
 * @returns {HTMLElement} <article>
 */
export function crearCardProducto(producto, { indice = 0, superficieClara = false } = {}) {
  const descuento = porcentajeDescuento(producto.precio, producto.precioAnterior);
  const url = `producto.html?id=${encodeURIComponent(producto.id)}`;

  // --- Media -----------------------------------------------------------------
  const tieneFoto = producto.imagenes.length > 0;
  const media = crear("div", {
    class: `media media--producto ${FONDOS[indice % FONDOS.length]}`,
  });

  if (tieneFoto) {
    media.append(
      crear("img", {
        src: producto.imagenes[0],
        alt: producto.nombre,
        width: 1200,
        height: 1200,
        loading: "lazy",
        decoding: "async",
        // Todavía no hay fotos reales (las sube el cliente, ver README).
        // Si el archivo no existe, se saca el <img> en vez de dejar el ícono
        // de imagen rota: el bloque de color + marca de agua queda como estaba.
        onError: (e) => e.target.remove(),
      })
    );
  }

  const badges = construirBadges(producto, { superficieClara });
  if (badges.length) {
    media.append(crear("div", { class: "badges" }, badges));
  }

  // --- Precio ----------------------------------------------------------------
  const bloquePrecio = crear("div", { class: "card-producto__precios" }, [
    crear("span", { class: "card-producto__precio" }, [precio(producto.precio)]),
    // El precio anterior va en $gris-oscuro (regla de <s> en _tipografia.scss):
    // $nude-oscuro no pasa AA sobre card nude.
    descuento > 0 &&
      crear("s", { class: "card-producto__precio-anterior" }, [
        precio(producto.precioAnterior),
      ]),
  ]);

  // --- Card ------------------------------------------------------------------
  return crear(
    "article",
    {
      class: `card-producto${!producto.hayStock ? " card-producto--agotado" : ""}`,
      dataset: { id: producto.id, categoria: producto.categoria },
    },
    [
      crear("a", { class: "card-producto__link", href: url }, [
        media,
        crear("div", { class: "card-producto__cuerpo" }, [
          crear("p", { class: "card-producto__marca" }, [producto.marca]),
          crear("h3", { class: "card-producto__nombre" }, [producto.nombre]),
          crear("p", { class: "card-producto__compat" }, [
            textoCompatibilidad(producto.compatibilidad),
          ]),
          bloquePrecio,
          construirVariantes(producto),
        ]),
      ]),
    ]
  );
}

/** Renderiza una lista de productos dentro de un contenedor. */
export function renderizarGrilla(contenedor, productos, opciones = {}) {
  if (!contenedor) return;

  const fragmento = document.createDocumentFragment();
  productos.forEach((p, i) =>
    fragmento.append(crearCardProducto(p, { ...opciones, indice: i }))
  );

  contenedor.replaceChildren(fragmento);
}
