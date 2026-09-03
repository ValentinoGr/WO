// ===========================================================================
// Selector "¿Qué iPhone tenés?"
// ===========================================================================
// La funcionalidad más importante del sitio (brief §1): el cliente entra
// sabiendo qué iPhone tiene, no qué producto quiere.
//
// El modelo elegido se guarda en localStorage y se recuerda entre visitas:
// volver a elegirlo en cada entrada sería molesto.

import { CONFIG } from "../config.js";
import { crear, $ } from "../utils/dom.js";
import { leerModeloElegido, guardarModeloElegido } from "../carrito/persistencia.js";

/**
 * Agrupa los modelos por generación para no mostrar una lista de 32 items.
 * Exportada porque los filtros del catálogo (tienda.html) reusan la misma
 * agrupación en su <select> de modelo.
 */
export function agruparModelos() {
  const grupos = new Map();

  for (const modelo of CONFIG.modelosIphone) {
    // "iPhone 15 Pro Max" → "iPhone 15" · "iPhone XR" → "iPhone X"
    // "iPhone SE (2022)"  → "iPhone SE"
    const match = modelo.match(/^iPhone (SE|\d+|X)/);
    const clave = match ? `iPhone ${match[1]}` : "Otros";

    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(modelo);
  }

  return grupos;
}

/**
 * Monta el selector.
 *
 * @param {HTMLElement} contenedor
 * @param {{alElegir?: Function, modeloActual?: string, navegar?: boolean}} opciones
 *        navegar: si true (home), al elegir va a tienda.html?modelo=...
 *                 si false (catálogo), solo notifica vía alElegir.
 */
export function montarSelectorModelo(contenedor, {
  alElegir = null,
  modeloActual = null,
  navegar = true,
} = {}) {
  if (!contenedor) return;

  const elegido = modeloActual ?? leerModeloElegido();
  const grupos = agruparModelos();

  // --- <select> nativo -------------------------------------------------------
  // A propósito nativo y no un dropdown custom: en mobile abre el picker del
  // sistema, que es más rápido de usar y accesible sin trabajo extra.
  const select = crear("select", {
    class: "selector-modelo__select",
    id: "select-modelo",
    name: "modelo",
    "aria-label": "Elegí tu modelo de iPhone",
  }, [
    crear("option", { value: "" }, ["Elegí tu modelo…"]),
    ...[...grupos.entries()].map(([nombreGrupo, modelos]) =>
      crear("optgroup", { label: nombreGrupo },
        modelos.map((m) =>
          crear("option", { value: m, selected: m === elegido }, [m])
        )
      )
    ),
  ]);

  const boton = crear("button", {
    class: "btn btn--primario selector-modelo__btn",
    type: "submit",
  }, ["Ver accesorios"]);

  const form = crear("form", {
    class: "selector-modelo__form",
    action: "tienda.html",
    method: "get",
  }, [
    crear("label", { class: "solo-lectores", for: "select-modelo" },
      ["Elegí tu modelo de iPhone"]),
    select,
    boton,
  ]);

  form.addEventListener("submit", (e) => {
    const modelo = select.value;

    if (!modelo) {
      e.preventDefault();
      select.focus();
      return;
    }

    guardarModeloElegido(modelo);

    if (!navegar) {
      e.preventDefault();
      alElegir?.(modelo);
    }
    // Si navega, el submit natural lleva a tienda.html?modelo=... — sin JS.
  });

  // Guardar apenas cambia, aunque no llegue a enviar el form.
  select.addEventListener("change", () => {
    if (select.value) guardarModeloElegido(select.value);
    if (!navegar) alElegir?.(select.value);
  });

  contenedor.replaceChildren(form);

  // Si ya había un modelo guardado, se avisa y se ofrece limpiarlo.
  if (elegido && navegar) {
    contenedor.append(
      crear("p", { class: "selector-modelo__recordado" }, [
        "Guardamos tu modelo: ",
        crear("strong", {}, [elegido]),
        ". ",
        crear("button", {
          class: "selector-modelo__limpiar",
          type: "button",
          onClick: () => {
            guardarModeloElegido(null);
            montarSelectorModelo(contenedor, { alElegir, navegar });
          },
        }, ["Cambiar"]),
      ])
    );
  }

  return { select, form };
}
