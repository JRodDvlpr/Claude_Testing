/* main.js — vanilla JS for cigar landing page */

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Dynamic Footer Year ──────────────────────────────────
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── 2. Sticky Nav ──────────────────────────────────────────
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ── 3. Mobile Nav Toggle ───────────────────────────────────
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('is-open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
      }
    });
  }

  // ── 4. Smooth Scroll with Nav Offset ──────────────────────
  const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80;
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - navHeight, behavior: 'smooth' });
      if (menu?.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
      }
    });
  });

  // ── 5. Testimonials Carousel ───────────────────────────────
  const track  = document.querySelector('.testimonials__track');
  const dotsEl = document.querySelector('.testimonials__dots');
  const prevBtn = document.querySelector('.testimonials__btn--prev');
  const nextBtn = document.querySelector('.testimonials__btn--next');

  if (track) {
    const slides = Array.from(track.children);
    let current = 0;

    const goTo = (index) => {
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(calc(-${current} * (50% + 0.75rem)))`;
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === current)));
    };

    // build dots
    const dots = slides.map((_, i) => {
      const btn = document.createElement('button');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Testimonial ${i + 1}`);
      btn.setAttribute('aria-selected', String(i === 0));
      btn.style.cssText = `width:8px;height:8px;border-radius:50%;background:${i===0?'var(--color-gold)':'var(--color-ash)'};border:none;cursor:pointer;transition:background 0.3s`;
      btn.addEventListener('click', () => goTo(i));
      dotsEl?.appendChild(btn);
      return btn;
    });

    prevBtn?.addEventListener('click', () => goTo(current - 1));
    nextBtn?.addEventListener('click', () => goTo(current + 1));

    // auto-advance (paused if user prefers reduced motion)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      setInterval(() => goTo(current + 1), 5000);
    }
  }

  // ── 6. Newsletter Form ─────────────────────────────────────
  const form       = document.querySelector('.newsletter__form');
  const disclaimer = document.querySelector('.newsletter__disclaimer');
  if (form && disclaimer) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value.trim();
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(email)) {
        disclaimer.textContent = 'Please enter a valid email address.';
        disclaimer.style.color = '#E8745A';
        return;
      }
      disclaimer.textContent = 'Thank you for joining the inner circle.';
      disclaimer.style.color = 'var(--color-gold-light)';
      form.reset();
      // TODO: wire up fetch() POST to your email service endpoint here
    });
  }

  // ── 7. Scroll Reveal ───────────────────────────────────────
  const revealEls = document.querySelectorAll('.section, .product-card, .benefit-item, .testimonial-card');
  const observer  = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => observer.observe(el));

});
