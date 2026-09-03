// ===========================================================================
// Capa de datos — carga, cachea y normaliza el catálogo
// ===========================================================================
// Única puerta de entrada a productos.json. Ningún módulo hace fetch por su
// cuenta ni asume que el JSON viene bien formado.

import { CONFIG } from "../config.js";
import { normalizarTexto } from "../utils/formato.js";

let cache = null;
let promesaEnVuelo = null;   // evita fetch duplicado si dos módulos piden a la vez

/** Error tipado, para que la UI distinga "falló la red" de un bug. */
export class ErrorCatalogo extends Error {
  constructor(mensaje, causa) {
    super(mensaje);
    this.name = "ErrorCatalogo";
    this.causa = causa;
  }
}

/**
 * Rellena campos faltantes y deriva los calculados.
 * El JSON se edita a mano: hay que asumir que en algún momento va a faltar
 * una coma o un campo. Preferimos un producto con defaults antes que una
 * página en blanco.
 */
function normalizar(crudo) {
  const variantes = Array.isArray(crudo.variantes) ? crudo.variantes : [];
  const compatibilidad = Array.isArray(crudo.compatibilidad) ? crudo.compatibilidad : [];

  // Si hay variantes, el stock real es la suma: el campo `stock` de nivel
  // producto puede quedar desactualizado al editar variantes a mano.
  const stockCalculado = variantes.length
    ? variantes.reduce((t, v) => t + (Number(v.stock) || 0), 0)
    : Number(crudo.stock) || 0;

  return {
    id: String(crudo.id ?? ""),
    slug: String(crudo.slug ?? crudo.id ?? ""),
    nombre: String(crudo.nombre ?? "Producto sin nombre"),
    marca: String(crudo.marca ?? "Generico"),
    categoria: String(crudo.categoria ?? ""),
    subcategoria: String(crudo.subcategoria ?? ""),
    precio: Number(crudo.precio) || 0,
    precioAnterior: crudo.precioAnterior != null ? Number(crudo.precioAnterior) : null,
    compatibilidad,
    descripcion: String(crudo.descripcion ?? ""),
    especificaciones: crudo.especificaciones ?? {},
    variantes,
    imagenes: Array.isArray(crudo.imagenes) ? crudo.imagenes : [],
    stock: stockCalculado,
    destacado: Boolean(crudo.destacado),
    nuevo: Boolean(crudo.nuevo),
    envioGratis: Boolean(crudo.envioGratis),
    activo: crudo.activo !== false,   // ausente = activo

    // --- Derivados ---
    esUniversal: compatibilidad.length === 0,
    hayStock: stockCalculado > 0,
    tieneVariantes: variantes.length > 0,
    // Índice de búsqueda precalculado: buscar recorriendo campos en cada
    // tecleo es caro; esto se arma una sola vez al cargar.
    _busqueda: normalizarTexto(
      [crudo.nombre, crudo.marca, crudo.categoria, crudo.subcategoria,
       ...compatibilidad].join(" ")
    ),
  };
}

/**
 * Carga el catálogo. Cachea en memoria: llamarla N veces hace 1 solo fetch.
 * @param {{forzar?: boolean}} opciones
 * @returns {Promise<Array>} solo productos con activo:true
 * @throws {ErrorCatalogo}
 */
export async function cargarProductos({ forzar = false } = {}) {
  if (cache && !forzar) return cache;
  if (promesaEnVuelo && !forzar) return promesaEnVuelo;

  promesaEnVuelo = (async () => {
    let respuesta;
    try {
      respuesta = await fetch(CONFIG.rutaProductos, { cache: "no-cache" });
    } catch (causa) {
      // Típicamente: abrir el sitio con file:// en vez de un servidor.
      throw new ErrorCatalogo(
        "No se pudo conectar para cargar el catálogo. Revisá tu conexión.",
        causa
      );
    }

    if (!respuesta.ok) {
      throw new ErrorCatalogo(
        `No se pudo cargar el catálogo (HTTP ${respuesta.status}).`
      );
    }

    let crudo;
    try {
      crudo = await respuesta.json();
    } catch (causa) {
      throw new ErrorCatalogo(
        "El catálogo tiene un error de formato. Avisale al administrador.",
        causa
      );
    }

    if (!Array.isArray(crudo)) {
      throw new ErrorCatalogo("El catálogo no tiene el formato esperado.");
    }

    cache = crudo
      .map(normalizar)
      .filter((p) => p.activo && p.id);   // activo:false nunca se renderiza

    return cache;
  })();

  try {
    return await promesaEnVuelo;
  } finally {
    promesaEnVuelo = null;
  }
}

/** Un producto por id. `null` si no existe o está dado de baja. */
export async function obtenerProducto(id) {
  if (!id) return null;
  const productos = await cargarProductos();
  return productos.find((p) => p.id === id) ?? null;
}

export async function obtenerDestacados(limite = 8) {
  const productos = await cargarProductos();
  return productos.filter((p) => p.destacado).slice(0, limite);
}

export async function obtenerNovedades(limite = 8) {
  const productos = await cargarProductos();
  return productos.filter((p) => p.nuevo).slice(0, limite);
}

/**
 * Productos compatibles con un modelo de iPhone.
 * Los universales (compatibilidad: []) entran en TODOS los resultados:
 * un cargador sirve para cualquier modelo. Regla del brief §4.
 */
export async function obtenerPorModelo(modelo) {
  const productos = await cargarProductos();
  if (!modelo) return productos;
  return productos.filter(
    (p) => p.esUniversal || p.compatibilidad.includes(modelo)
  );
}

export async function obtenerPorCategoria(categoria) {
  const productos = await cargarProductos();
  if (!categoria) return productos;
  return productos.filter((p) => p.categoria === categoria);
}

/**
 * Relacionados para la página de producto: misma categoría primero,
 * completando con compatibles del mismo modelo si no alcanzan.
 */
export async function obtenerRelacionados(producto, limite = 4) {
  if (!producto) return [];
  const productos = await cargarProductos();
  const otros = productos.filter((p) => p.id !== producto.id && p.hayStock);

  const mismaCategoria = otros.filter((p) => p.categoria === producto.categoria);
  if (mismaCategoria.length >= limite) return mismaCategoria.slice(0, limite);

  const compatibles = otros.filter(
    (p) =>
      !mismaCategoria.includes(p) &&
      (p.esUniversal ||
        p.compatibilidad.some((m) => producto.compatibilidad.includes(m)))
  );

  return [...mismaCategoria, ...compatibles].slice(0, limite);
}

/** Marcas presentes en el catálogo, ordenadas. Alimenta el filtro por marca. */
export async function obtenerMarcas() {
  const productos = await cargarProductos();
  return [...new Set(productos.map((p) => p.marca))].sort((a, b) =>
    a.localeCompare(b, CONFIG.locale)
  );
}

/** Rango de precios real del catálogo, para los extremos del slider. */
export async function obtenerRangoPrecios() {
  const productos = await cargarProductos();
  if (!productos.length) return { min: 0, max: 0 };
  const precios = productos.map((p) => p.precio);
  return { min: Math.min(...precios), max: Math.max(...precios) };
}

/** Solo para tests y para el refresco manual del catálogo. */
export function limpiarCache() {
  cache = null;
  promesaEnVuelo = null;
}
