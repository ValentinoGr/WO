// ===========================================================================
// Estado del carrito
// ===========================================================================
// Fuente de verdad del carrito. Emite eventos para que la UI (contador del
// header, drawer, página de carrito) se actualice sola sin acoplarse a esto.
//
// Un item guarda solo lo mínimo para reconstruirse y mostrarse sin volver a
// pedir el catálogo: id, variante, cantidad y una foto del precio/nombre.
// El precio se revalida contra el JSON al abrir el carrito (ver sincronizar).

import { leerCarrito, guardarCarrito, borrarCarrito } from "./persistencia.js";
import { estadoEnvioGratis } from "../utils/formato.js";
import { cargarProductos } from "../data/productos.js";

let items = leerCarrito();

// --- Eventos ---------------------------------------------------------------
const objetivo = new EventTarget();
export const EVENTO_CARRITO = "carrito:cambio";

function emitir() {
  guardarCarrito(items);
  objetivo.dispatchEvent(
    new CustomEvent(EVENTO_CARRITO, { detail: { items: obtenerItems(), totales: totales() } })
  );
}

/** Suscribe a cambios del carrito. Devuelve la función para desuscribirse. */
export function alCambiar(callback) {
  objetivo.addEventListener(EVENTO_CARRITO, callback);
  return () => objetivo.removeEventListener(EVENTO_CARRITO, callback);
}

// --- Identidad de línea ----------------------------------------------------
// Dos unidades del mismo producto en distinto color son dos líneas distintas.
function claveLinea(productoId, varianteNombre) {
  return varianteNombre ? `${productoId}::${varianteNombre}` : productoId;
}

// --- Lectura ---------------------------------------------------------------

/** Copia defensiva: nadie muta el estado por fuera de este módulo. */
export function obtenerItems() {
  return items.map((i) => ({ ...i }));
}

export function estaVacio() {
  return items.length === 0;
}

/** Unidades totales, para el contador del header. */
export function cantidadTotal() {
  return items.reduce((t, i) => t + i.cantidad, 0);
}

export function subtotal() {
  return items.reduce((t, i) => t + i.precio * i.cantidad, 0);
}

/**
 * Totales del carrito.
 * `envio: null` = a coordinar. En Fase 1 no se calcula costo de envío real:
 * se acuerda por WhatsApp. La estructura ya contempla el campo para Fase 2.
 */
export function totales() {
  const sub = subtotal();
  const envio = estadoEnvioGratis(sub);

  return {
    subtotal: sub,
    cantidad: cantidadTotal(),
    envioGratis: envio.alcanzado,
    faltaParaEnvioGratis: envio.faltan,
    progresoEnvioGratis: envio.progreso,
    textoEnvio: envio.texto,
    envio: envio.alcanzado ? 0 : null,   // null = a coordinar
    total: sub,
  };
}

// --- Escritura -------------------------------------------------------------

/**
 * Agrega un producto. Si la línea ya existe, suma cantidad.
 * @param {object} producto  producto normalizado del catálogo
 * @param {{variante?: object, cantidad?: number}} opciones
 * @returns {{ok: boolean, motivo?: string, item?: object}}
 */
export function agregar(producto, { variante = null, cantidad = 1 } = {}) {
  if (!producto?.id) return { ok: false, motivo: "Producto inválido." };

  // Si el producto tiene variantes, elegir una no es opcional.
  if (producto.tieneVariantes && !variante) {
    return { ok: false, motivo: "Elegí un color antes de agregar al carrito." };
  }

  const stockDisponible = variante ? Number(variante.stock) || 0 : producto.stock;
  if (stockDisponible <= 0) {
    return { ok: false, motivo: "Este producto está sin stock." };
  }

  const clave = claveLinea(producto.id, variante?.nombre);
  const existente = items.find((i) => i.clave === clave);
  const cantidadActual = existente?.cantidad ?? 0;

  // No dejamos superar el stock: que el cliente pida 5 de algo que tiene 2
  // se resuelve mal por WhatsApp.
  if (cantidadActual + cantidad > stockDisponible) {
    const disponibles = stockDisponible - cantidadActual;
    return {
      ok: false,
      motivo:
        disponibles > 0
          ? `Solo quedan ${disponibles} unidades disponibles.`
          : "Ya tenés todo el stock disponible en el carrito.",
    };
  }

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    items.push({
      clave,
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: variante?.imagen ?? producto.imagenes[0] ?? null,
      variante: variante ? { nombre: variante.nombre, hex: variante.hex ?? null } : null,
      compatibilidad: producto.compatibilidad,
      stockMaximo: stockDisponible,
      cantidad,
    });
  }

  emitir();
  return { ok: true, item: items.find((i) => i.clave === clave) };
}

export function quitar(clave) {
  const antes = items.length;
  items = items.filter((i) => i.clave !== clave);
  if (items.length !== antes) emitir();
  return items.length !== antes;
}

/** Cambia la cantidad de una línea. Cantidad 0 o menos la elimina. */
export function actualizarCantidad(clave, cantidad) {
  const item = items.find((i) => i.clave === clave);
  if (!item) return { ok: false, motivo: "El producto no está en el carrito." };

  const nueva = Number(cantidad);
  if (!Number.isFinite(nueva) || nueva <= 0) {
    quitar(clave);
    return { ok: true, eliminado: true };
  }

  if (nueva > item.stockMaximo) {
    item.cantidad = item.stockMaximo;
    emitir();
    return { ok: false, motivo: `Solo hay ${item.stockMaximo} unidades disponibles.` };
  }

  item.cantidad = nueva;
  emitir();
  return { ok: true };
}

export function vaciar() {
  items = [];
  borrarCarrito();
  emitir();
}

/**
 * Revalida el carrito contra el catálogo actual.
 * El carrito vive en localStorage y puede tener días: mientras tanto los
 * precios cambian y los productos se dan de baja. Se llama al abrir el
 * carrito y antes de finalizar la compra, para no mandar por WhatsApp un
 * pedido con precios que ya no existen.
 *
 * @returns {Promise<{cambios: Array<{tipo: string, nombre: string}>}>}
 */
export async function sincronizar() {
  if (estaVacio()) return { cambios: [] };

  let catalogo;
  try {
    catalogo = await cargarProductos();
  } catch {
    // Sin catálogo no se puede validar; se deja el carrito como está.
    return { cambios: [] };
  }

  const cambios = [];
  const vigentes = [];

  for (const item of items) {
    const producto = catalogo.find((p) => p.id === item.id);

    if (!producto) {
      cambios.push({ tipo: "eliminado", nombre: item.nombre });
      continue;
    }

    if (producto.precio !== item.precio) {
      cambios.push({
        tipo: "precio",
        nombre: item.nombre,
        anterior: item.precio,
        actual: producto.precio,
      });
      item.precio = producto.precio;
    }

    // El stock de la variante puede haber cambiado.
    const stock = item.variante
      ? producto.variantes.find((v) => v.nombre === item.variante.nombre)?.stock ?? 0
      : producto.stock;

    if (stock <= 0) {
      cambios.push({ tipo: "sin-stock", nombre: item.nombre });
      continue;
    }

    item.stockMaximo = stock;
    if (item.cantidad > stock) {
      cambios.push({ tipo: "cantidad", nombre: item.nombre, actual: stock });
      item.cantidad = stock;
    }

    item.nombre = producto.nombre;
    vigentes.push(item);
  }

  items = vigentes;
  if (cambios.length) emitir();

  return { cambios };
}
