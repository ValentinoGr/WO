// ===========================================================================
// Utilidades de DOM
// ===========================================================================

/** querySelector con scope opcional. */
export const $ = (selector, scope = document) => scope.querySelector(selector);

/** querySelectorAll como array de verdad, no NodeList. */
export const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/**
 * Crea un elemento.
 * crear("button", { class: "btn", "aria-label": "Cerrar" }, ["Cerrar"])
 *
 * Los hijos string se insertan como texto, NUNCA como HTML: los nombres de
 * producto salen de un JSON editado a mano y no queremos que una comilla
 * rompa la página.
 */
export function crear(etiqueta, atributos = {}, hijos = []) {
  const el = document.createElement(etiqueta);

  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor == null || valor === false) continue;

    if (clave === "class") {
      el.className = valor;
    } else if (clave === "dataset") {
      Object.assign(el.dataset, valor);
    } else if (clave.startsWith("on") && typeof valor === "function") {
      el.addEventListener(clave.slice(2).toLowerCase(), valor);
    } else if (valor === true) {
      el.setAttribute(clave, "");
    } else {
      el.setAttribute(clave, valor);
    }
  }

  for (const hijo of [].concat(hijos)) {
    if (hijo == null || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }

  return el;
}

/** Vacía un contenedor. Más rápido y seguro que innerHTML = "". */
export function vaciar(el) {
  if (el) el.replaceChildren();
  return el;
}

/** Delegación de eventos: un solo listener para una lista que se re-renderiza. */
export function delegar(contenedor, evento, selector, manejador) {
  const listener = (e) => {
    const objetivo = e.target.closest(selector);
    if (objetivo && contenedor.contains(objetivo)) manejador(e, objetivo);
  };
  contenedor.addEventListener(evento, listener);
  return () => contenedor.removeEventListener(evento, listener);
}

/** Agrupa llamadas seguidas. Para el input de búsqueda. */
export function debounce(fn, ms = 250) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

/** Limita la frecuencia. Para scroll y resize. */
export function throttle(fn, ms = 100) {
  let esperando = false;
  let ultimosArgs = null;

  return (...args) => {
    if (esperando) {
      ultimosArgs = args;
      return;
    }
    fn(...args);
    esperando = true;
    setTimeout(() => {
      esperando = false;
      if (ultimosArgs) {
        fn(...ultimosArgs);
        ultimosArgs = null;
      }
    }, ms);
  };
}

// --- Querystring -----------------------------------------------------------
// Los filtros del catálogo viven en la URL: así el back del navegador
// funciona y los links son compartibles.

export function leerParametros() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

export function leerParametro(clave, porDefecto = null) {
  return new URLSearchParams(window.location.search).get(clave) ?? porDefecto;
}

/**
 * Escribe parámetros en la URL sin recargar.
 * Los valores null/"" se eliminan, para no dejar `?categoria=&marca=` colgando.
 */
export function escribirParametros(params, { reemplazar = true } = {}) {
  const url = new URL(window.location.href);

  for (const [clave, valor] of Object.entries(params)) {
    if (valor == null || valor === "" || (Array.isArray(valor) && !valor.length)) {
      url.searchParams.delete(clave);
    } else {
      url.searchParams.set(clave, Array.isArray(valor) ? valor.join(",") : valor);
    }
  }

  const metodo = reemplazar ? "replaceState" : "pushState";
  window.history[metodo]({}, "", url);
}

// --- Accesibilidad ---------------------------------------------------------

/**
 * Atrapa el foco dentro de un elemento (drawer del carrito, modales).
 * Devuelve la función para liberarlo.
 */
export function atraparFoco(contenedor) {
  const focusables =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const previo = document.activeElement;

  const alPresionar = (e) => {
    if (e.key !== "Tab") return;

    const elementos = $$(focusables, contenedor).filter(
      (el) => el.offsetParent !== null
    );
    if (!elementos.length) return;

    const primero = elementos[0];
    const ultimo = elementos[elementos.length - 1];

    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };

  contenedor.addEventListener("keydown", alPresionar);

  return () => {
    contenedor.removeEventListener("keydown", alPresionar);
    previo?.focus?.();   // el foco vuelve a donde estaba
  };
}

/** Anuncia un mensaje a los lectores de pantalla sin mostrarlo en pantalla. */
export function anunciar(mensaje) {
  let region = $("#anuncios-lector");

  if (!region) {
    region = crear("div", {
      id: "anuncios-lector",
      class: "solo-lectores",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    });
    document.body.append(region);
  }

  // El cambio de contenido tiene que ser detectable: si el texto es idéntico
  // al anterior, algunos lectores no lo repiten.
  region.textContent = "";
  setTimeout(() => { region.textContent = mensaje; }, 50);
}

/** Bloquea el scroll del body sin que la página salte al desaparecer la barra. */
export function bloquearScroll(bloquear = true) {
  const body = document.body;

  if (bloquear) {
    const ancho = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (ancho > 0) body.style.paddingRight = `${ancho}px`;
  } else {
    body.style.overflow = "";
    body.style.paddingRight = "";
  }
}
