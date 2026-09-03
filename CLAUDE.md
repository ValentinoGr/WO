# Wo! — Brief de proyecto

Tienda online de accesorios para iPhone. Este archivo es la fuente de verdad del proyecto: leelo antes de escribir código.

---

## 1. Negocio

**Wo!** vende accesorios para iPhone. Catálogo inicial:

- Fundas
- Cargadores (de pared, auto)
- Cargadores portátiles / power banks
- Protectores de pantalla (vidrio templado, hidrogel)
- Cables (Lightning, USB-C)
- Parlantes JBL
- Auriculares
- *Más categorías próximamente* → el catálogo tiene que crecer sin refactor.

**Diferencial clave:** el cliente entra sabiendo qué iPhone tiene, no qué producto quiere. El filtro por **modelo de iPhone** es la funcionalidad más importante del sitio, no un extra. Tiene que estar visible desde el home.

**Público:** venta local (Rafaela, Santa Fe) + envíos a todo el país.

---

## 2. Alcance por fases

### Fase 1 — MVP (arrancar acá)
Catálogo navegable + carrito funcional + pedido enviado por WhatsApp con el detalle prearmado.

### Fase 2 — Pago automatizado
Checkout con Mercado Pago (Checkout Pro) contra backend en Python. **No implementar todavía**, pero la arquitectura de la Fase 1 tiene que dejarlo listo para enchufar (ver sección 6).

### Fase 3 — Más adelante
Panel de administración, control de stock real, cupones, seguimiento de pedidos.

**Regla:** no adelantar trabajo de Fase 3. Sí dejar los ganchos de Fase 2.

---

## 3. Stack

**Frontend**
- HTML5 semántico
- SASS (arquitectura por carpetas: `abstracts/`, `base/`, `components/`, `layout/`, `pages/`)
- JavaScript vanilla con ES Modules (`type="module"`), sin framework, sin build step complejo
- Sin Bootstrap: layout propio con CSS Grid y Flexbox

**Datos**
- `data/productos.json` — se edita a mano, sin CMS ni base de datos en Fase 1
- El JSON es la única fuente de productos. Nada de datos hardcodeados en el HTML.

**Backend (Fase 2, no ahora)**
- Python con FastAPI
- Endpoints: `POST /api/crear-preferencia`, `POST /api/webhook`
- SDK oficial de Mercado Pago

**Hosting**
- Front: Hostinger (o GitHub Pages en desarrollo)
- Back: Render o Railway (GitHub Pages no corre Python)

---

## 4. Modelo de datos

`data/productos.json` es un array de objetos con esta forma. Respetar los nombres de campo exactos:

```json
[
  {
    "id": "funda-silicona-magsafe-15pro",
    "slug": "funda-silicona-magsafe-iphone-15-pro",
    "nombre": "Funda de Silicona con MagSafe",
    "marca": "Generico",
    "categoria": "fundas",
    "subcategoria": "silicona",
    "precio": 18500,
    "precioAnterior": 22000,
    "compatibilidad": ["iPhone 15 Pro", "iPhone 15 Pro Max"],
    "descripcion": "Funda de silicona líquida con interior de microfibra y anillo MagSafe integrado.",
    "especificaciones": {
      "Material": "Silicona líquida",
      "MagSafe": "Sí",
      "Protección de cámara": "Sí"
    },
    "variantes": [
      { "tipo": "color", "nombre": "Negro", "hex": "#1d1d1f", "stock": 5, "imagen": "assets/img/productos/funda-15pro-negro.webp" },
      { "tipo": "color", "nombre": "Azul", "hex": "#2f5d9e", "stock": 0, "imagen": "assets/img/productos/funda-15pro-azul.webp" }
    ],
    "imagenes": [
      "assets/img/productos/funda-15pro-negro.webp",
      "assets/img/productos/funda-15pro-detalle.webp"
    ],
    "stock": 5,
    "destacado": true,
    "nuevo": false,
    "envioGratis": false,
    "activo": true
  }
]
```

**Notas del modelo:**
- `compatibilidad`: array vacío `[]` para productos universales (parlantes JBL, power banks, auriculares). Si está vacío, el producto aparece en todos los filtros por modelo.
- `variantes`: array vacío si el producto no tiene variantes. Con `stock: 0` la variante se muestra deshabilitada, no se oculta.
- `precioAnterior`: `null` si no hay descuento. Si tiene valor, mostrar precio tachado y badge de % off calculado.
- `activo: false` → el producto no se renderiza. Sirve para dar de baja sin borrar la entrada.
- Los precios son enteros en pesos argentinos, sin decimales ni separadores.

Aparte, `data/config.json` o `js/config.js` con:

```js
export const CONFIG = {
  whatsapp: "5493492XXXXXX",
  moneda: "ARS",
  locale: "es-AR",
  metodoCheckout: "whatsapp",       // "whatsapp" | "mercadopago"
  envioGratisDesde: 50000,
  cuotasSinInteres: [3, 6],
  modelosIphone: [
    "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17",
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone XR", "iPhone XS Max", "iPhone XS", "iPhone X",
    "iPhone SE (2022)", "iPhone SE (2020)"
  ]
};
```

---

## 5. Páginas

| Página | Archivo | Contenido |
|---|---|---|
| Home | `index.html` | Hero, selector "¿Qué iPhone tenés?", grid de categorías, destacados, novedades, franja de beneficios (envíos / cuotas / garantía) |
| Catálogo | `tienda.html` | Grid de productos + panel de filtros + orden + búsqueda |
| Producto | `producto.html?id=...` | Galería, selector de variantes, precio y cuotas, compatibilidad, especificaciones, agregar al carrito, relacionados |
| Carrito | `carrito.html` | Items editables, subtotal, envío, total, botón finalizar |
| Contacto | `contacto.html` | Formulario, WhatsApp, dirección/mapa, horarios, redes |
| FAQ | `faq.html` | Envíos, garantía, cambios, métodos de pago |

**Header global:** logo Wo!, nav de categorías, buscador, ícono de carrito con contador. Sticky.
**Footer global:** categorías, links, redes, medios de pago, datos fiscales.
**Botón flotante de WhatsApp** en todas las páginas.

El carrito puede ser página propia y además drawer lateral que se abre al agregar un producto.

---

## 6. Arquitectura JS

```
js/
├── config.js
├── main.js
├── data/
│   └── productos.js          # fetch + cache + normalización
├── carrito/
│   ├── estado.js             # add, remove, updateCantidad, totales
│   └── persistencia.js       # localStorage, versionado del schema
├── checkout/
│   ├── index.js              # finalizarCompra(carrito, datosCliente)
│   ├── whatsapp.js           # implementación Fase 1
│   └── mercadopago.js        # stub Fase 2
├── filtros/
│   ├── estado.js             # filtros activos, sincronizados con querystring
│   └── aplicar.js
├── ui/
│   ├── header.js
│   ├── cardProducto.js
│   ├── drawerCarrito.js
│   ├── galeria.js
│   └── toast.js
└── utils/
    ├── formato.js            # Intl.NumberFormat es-AR, cálculo de cuotas
    └── dom.js
```

### Lo más importante: capa de checkout abstraída

`checkout/index.js` expone una única función. El resto del código nunca sabe cómo se paga:

```js
import { CONFIG } from "../config.js";
import { checkoutWhatsapp } from "./whatsapp.js";
import { checkoutMercadoPago } from "./mercadopago.js";

const IMPLEMENTACIONES = {
  whatsapp: checkoutWhatsapp,
  mercadopago: checkoutMercadoPago
};

export async function finalizarCompra(carrito, datosCliente = {}) {
  const impl = IMPLEMENTACIONES[CONFIG.metodoCheckout];
  if (!impl) throw new Error(`Método de checkout no soportado: ${CONFIG.metodoCheckout}`);
  return impl(carrito, datosCliente);
}
```

`whatsapp.js` arma un mensaje legible con el detalle del pedido y abre `https://wa.me/<numero>?text=<mensaje encodeado>`.

`mercadopago.js` queda como stub que lanza `Error("Pendiente Fase 2")`. Su firma tiene que ser idéntica.

**Al pasar a Fase 2 solo se toca `mercadopago.js` y el flag `metodoCheckout` en config. Nada más.**

---

## 7. Detalles para Argentina

- Precios formateados con `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })` → `$ 18.500`
- Mostrar cuotas debajo del precio: `3 cuotas sin interés de $ 6.167`
- Envío: Correo Argentino, Andreani, retiro en local, envío gratis en Rafaela desde cierto monto
- Barra de envío gratis en el carrito: "Te faltan $ 12.400 para el envío gratis"
- WhatsApp con mensaje prellenado, formato del pedido:

```
¡Hola Wo!! Quiero hacer este pedido:

• Funda de Silicona MagSafe (iPhone 15 Pro) — Negro
  2 x $ 18.500 = $ 37.000

• Cargador 20W USB-C
  1 x $ 12.000 = $ 12.000

Subtotal: $ 49.000
Envío: a coordinar
Total: $ 49.000
```

---

## 8. Diseño

**Dirección:** limpio y premium, cercano al lenguaje visual de Apple (mucho blanco, aire generoso, tipografía sin serif, producto fotografiado sobre fondo neutro) pero **con identidad propia**. La identidad no viene de un color de acento sino de la paleta cálida en neutros: negros, grises, beige y nude.

- Mobile first. Se compra desde el celular.
- Tipografía: system font stack o Inter / Plus Jakarta Sans
- Grid de productos: 2 columnas en mobile, 3-4 en desktop
- Cards con hover sutil, imagen cuadrada, badge de "Nuevo" / "% OFF"
- Micro-interacciones: agregar al carrito con feedback visual (toast + contador animado)
- Modo oscuro: no en Fase 1

### 8.1 Paleta

Definida por el cliente. **No hay color de acento cromático.**
Implementada en `scss/abstracts/_variables.scss`.

**Acción** — botones, links, elementos activos

| Token | Hex | Uso |
|---|---|---|
| `$negro` | `#111111` | Botones, texto principal, iconos activos |
| `$negro-hover` | `#2E2E2E` | Hover de botones |

**Texto y jerarquía**

| Token | Hex | Uso |
|---|---|---|
| `$gris-oscuro` | `#4A4A4A` | Texto secundario |
| `$gris-medio` | `#8A8A8A` | Solo bordes de controles y texto deshabilitado. **NO texto normal** |
| `$gris-claro` | `#E5E3E0` | Separadores y bordes decorativos |

**Superficies**

| Token | Hex | Uso |
|---|---|---|
| `$blanco` | `#FFFFFF` | Fondo base |
| `$beige` | `#EFEAE3` | Fondo de secciones alternadas |
| `$nude` | `#D9C5B4` | Fondos de card, franjas destacadas |

**Acento cálido**

| Token | Hex | Uso |
|---|---|---|
| `$nude-oscuro` | `#8A6A52` | Fondo de badge con texto blanco · texto sobre blanco puro |
| `$marron` | `#5F4938` | Texto cálido sobre cualquier superficie clara |

### 8.2 Contraste — verificado contra WCAG AA

Ratios reales medidos. **Antes de usar una combinación que no esté en esta tabla, verificala.**

| Texto \ Fondo | `$blanco` | `$beige` | `$nude` | `$negro` |
|---|---|---|---|---|
| `$negro` | 18.88 ✅ | 15.78 ✅ | 11.33 ✅ | — |
| `$gris-oscuro` | 8.86 ✅ | 7.41 ✅ | 5.32 ✅ | — |
| `$gris-medio` | 3.45 ❌ | 2.88 ❌ | 2.07 ❌ | 5.47 ✅ |
| `$nude-oscuro` | 4.92 ✅ | 4.12 ❌ | 2.95 ❌ | — |
| `$marron` | 8.41 ✅ | 7.03 ✅ | 5.05 ✅ | — |
| `$blanco` | — | — | — | 18.88 ✅ |

Blanco sobre `$nude-oscuro` → **4.92 ✅** · Blanco sobre `$marron` → **8.41 ✅**

### 8.3 Reglas de uso

Estas reglas resuelven los tres casos donde la paleta no cierra sola:

1. **`$nude-oscuro` no es un color de texto de uso general.** Pasa AA solo sobre blanco puro (4.92). Sobre `$beige` da 4.12 y sobre `$nude` da 2.95: en ambos falla. Para texto cálido sobre esas superficies va `$marron`.

2. **Badges: siempre texto blanco sobre fondo oscuro. Cuál fondo depende de la superficie:**
   - Sobre `$blanco` → fondo `$nude-oscuro`
   - Sobre `$nude` o `$beige` → fondo **`$negro`**. Un badge `$nude-oscuro` sobre una card `$nude` tiene apenas 2.95 de separación contra el fondo: se hunde y deja de leerse como badge.
   - **Nunca** un badge con fondo `$nude` o `$beige`: no se despega de la card.

3. **`$precio anterior` tachado va en `$gris-oscuro`**, no en `$nude-oscuro`. Las cards son `$nude` y ahí el nude-oscuro no pasa AA.

4. **Bordes:** `$gris-claro` (1.28 sobre blanco) sirve para separadores decorativos. Los **controles de formulario** — inputs, selects, checkbox — necesitan 3:1 según WCAG 1.4.11, así que su borde va en `$gris-medio` (3.45).

5. **`$gris-medio` nunca como texto sobre fondo claro.** Solo bordes de control y texto deshabilitado (que está exento de contraste).

---

## 9. Calidad

- Imágenes en `.webp`, `loading="lazy"`, `srcset`, dimensiones explícitas para evitar CLS
- Meta tags + Open Graph por página; JSON-LD `Product` en la página de producto
- Accesibilidad: HTML semántico, labels en los filtros, focus visible, contraste AA, navegable con teclado
- Objetivo Lighthouse: 90+ en todas las métricas
- Estados vacíos y de error resueltos: catálogo sin resultados, carrito vacío, fallo al cargar el JSON
- Sin dependencias de npm en Fase 1 más allá del compilador de SASS

---

## 10. Fuera de alcance por ahora

No implementar: login de usuarios, cupones de descuento, reviews de productos, wishlist, multi-idioma, multi-moneda, blog, panel de admin.

---

## 11. Primer entregable

1. Estructura de carpetas completa y `README.md` con instrucciones para correr el proyecto
2. `data/productos.json` con 12-15 productos de ejemplo que cubran los casos raros: producto con variantes de color, producto universal sin compatibilidad, producto con descuento, producto sin stock
3. Arquitectura SASS con variables, mixins y reset
4. Header y footer funcionando en todas las páginas
5. Home completo con el selector de modelo de iPhone operativo
6. Catálogo con filtros funcionando (categoría, modelo, marca, rango de precio) y orden
7. Página de producto renderizando desde el JSON según el querystring
8. Carrito completo con persistencia en localStorage
9. Checkout por WhatsApp funcionando end to end, detrás de la capa abstraída

Antes de escribir código, proponé el plan de implementación por pasos y esperá confirmación.

---

## 12. Estado del entregable

Los 9 puntos de la sección 11 están completos. Detalle de cada uno:

1. ✅ Estructura completa + `README.md` (instrucciones para correr, agregar productos, y la especificación de imágenes para el cliente)
2. ✅ `data/productos.json` — 15 productos activos + 1 dado de baja (`activo:false`), cubriendo variantes con stock 0, universales, descuentos y sin stock
3. ✅ SASS con `@use`/`@forward` (no `@import`, deprecado), tokens, mixins y reset
4. ✅ Header y footer en las 6 páginas — HTML repetido a propósito, no inyectado por JS (mejor SEO y sin CLS)
5. ✅ Home con selector de modelo operativo, categorías, destacados y novedades
6. ✅ Catálogo con filtros (categoría, modelo, marca, precio) y orden, sincronizados con la URL
7. ✅ Página de producto: galería, variantes, cuotas, specs, relacionados, JSON-LD
8. ✅ Carrito con persistencia versionada en localStorage
9. ✅ Checkout por WhatsApp end to end, detrás de `checkout/index.js`

**Verificación:** 46 aserciones automatizadas (núcleo + filtros) corriendo en Node, chequeo de que cada `import` resuelve a un export real, y Lighthouse con Chrome real: **90-100 en las cuatro métricas en las 6 páginas** (detalle en el README, sección Calidad).

**Pendiente, no de código:** el número de WhatsApp real y las fotos de producto — ambos documentados en el README como lo único que falta para pasar a producción.
