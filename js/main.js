(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Year ---- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---- Sticky header glass on scroll ---- */
  const header = document.getElementById('site-header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  const menuBtn = document.getElementById('menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  menuBtn.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.mobile-link').forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---- Hero canvas: floating water droplets + soft ripples ---- */
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let ripples = [];
  let animId = null;
  let mouse = { x: null, y: null };

  function resizeCanvas() {
    const section = canvas.parentElement;
    canvas.width = section.clientWidth;
    canvas.height = section.clientHeight;
  }

  function createParticles() {
    const count = Math.min(70, Math.floor((canvas.width * canvas.height) / 16000));
    particles = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 5 + 3;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 0.8 + 0.5,
        size,
        // gentle horizontal drift + falling motion
        vx: (Math.random() - 0.5) * 0.25,
        vy: Math.random() * 0.9 + 0.45,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
        alpha: Math.random() * 0.25 + 0.45,
      });
    }
  }

  /** Draw a teardrop / water-droplet shape */
  function drawDroplet(p) {
    const s = p.size * p.z;
    const alpha = Math.min(0.75, p.alpha * (0.7 + p.z * 0.3));

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1, 1.35);

    // droplet body
    const body = ctx.createRadialGradient(-s * 0.25, -s * 0.3, s * 0.1, 0, 0, s);
    body.addColorStop(0, `rgba(147, 197, 253, ${alpha * 0.95})`);
    body.addColorStop(0.45, `rgba(59, 130, 246, ${alpha})`);
    body.addColorStop(1, `rgba(37, 99, 235, ${alpha * 0.9})`);

    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.85, -s * 0.35, s * 0.75, s * 0.55, 0, s);
    ctx.bezierCurveTo(-s * 0.75, s * 0.55, -s * 0.85, -s * 0.35, 0, -s);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();

    // glass highlight
    ctx.beginPath();
    ctx.ellipse(-s * 0.22, -s * 0.35, s * 0.22, s * 0.35, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.55})`;
    ctx.fill();

    ctx.restore();
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // soft ambient wash
    const grd = ctx.createRadialGradient(
      canvas.width * 0.5, canvas.height * 0.4, 0,
      canvas.width * 0.5, canvas.height * 0.4, canvas.width * 0.55
    );
    grd.addColorStop(0, 'rgba(37, 99, 235, 0.04)');
    grd.addColorStop(1, 'rgba(248, 250, 252, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.wobble += p.wobbleSpeed;
      p.x += p.vx * p.z + Math.sin(p.wobble) * 0.15;
      p.y += p.vy * p.z;

      if (mouse.x !== null) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 160) {
          p.x -= (dx / dist) * 0.2;
          p.y -= (dy / dist) * 0.12;
        }
      }

      // recycle off bottom → rain from top
      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
      if (p.x < -20) p.x = canvas.width + 20;
      if (p.x > canvas.width + 20) p.x = -20;

      drawDroplet(p);
    });

    ripples = ripples.filter((r) => r.life > 0);
    ripples.forEach((r) => {
      r.radius += r.speed;
      r.life -= 0.014;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(37, 99, 235, ${Math.max(0, r.life) * 0.45})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    animId = requestAnimationFrame(drawParticles);
  }

  function addRipple(x, y) {
    ripples.push({ x, y, radius: 4, speed: 1.8, life: 1 });
  }

  if (!prefersReducedMotion) {
    resizeCanvas();
    createParticles();
    drawParticles();
    window.addEventListener('resize', () => {
      resizeCanvas();
      createParticles();
    });
    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });
    canvas.parentElement.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      addRipple(e.clientX - rect.left, e.clientY - rect.top);
    });
    setInterval(() => {
      if (document.hidden) return;
      addRipple(Math.random() * canvas.width, Math.random() * canvas.height * 0.7);
    }, 2200);
  }

  /* ---- Before / After slider ---- */
  const slider = document.getElementById('ba-slider');
  const afterClip = document.getElementById('ba-after');
  const afterImg = document.getElementById('ba-after-img');
  const handle = document.getElementById('ba-handle');
  let dragging = false;

  function sizeAfterImage() {
    afterImg.style.width = slider.offsetWidth + 'px';
  }

  function setSliderPos(clientX) {
    const rect = slider.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(2, Math.min(98, pct));
    afterClip.style.width = pct + '%';
    handle.style.left = pct + '%';
  }

  function startDrag(e) {
    dragging = true;
    slider.classList.add('dragging');
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    setSliderPos(x);
  }
  function moveDrag(e) {
    if (!dragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    setSliderPos(x);
  }
  function endDrag() {
    dragging = false;
    slider.classList.remove('dragging');
  }

  sizeAfterImage();
  window.addEventListener('resize', sizeAfterImage);
  // wait for images
  afterImg.addEventListener('load', sizeAfterImage);
  slider.querySelector('.ba-base').addEventListener('load', sizeAfterImage);

  slider.addEventListener('mousedown', startDrag);
  slider.addEventListener('touchstart', startDrag, { passive: true });
  window.addEventListener('mousemove', moveDrag);
  window.addEventListener('touchmove', moveDrag, { passive: true });
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      // close others
      document.querySelectorAll('.faq-item.open').forEach((openItem) => {
        if (openItem === item) return;
        openItem.classList.remove('open');
        openItem.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
        openItem.querySelector('.faq-answer').style.maxHeight = '0px';
      });

      if (isOpen) {
        item.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = '0px';
      } else {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ---- Contact form → aaapowerwashingtx@gmail.com via FormSubmit ---- */
  const form = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    formStatus.classList.add('hidden');

    try {
      const data = new FormData(form);
      const res = await fetch('https://formsubmit.co/ajax/aaapowerwashingtx@gmail.com', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });

      if (!res.ok) throw new Error('Submit failed');

      formStatus.textContent = "Thanks! Your message was sent. We'll reply soon — or call (469)-504-7695.";
      formStatus.classList.remove('hidden');
      formStatus.classList.remove('text-red-600');
      formStatus.classList.add('text-brand');
      form.reset();
    } catch (err) {
      formStatus.textContent = 'Something went wrong. Please email aaapowerwashingtx@gmail.com or call (469)-504-7695.';
      formStatus.classList.remove('hidden');
      formStatus.classList.remove('text-brand');
      formStatus.classList.add('text-red-600');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });

  /* ---- Vanilla Tilt ---- */
  if (typeof VanillaTilt !== 'undefined' && !prefersReducedMotion) {
    VanillaTilt.init(document.querySelectorAll('[data-tilt]'), {
      max: 12,
      speed: 400,
      glare: true,
      'max-glare': 0.15,
      scale: 1.02,
    });
  }

  /* ---- GSAP animations ---- */
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero 3D staggered upward reveal
    const heroWords = document.querySelectorAll('.hero-word');
    gsap.set(heroWords, {
      opacity: 0,
      y: 80,
      rotateX: -75,
      transformOrigin: '50% 100%',
      transformPerspective: 800,
    });

    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .to('.hero-brand', { opacity: 1, y: 0, duration: 0.7 }, 0.15)
      .fromTo('.hero-brand', { y: 28 }, { y: 0, duration: 0.7 }, 0.15)
      .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.55 }, 0.35)
      .fromTo('.hero-eyebrow', { y: 16 }, { y: 0, duration: 0.55 }, 0.35)
      .to(heroWords, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.85,
        stagger: 0.07,
      }, 0.45)
      .to('.hero-sub', { opacity: 1, y: 0, duration: 0.65 }, '-=0.3')
      .fromTo('.hero-sub', { y: 20 }, { y: 0, duration: 0.65 }, '<')
      .to('.hero-ctas', { opacity: 1, y: 0, duration: 0.65 }, '-=0.35')
      .fromTo('.hero-ctas', { y: 20 }, { y: 0, duration: 0.65 }, '<');

    if (prefersReducedMotion) {
      heroTl.progress(1);
    }

    // Scroll reveals — skip tilt cards (they have their own opacity fade)
    gsap.utils.toArray('.reveal:not(.tilt-card)').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          immediateRender: false,
        }
      );
    });

    // Service cards: opacity-only fade (no transform — VanillaTilt owns that)
    const serviceCards = gsap.utils.toArray('.tilt-card');
    if (prefersReducedMotion) {
      gsap.set(serviceCards, { opacity: 1 });
    } else {
      gsap.set(serviceCards, { opacity: 0 });
      gsap.to(serviceCards, {
        opacity: 1,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
        overwrite: 'auto',
        scrollTrigger: {
          trigger: '#services',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    }
  }
})();
