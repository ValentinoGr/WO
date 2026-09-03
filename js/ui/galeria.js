// ===========================================================================
// Galería de producto
// ===========================================================================
// Imagen principal + miniaturas. Sin fotos reales todavía: cada imagen que
// falla se saca del DOM y queda el bloque de color con la marca de agua
// (ver scss/components/_media.scss).

import { crear, $$ } from "../utils/dom.js";

const FONDOS = ["media--nude", "media--beige", "media--gris"];

/**
 * Monta la galería dentro de un contenedor.
 * @param {HTMLElement} contenedor
 * @param {object} producto  producto normalizado
 */
export function montarGaleria(contenedor, producto) {
  if (!contenedor) return;

  // Sin imágenes declaradas: un solo bloque de color, sin miniaturas.
  const imagenes = producto.imagenes.length ? producto.imagenes : [null];
  let indice = 0;

  const principal = crear("div", {
    class: `galeria__principal media media--producto ${FONDOS[0]}`,
  });

  const botonesMiniatura = [];

  function pintarPrincipal() {
    principal.replaceChildren();
    const src = imagenes[indice];

    if (src) {
      principal.append(
        crear("img", {
          src,
          alt: producto.nombre,
          width: 1200,
          height: 1200,
          decoding: "async",
          onError: (e) => e.target.remove(),
        })
      );
    }

    botonesMiniatura.forEach((btn, i) => {
      const activa = i === indice;
      btn.classList.toggle("galeria__miniatura--activa", activa);
      btn.setAttribute("aria-selected", String(activa));
      btn.tabIndex = activa ? 0 : -1;
    });
  }

  function seleccionar(i) {
    indice = ((i % imagenes.length) + imagenes.length) % imagenes.length;
    pintarPrincipal();
    botonesMiniatura[indice]?.focus();
  }

  let miniaturas = null;

  if (imagenes.length > 1) {
    miniaturas = crear("div", {
      class: "galeria__miniaturas",
      role: "tablist",
      "aria-label": `Imágenes de ${producto.nombre}`,
      onKeydown: (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); seleccionar(indice + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); seleccionar(indice - 1); }
      },
    });

    imagenes.forEach((src, i) => {
      const miniatura = crear(
        "button",
        {
          class: `galeria__miniatura media media--producto ${FONDOS[i % FONDOS.length]}`,
          type: "button",
          role: "tab",
          "aria-selected": "false",
          "aria-label": `Imagen ${i + 1} de ${imagenes.length}`,
          tabIndex: -1,
          onClick: () => seleccionar(i),
        },
        [
          src &&
            crear("img", {
              src,
              alt: "",
              width: 200,
              height: 200,
              loading: "lazy",
              onError: (e) => e.target.remove(),
            }),
        ]
      );
      botonesMiniatura.push(miniatura);
      miniaturas.append(miniatura);
    });
  }

  pintarPrincipal();

  contenedor.replaceChildren(
    crear("div", { class: "galeria" }, [principal, miniaturas])
  );
}
