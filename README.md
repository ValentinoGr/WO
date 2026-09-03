# Wo! — Tienda de accesorios para iPhone

Sitio de e-commerce estático. HTML + SASS + JavaScript vanilla con ES Modules.
Sin framework y sin build step más allá del compilador de SASS.

El brief completo del proyecto está en [CLAUDE.md](CLAUDE.md) — es la fuente de verdad.

---

## Cómo correr el proyecto

Hacen falta **dos procesos**: uno compila el SASS, el otro sirve los archivos.

### 1. Instalar (solo la primera vez)

```bash
npm install
```

Única dependencia: `sass`. Nada más.

### 2. Compilar los estilos

```bash
npm run css:watch      # recompila al guardar (dejalo corriendo)
```

O una sola vez: `npm run css`

### 3. Levantar el servidor

En **otra terminal**:

```bash
npm run serve          # http://localhost:5500
```

> **Importante:** no alcanza con abrir `index.html` con doble clic.
> El sitio usa ES Modules y `fetch()` para cargar `data/productos.json`, y
> ambos están bloqueados bajo el protocolo `file://`. Sin servidor, el
> catálogo aparece vacío. Cualquier servidor estático sirve: el script usa
> el de Python porque ya viene instalado, pero Live Server de VS Code o
> `npx serve` funcionan igual.

### Para producción

```bash
npm run build          # CSS minificado, sin source map
```

Subir a Hostinger todo **menos** `scss/`, `node_modules/` y `CLAUDE.md`.

---

## Estructura

```
├── data/
│   └── productos.json         # catálogo — se edita a mano
├── js/
│   ├── config.js              # datos de negocio: WhatsApp, envíos, modelos
│   ├── data/productos.js      # fetch + cache + normalización
│   ├── carrito/               # estado + persistencia en localStorage
│   ├── checkout/              # capa abstraída: whatsapp.js | mercadopago.js
│   ├── filtros/               # filtros sincronizados con la URL
│   ├── ui/                    # componentes de interfaz
│   └── utils/                 # formato de precios, helpers de DOM
├── scss/
│   ├── abstracts/             # tokens, breakpoints, mixins
│   ├── base/                  # reset, tipografía, globales
│   ├── components/            # botones, badges, cards
│   ├── layout/                # header, footer, grillas
│   └── pages/                 # estilos por página
├── css/main.css               # generado — no editar a mano
└── assets/img/                # imágenes (ver especificación abajo)
```

---

## Cómo agregar un producto

Editar `data/productos.json` y agregar un objeto al array. El modelo de datos
completo está en [CLAUDE.md §4](CLAUDE.md).

Puntos que se olvidan seguido:

- **`compatibilidad: []`** (array vacío) = producto universal. Aparece en los
  resultados de **todos** los modelos de iPhone. Usalo para cargadores, cables,
  power banks, parlantes y auriculares.
- **`activo: false`** da de baja el producto sin borrarlo. No se renderiza en
  ningún lado, pero la entrada queda como historial.
- **`precioAnterior: null`** si no hay descuento. Si tiene valor, el sitio
  calcula el `% OFF` solo y muestra el precio tachado.
- Los precios son **enteros, sin puntos ni decimales**: `18500`, no `18.500`
  ni `18500.00`.
- Si el producto tiene `variantes`, el stock total se calcula sumando el stock
  de cada variante — el campo `stock` de nivel producto se ignora.

Para agregar una **categoría nueva**: sumarla a `CONFIG.categorias` en
`js/config.js` y usar ese mismo `id` en el campo `categoria` de los productos.
No hay que tocar nada más.

---

## Especificación de imágenes

> **Esto es lo que hay que pasarle al cliente.**

Mientras no lleguen las fotos, las cards y la galería muestran un bloque de
color de la paleta con la relación de aspecto final. El layout ya está
resuelto: al reemplazar los bloques por las fotos reales nada se mueve de
lugar.

### Formato y peso

| | |
|---|---|
| **Formato** | `.webp` (obligatorio) |
| **Calidad** | 80–85 |
| **Peso máximo** | **150 KB** por foto de producto · **250 KB** para las de hero |
| **Color** | sRGB |
| **Fondo** | Blanco liso o gris muy claro, **uniforme en todo el catálogo** |

Si las fotos vienen en JPG o PNG, se convierten con [Squoosh](https://squoosh.app)
(gratis, en el navegador, sin instalar nada).

### Dimensiones

| Uso | Medida | Relación | Notas |
|---|---|---|---|
| **Producto** | 1200 × 1200 px | 1:1 cuadrada | La principal y las de detalle |
| **Producto @2x** *(opcional)* | 1600 × 1600 px | 1:1 | Para pantallas retina |
| **Categoría** | 800 × 600 px | 4:3 | Una por categoría |
| **Hero del home** | 1920 × 1080 px | 16:9 | Una o dos |

El producto tiene que quedar **centrado y con aire alrededor** — que no toque
los bordes del cuadrado. Recortar la foto justo contra el objeto lo hace ver
apretado cuando se muestra chico en la grilla.

### Convención de nombres

```
<id-del-producto>-<variante>.webp
```

Todo en **minúsculas**, palabras separadas con guiones, **sin tildes, sin ñ,
sin espacios**.

Ejemplos, tal como los espera el JSON:

```
funda-silicona-magsafe-15pro-negro.webp
funda-silicona-magsafe-15pro-beige.webp
funda-silicona-magsafe-15pro-detalle.webp
cargador-pared-20w-usbc.webp
jbl-go-4-negro.webp
```

Los nombres **ya están declarados** en `data/productos.json`, en los campos
`imagenes` y `variantes[].imagen`. Al dejar los archivos en
`assets/img/productos/` con esos nombres exactos, aparecen solas: no hay que
tocar código.

### Cuántas fotos por producto

- **Mínimo 1** — la principal, sobre fondo blanco
- **Ideal 2–3** — la principal, un detalle, y una del producto en uso
- Si el producto tiene **variantes de color**, hace falta **una foto por color**

---

## Fase 2 — Mercado Pago

Está preparado, no implementado. El front nunca sabe cómo se paga: llama a
`finalizarCompra()` de `js/checkout/index.js` y esa función decide.

Para activarlo:

1. Implementar `js/checkout/mercadopago.js` (hoy es un stub que lanza
   `Error("Pendiente Fase 2")`). La firma tiene que quedar igual.
2. Cambiar `metodoCheckout: "whatsapp"` → `"mercadopago"` en `js/config.js`.

Nada más del front se toca.

⚠️ El backend en Python **tiene que recalcular el total** contra su propia
fuente de datos antes de crear la preferencia. Si toma el precio que le manda
el navegador, cualquiera lo edita desde la consola y compra a $1.

---

## Calidad — Lighthouse

Medido con Chrome real (no estimado), corriendo sobre `python -m http.server`
en local — sin CDN ni cache-control, así que en producción va a dar mejor,
no peor.

| Página | Performance | Accesibilidad | Best Practices | SEO |
|---|---|---|---|---|
| `index.html` | 98 | 100 | 96 | 100 |
| `tienda.html` | 98 | 100 | 96 | 100 |
| `producto.html` | 90 | 100 | 96 | 100 |
| `carrito.html` | 99 | 100 | 100 | 60* |
| `contacto.html` | 99 | 100 | 100 | 100 |
| `faq.html` | 99 | 100 | 100 | 100 |

\* El carrito tiene `<meta name="robots" content="noindex">` a propósito —
no tiene sentido que Google indexe una página de carrito de compras. Ese es
el único motivo del puntaje SEO bajo ahí; es intencional, no un bug.

Cosas que van a subir solas cuando lleguen las fotos reales del cliente:
hoy cada `<img>` rota devuelve 404 (documentado, ver arriba), lo que resta
unos puntos en Performance por errores de consola y en el peso de la página.

Para repetir la medición: `npx lighthouse http://localhost:5500/index.html
--view` con el sitio corriendo.

---

## Pendientes de configuración

- [ ] **Número de WhatsApp real** en `CONFIG.whatsapp` (`js/config.js`).
      Hoy tiene el placeholder `5493492XXXXXX` y el checkout devuelve un error
      claro hasta que se complete.
      Formato: código de país + área sin el 0 + número sin el 15, todo junto.
      Ej. Rafaela (3492) 123456 → `5493492123456`
- [ ] Email y dirección definitivos en `CONFIG`
- [ ] Links reales de Instagram y Facebook
- [ ] Fotos de producto (ver especificación arriba)
- [ ] Confirmar el umbral de envío gratis (hoy `$50.000`)
