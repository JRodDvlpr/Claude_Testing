/* main.js — vanilla JS for cigar landing page */

document.addEventListener('DOMContentLoaded', () => {

  // ── 0. Age Gate ──────────────────────────────────────────
  const ageGate = document.getElementById('age-gate');
  if (ageGate) {
    const confirmBtn = ageGate.querySelector('.age-gate__confirm');
    const denyBtn    = ageGate.querySelector('.age-gate__deny');
    const panel      = ageGate.querySelector('.age-gate__panel');

    confirmBtn?.addEventListener('click', () => {
      try { localStorage.setItem('pitaAgeVerified', 'true'); } catch (e) {}
      document.documentElement.classList.remove('age-gate-open');
      ageGate.style.display = 'none';
    });

    denyBtn?.addEventListener('click', () => {
      panel.innerHTML = `
        <p class="eyebrow age-gate__eyebrow">Age Verification</p>
        <h2 class="age-gate__heading">Access Restricted</h2>
        <p class="age-gate__desc">
          Pita Cigars sells tobacco products intended only for adults 21 years of age
          or older. You must meet this age requirement to view this site.
        </p>
      `;
    });
  }

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
      track.style.transform = `translateX(calc(-${current} * (50% + 1.25rem)))`;
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

  // ── 6. Contact Form ────────────────────────────────────────
  const form     = document.querySelector('.contact__form');
  const feedback = form?.querySelector('.contact__feedback');
  if (form && feedback) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value.trim();
      const name  = form.querySelector('input[type="text"]').value.trim();
      const message = form.querySelector('textarea').value.trim();
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!name || !message || !emailRe.test(email)) {
        feedback.textContent = 'Please complete all fields with a valid email address.';
        feedback.style.color = '#E8745A';
        return;
      }
      feedback.textContent = 'Thank you — your message has been sent. We will be in touch shortly.';
      feedback.style.color = 'var(--color-gold-light)';
      form.reset();
      // TODO: wire up fetch() POST to your form/email service endpoint here
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
