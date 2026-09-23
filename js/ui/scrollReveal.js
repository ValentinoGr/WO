// ===========================================================================
// Scroll reveal — entrada suave de secciones al aparecer en pantalla
// ===========================================================================
// La clase "reveal" (estado escondido) se agrega acá mismo, recién antes de
// observar: si este script no corre por algún motivo, el contenido nunca
// queda oculto — se ve normal desde el arranque (progressive enhancement).

const SELECTOR = "main .seccion, main .beneficios";

export function iniciarScrollReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const elementos = document.querySelectorAll(SELECTOR);
  if (!elementos.length) return;

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add("reveal--visible");
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

  elementos.forEach((el) => {
    el.classList.add("reveal");
    observador.observe(el);
  });
}
