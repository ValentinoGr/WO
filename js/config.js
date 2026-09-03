// ===========================================================================
// Configuración global
// ===========================================================================
// Único lugar donde se tocan datos de negocio. Ningún módulo hardcodea
// números de teléfono, montos ni modelos de iPhone.

export const CONFIG = {
  // --- Negocio -------------------------------------------------------------
  nombre: "Wo!",
  descripcion: "Accesorios para iPhone en Rafaela, Santa Fe. Envíos a todo el país.",

  // Formato wa.me: código de país (54) + 9 (celular AR, lo pide WhatsApp
  // aunque ya no haga falta para llamar) + área sin 0 + número sin 15.
  // +54 3492 606377 → "5493492606377"
  whatsapp: "5493492606377",

  email: "hola@wo.com.ar",
  direccion: "Rafaela, Santa Fe",
  horarios: "Lunes a viernes de 9 a 13 y de 16:30 a 20:30 · Sábados de 9 a 13",

  redes: {
    instagram: "https://www.instagram.com/wo.electronics/",
  },

  // --- Formato -------------------------------------------------------------
  moneda: "ARS",
  locale: "es-AR",

  // --- Checkout ------------------------------------------------------------
  // "whatsapp" (Fase 1) | "mercadopago" (Fase 2).
  // Cambiar este flag es TODO lo que hace falta para pasar de fase,
  // junto con implementar checkout/mercadopago.js.
  metodoCheckout: "whatsapp",

  // --- Envíos y pagos ------------------------------------------------------
  envioGratisDesde: 50000,
  cuotasSinInteres: [3, 6],

  // --- Catálogo ------------------------------------------------------------
  rutaProductos: "data/productos.json",

  // Orden = orden de aparición en el selector del home. Más nuevos primero.
  modelosIphone: [
    "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17",
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone XR", "iPhone XS Max", "iPhone XS", "iPhone X",
    "iPhone SE (2022)", "iPhone SE (2020)",
  ],

  // Las claves tienen que coincidir con el campo `categoria` del JSON.
  // Agregar una categoría nueva = agregar una entrada acá y productos al JSON.
  categorias: [
    { id: "fundas",      nombre: "Fundas",                 icono: "funda" },
    { id: "cargadores",  nombre: "Cargadores",             icono: "cargador" },
    { id: "powerbanks",  nombre: "Power banks",            icono: "bateria" },
    { id: "protectores", nombre: "Protectores de pantalla", icono: "escudo" },
    { id: "cables",      nombre: "Cables",                 icono: "cable" },
    { id: "parlantes",   nombre: "Parlantes",              icono: "parlante" },
    { id: "auriculares", nombre: "Auriculares",            icono: "auricular" },
  ],

  // --- Persistencia --------------------------------------------------------
  // Subir la versión invalida los carritos guardados con un schema viejo.
  // Ver carrito/persistencia.js
  storage: {
    claveCarrito: "wo.carrito",
    claveModelo: "wo.modelo-elegido",
    version: 1,
  },
};

// Congelado: un bug que mute la config sería muy difícil de rastrear.
Object.freeze(CONFIG);
Object.freeze(CONFIG.storage);
Object.freeze(CONFIG.redes);
