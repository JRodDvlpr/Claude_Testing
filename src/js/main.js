/* main.js — vanilla JS for cigar landing page */

// Opt in to JS-driven scroll-reveal styling as early as possible. If this file
// never loads, the class is never added and all content stays visible.
document.documentElement.classList.add('reveal-init');

document.addEventListener('DOMContentLoaded', () => {

  // ── 0. Age Gate ──────────────────────────────────────────
  // Rules:
  //  - A hard refresh/reload of the page always re-shows the gate.
  //  - A brand new tab/window (pasted URL, typed URL, bookmark) always shows it.
  //  - Clicking an internal link (Home, Products, etc.) after confirming in
  //    this tab does NOT re-show it.
  //
  // Persistence uses window.name as the primary signal: it survives same-tab
  // navigation, is empty in a new tab, and — crucially — keeps working even
  // when Safari/iOS blocks cookies & web storage ("Block All Cookies",
  // private mode, ITP). sessionStorage is kept as a harmless secondary.
  const AGE_FLAG = 'pita-age-ok';
  const ageGate = document.getElementById('age-gate');
  if (ageGate) {
    const confirmBtn = ageGate.querySelector('.age-gate__confirm');
    const denyBtn    = ageGate.querySelector('.age-gate__deny');
    const panel      = ageGate.querySelector('.age-gate__panel');
    const lockedEls  = [
      document.querySelector('.site-header'),
      document.getElementById('main-content'),
      document.querySelector('.site-footer'),
    ].filter(Boolean);

    // The gate's initial visibility for THIS load was already decided by the
    // small inline script that runs before this file (before first paint),
    // to avoid any flash. Here we just react to whatever it decided.
    const lockBackground = (locked) => {
      lockedEls.forEach((el) => { el.inert = locked; });
    };

    const isHiddenAlready = getComputedStyle(ageGate).display === 'none';
    if (!isHiddenAlready) {
      lockBackground(true);
      confirmBtn?.focus();
    }

    confirmBtn?.addEventListener('click', () => {
      // window.name persists across same-tab navigation with no reliance on
      // cookies/storage, so this survives even when Safari blocks storage.
      try {
        if (window.name.indexOf(AGE_FLAG) === -1) {
          window.name = (window.name ? window.name + ' ' : '') + AGE_FLAG;
        }
      } catch (e) {}
      try { sessionStorage.setItem('pitaAgeVerified', 'true'); } catch (e) {}
      document.documentElement.classList.remove('age-gate-open');
      lockBackground(false);
      ageGate.style.display = 'none';
      // Reset sequential focus to the top of the document so the next Tab
      // lands on the skip link, not wherever the dialog sat in the DOM.
      document.body.setAttribute('tabindex', '-1');
      document.body.focus({ preventScroll: true });
      document.body.removeAttribute('tabindex');
    });

    denyBtn?.addEventListener('click', () => {
      // Cross-fade the panel content instead of an abrupt swap.
      panel.style.transition = 'opacity 0.45s ease';
      panel.style.opacity = '0';
      setTimeout(() => {
        panel.innerHTML = `
          <p class="eyebrow age-gate__eyebrow">Age Verification</p>
          <h2 class="age-gate__heading">Access Restricted</h2>
          <p class="age-gate__desc">
            Pita Cigars sells tobacco products intended only for adults 21 years of age
            or older. You must meet this age requirement to view this site.
          </p>
        `;
        panel.style.opacity = '1';
      }, 450);
      // Background stays locked — there is no confirm path from here.
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
  // The toggle stays above the full-screen menu overlay and morphs into
  // an X while the menu is open, so it can always be closed from the
  // same top-right corner it was opened from.
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav-menu');
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      toggle.innerHTML = open ? '&#10005;' : '&#9776;';
      menu.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setOpen(false);
      }
    });
  }

  // ── 4. Smooth Scroll with Nav Offset ──────────────────────
  const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80;
  document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - navHeight, behavior: 'smooth' });
      if (menu?.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.innerHTML = '&#9776;';
        menu.classList.remove('is-open');
      }
    });
  });

  // ── 5. Testimonials Carousel ───────────────────────────────
  // Cards are shown two-at-a-time on wide screens and one-at-a-time on
  // narrow ones (see the 768px breakpoint in main.css). Dots represent
  // actual reachable pages for the current width, not one dot per card,
  // so there's never a trailing dot that scrolls to a half-empty view.
  const track  = document.querySelector('.testimonials__track');
  const dotsEl = document.querySelector('.testimonials__dots');
  const prevBtn = document.querySelector('.testimonials__btn--prev');
  const nextBtn = document.querySelector('.testimonials__btn--next');

  if (track && dotsEl) {
    const slides = Array.from(track.children);
    const narrowMq = window.matchMedia('(max-width: 768px)');
    let dots = [];
    let page = 0;

    const getVisibleCount = () => (narrowMq.matches ? 1 : Math.min(2, slides.length));
    const getPageCount = () => Math.max(1, Math.ceil(slides.length / getVisibleCount()));
    const getStartIndex = (p) => Math.min(p * getVisibleCount(), Math.max(0, slides.length - getVisibleCount()));

    const render = () => {
      const startIndex = getStartIndex(page);
      const target = slides[startIndex];
      track.style.transform = `translateX(-${target ? target.offsetLeft : 0}px)`;
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === page)));
    };

    const buildDots = () => {
      const pageCount = getPageCount();
      dotsEl.innerHTML = '';
      dots = Array.from({ length: pageCount }, (_, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slider-dot';
        btn.setAttribute('aria-label', `Testimonials, page ${i + 1} of ${pageCount}`);
        btn.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(btn);
        return btn;
      });
    };

    const goTo = (index) => {
      const pageCount = getPageCount();
      page = (index + pageCount) % pageCount;
      render();
    };

    buildDots();
    render();

    prevBtn?.addEventListener('click', () => goTo(page - 1));
    nextBtn?.addEventListener('click', () => goTo(page + 1));

    // Rebuild on breakpoint crossing so dot count always matches what's visible.
    let lastNarrow = narrowMq.matches;
    window.addEventListener('resize', () => {
      if (narrowMq.matches !== lastNarrow) {
        lastNarrow = narrowMq.matches;
        page = 0;
        buildDots();
      }
      render();
    });

    // auto-advance (paused if user prefers reduced motion)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      setInterval(() => goTo(page + 1), 5000);
    }
  }

  // ── 5b. Product Photo Slider ───────────────────────────────
  document.querySelectorAll('.pdp-slider').forEach((slider) => {
    const sTrack = slider.querySelector('.pdp-slider__track');
    const sDotsEl = slider.querySelector('.pdp-slider__dots');
    if (!sTrack) return;
    const sSlides = Array.from(sTrack.children);
    if (sSlides.length < 2) {
      slider.querySelector('.pdp-slider__controls')?.remove();
      return;
    }
    let sCurrent = 0;

    function sGoTo(index) {
      sCurrent = (index + sSlides.length) % sSlides.length;
      sTrack.style.transform = `translateX(-${sCurrent * 100}%)`;
      sSlides.forEach((sl, i) => sl.setAttribute('aria-hidden', String(i !== sCurrent)));
      sDots.forEach((d, i) => d.setAttribute('aria-current', String(i === sCurrent)));
    }

    sSlides.forEach((sl, i) => sl.setAttribute('aria-hidden', String(i !== 0)));

    const sDots = sSlides.map((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slider-dot';
      btn.setAttribute('aria-label', `Photo ${i + 1} of ${sSlides.length}`);
      btn.setAttribute('aria-current', String(i === 0));
      btn.addEventListener('click', () => sGoTo(i));
      sDotsEl?.appendChild(btn);
      return btn;
    });

    slider.querySelector('.pdp-slider__btn--prev')?.addEventListener('click', () => sGoTo(sCurrent - 1));
    slider.querySelector('.pdp-slider__btn--next')?.addEventListener('click', () => sGoTo(sCurrent + 1));

    // arrow keys work while focus is anywhere inside the slider
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); sGoTo(sCurrent - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); sGoTo(sCurrent + 1); }
    });

    // swipe on touch devices
    let touchX = null;
    sTrack.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    sTrack.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) sGoTo(sCurrent + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });
  });

  // ── 6. Scroll Reveal ───────────────────────────────────────
  const revealEls = document.querySelectorAll(
    '.product-card, .category-card, .bundle-card, .craft__photo, .craft__content, .testimonial-card, .retailer-card, ' +
    '.about__media, .about__content, .contact__info, ' +
    '.pdp-story__inner, .section-header'
  );
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => observer.observe(el));
  }

  // ── 7. Hero Parallax ───────────────────────────────────────
  const heroImg = document.querySelector('.hero__bg-img');
  if (heroImg && !reducedMotion) {
    let ticking = false;
    const updateParallax = () => {
      const offset = window.scrollY * 0.3;
      heroImg.style.transform = `translateY(${offset}px) scale(1.12)`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

});
