// ===========================================================================
// Toast — feedback breve de acciones
// ===========================================================================
// "Agregado al carrito", "Sin stock", etc.
// El mensaje se anuncia a lectores de pantalla vía aria-live: un toast que
// solo existe visualmente deja afuera a quien navega sin ver la pantalla.

import { crear, $ } from "../utils/dom.js";

const DURACION = 3200;
let contenedor = null;

function obtenerContenedor() {
  if (contenedor?.isConnected) return contenedor;

  contenedor = $("#toasts") ?? crear("div", {
    id: "toasts",
    class: "toasts",
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "false",
  });

  if (!contenedor.isConnected) document.body.append(contenedor);
  return contenedor;
}

const ICONOS = {
  exito: "M20 6 9 17l-5-5",
  error: "M18 6 6 18M6 6l12 12",
  info: "M12 16v-4M12 8h.01",
};

/**
 * Muestra un toast.
 * @param {string} mensaje
 * @param {{tipo?: "exito"|"error"|"info", accion?: {texto: string, alHacerClic: Function}}} opciones
 */
export function toast(mensaje, { tipo = "exito", accion = null } = {}) {
  const cont = obtenerContenedor();

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", ICONOS[tipo] ?? ICONOS.info);
  svg.append(path);

  const el = crear("div", { class: `toast toast--${tipo}` }, [
    crear("span", { class: "toast__icono" }, [svg]),
    crear("p", { class: "toast__texto" }, [mensaje]),
    accion &&
      crear(
        "button",
        {
          class: "toast__accion",
          type: "button",
          onClick: () => {
            accion.alHacerClic();
            cerrar(el);
          },
        },
        [accion.texto]
      ),
  ]);

  cont.append(el);

  // Fuerza un reflow para que la transición de entrada se dispare.
  void el.offsetWidth;
  el.classList.add("toast--visible");

  const temporizador = setTimeout(() => cerrar(el), DURACION);

  // Si el mouse está encima, no se cierra: el usuario lo está leyendo.
  el.addEventListener("mouseenter", () => clearTimeout(temporizador));
  el.addEventListener("mouseleave", () => setTimeout(() => cerrar(el), 1200));

  return el;
}

function cerrar(el) {
  if (!el?.isConnected) return;
  el.classList.remove("toast--visible");
  el.addEventListener("transitionend", () => el.remove(), { once: true });
  // Red de seguridad: si la transición no corre (reduced motion), se saca igual.
  setTimeout(() => el.remove(), 400);
}

export const toastExito = (m, o) => toast(m, { ...o, tipo: "exito" });
export const toastError = (m, o) => toast(m, { ...o, tipo: "error" });
