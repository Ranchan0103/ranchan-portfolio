document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => revealIo.observe(el));
  }

  // 2. Count-up numbers
  const counters = document.querySelectorAll('.count-up');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.target);
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = Number.isInteger(target) ? Math.round(value) : value.toFixed(1);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    };
    requestAnimationFrame(step);
  };
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    counters.forEach((el) => {
      el.textContent = el.dataset.target;
    });
  } else {
    const counterIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            counterIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterIo.observe(el));
  }

  // 3. Hero catchphrase character stagger (preserves element nodes like <br>)
  const heroCopy = document.querySelector('.hero-copy[data-typing]');
  if (heroCopy && !prefersReducedMotion) {
    const fullText = heroCopy.textContent;
    heroCopy.setAttribute('aria-label', fullText);
    let delay = 0;
    const step = 28;
    Array.from(heroCopy.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        Array.from(node.textContent).forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'char-reveal';
          span.textContent = ch === ' ' ? ' ' : ch;
          span.style.animationDelay = `${delay}ms`;
          span.setAttribute('aria-hidden', 'true');
          delay += step;
          frag.appendChild(span);
        });
        node.replaceWith(frag);
      }
    });
    heroCopy.classList.add('is-typed');
  }
});
