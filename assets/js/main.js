// Tafadzwa Marisa portfolio interactions (GSAP 3.13)
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  $('#year').textContent = new Date().getFullYear();

  // Graceful fallback if GSAP fails to load
  if (!window.gsap) { document.documentElement.classList.remove('js'); initBasics(false); return; }

  gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin, SplitText, Flip, ScrollToPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });
  let navigating = false; // true while a nav link is scrolling the page
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const mm = gsap.matchMedia();

  initBasics(true);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    initHero(); initProjects(); initReveals(); initAbout(); initSkills(); initEducation(); initNavSpy();
    ScrollTrigger.refresh();
  });

  /* ---------- nav, menu, tabs, copy (work without animation too) ---------- */
  function initBasics(anim) {
    // mobile menu
    const btn = $('.menu-btn'), menu = $('#mobile-menu');
    let open = false;
    const setMenu = (v) => {
      open = v;
      btn.setAttribute('aria-expanded', v); btn.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', !v);
      if (!anim) { menu.style.display = v ? 'flex' : 'none'; return; }
      const links = $$('.mm-line a', menu);
      if (v) {
        gsap.set(menu, { display: 'flex' });
        gsap.timeline()
          .fromTo(menu, { clipPath: 'circle(0% at 92% 4%)' }, { clipPath: 'circle(150% at 92% 4%)', duration: reduce ? 0 : .7, ease: 'power3.inOut' })
          .fromTo(links, { yPercent: 110 }, { yPercent: 0, stagger: .06, duration: reduce ? 0 : .6, ease: 'back.out(1.6)' }, '-=.35');
        gsap.to($$('span', btn), { rotation: (i) => i ? -45 : 45, y: (i) => i ? -3 : 3, duration: .3 });
      } else {
        gsap.to(menu, { clipPath: 'circle(0% at 92% 4%)', duration: reduce ? 0 : .5, ease: 'power3.in', onComplete: () => gsap.set(menu, { display: 'none' }) });
        gsap.to($$('span', btn), { rotation: 0, y: 0, duration: .3 });
      }
    };
    btn.addEventListener('click', () => setMenu(!open));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && open) setMenu(false); });

    // tabs
    const tabs = $$('.tab'), ind = $('.tab-ind');
    const moveInd = (t, dur) => anim ? gsap.to(ind, { x: t.offsetLeft - 5, width: t.offsetWidth, height: t.offsetHeight, y: t.offsetTop - 5, duration: dur, ease: 'power3.out' })
      : Object.assign(ind.style, { transform: `translate(${t.offsetLeft - 5}px,${t.offsetTop - 5}px)`, width: t.offsetWidth + 'px', height: t.offsetHeight + 'px' });
    const select = (t, focus) => {
      tabs.forEach(x => {
        const on = x === t;
        x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        $('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) t.focus();
      moveInd(t, .45);
      const panel = $('#' + t.getAttribute('aria-controls'));
      if (anim && !reduce) gsap.from($$('li', panel), { y: 24, opacity: 0, rotation: () => gsap.utils.random(-3, 3), stagger: .05, duration: .5, ease: 'back.out(1.7)' });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length], true); }
      });
    });
    const sizeInd = () => moveInd($('.tab[aria-selected="true"]'), 0);
    sizeInd(); addEventListener('resize', sizeInd);

    // copy email
    const copyBtn = $('#copy-btn'), status = $('.copy-status');
    copyBtn.addEventListener('click', async () => {
      const email = 'Tafadzwamarisa00@gmail.com';
      let ok = false;
      try { await navigator.clipboard.writeText(email); ok = true; } catch (e) {
        try { const ta = document.createElement('textarea'); ta.value = email; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch (_) {}
      }
      status.textContent = ok ? 'Copied to your clipboard.' : 'Copy isn’t allowed here. Select the address above instead.';
      $('.btn-label', copyBtn).textContent = ok ? 'Copied' : 'Copy my email';
      setTimeout(() => { $('.btn-label', copyBtn).textContent = 'Copy my email'; }, 2400);
      if (ok && anim && !reduce) confetti(copyBtn);
    });

    // flip cards (also used without GSAP)
    $$('.card').forEach(card => {
      const inner = $('.card-inner', card), front = $('.front', card), back = $('.back', card);
      if (!back) return;
      let flipped = false;
      $$('.flip-btn', card).forEach(b => b.addEventListener('click', () => {
        flipped = !flipped;
        front.inert = flipped; back.inert = !flipped;
        $('.front .flip-btn', card).setAttribute('aria-expanded', flipped);
        if (anim) gsap.to(inner, { rotationY: flipped ? 180 : 0, duration: reduce ? 0 : .9, ease: 'back.inOut(1.4)', transformPerspective: 1200 });
        else inner.style.transform = `rotateY(${flipped ? 180 : 0}deg)`;
        setTimeout(() => $(flipped ? '.back .flip-btn' : '.front .flip-btn', card).focus({ preventScroll: true }), reduce || !anim ? 0 : 450);
      }));
    });

    if (!anim) return;

    // nav: hide on scroll down, active section indicator
    const nav = $('.nav');
    // Ignore tiny movements (and anything during a nav-link scroll) so the bar
    // only hides or shows when the visitor really changes direction.
    let lastY = 0, hidden = false;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => {
      const y = self.scroll();
      if (open || navigating) { lastY = y; return; }
      if (Math.abs(y - lastY) < 12) return;
      const hide = y > lastY && y > 120;
      lastY = y;
      if (hide === hidden) return;
      hidden = hide;
      gsap.to(nav, { yPercent: hide ? -140 : 0, duration: .35, ease: 'power2.out', overwrite: true });
    }});
    window.__showNav = () => { hidden = false; lastY = scrollY; gsap.to(nav, { yPercent: 0, duration: .3, overwrite: true }); };
    // cursor + magnetic buttons
    if (fine && !reduce) {
      const cur = $('.cursor'), label = $('.cursor-label');
      const cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
      let shown = false;
      addEventListener('pointermove', e => { if (!shown) { shown = true; gsap.set(cur, { x: e.clientX, y: e.clientY }); gsap.to(cur, { opacity: 1, duration: .3 }); } cx(e.clientX); cy(e.clientY); });
      document.addEventListener('pointerover', e => {
        const drag = e.target.closest('.ch, .pile .chip');
        const hot = e.target.closest('a, button');
        cur.classList.toggle('is-drag', !!drag); cur.classList.toggle('is-hot', !drag && !!hot);
        if (drag) label.textContent = 'Drag';
        gsap.to(cur, { scale: drag ? 1.8 : hot ? 1.5 : 1, duration: .3 });
        gsap.to(label, { opacity: drag ? 1 : 0, scale: .6, duration: .2 });
      });
      $$('.magnetic').forEach(el => {
        const lbl = $('.btn-label', el);
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          gsap.to(el, { x: dx * .3, y: dy * .4, duration: .4, ease: 'power3.out' });
          gsap.to(lbl, { x: dx * .12, y: dy * .15, duration: .4, ease: 'power3.out' });
        });
        el.addEventListener('pointerleave', () => gsap.to([el, lbl], { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.35)' }));
      });
    }
  }

  function initNavSpy() {
    const navInd = $('.nav-indicator');
    const navLinks = $$('.nav-links a');
    const setActive = (id) => {
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      const a = navLinks.find(a => a.getAttribute('href') === '#' + id);
      if (!a) { gsap.to(navInd, { opacity: 0, duration: .2 }); return; }
      gsap.to(navInd, { x: a.parentElement.offsetLeft, width: a.offsetWidth, opacity: 1, duration: .5, ease: 'elastic.out(1,.7)' });
    };
    const ids = ['home', 'about', 'experience', 'projects', 'skills', 'education', 'contact'];
    const spies = ids.map(id => ScrollTrigger.create({ trigger: '#' + id, start: 'top 50%', end: 'bottom 50%', onToggle: s => { if (!navigating && s.isActive) setActive(id); } }));
    const syncActive = () => { const i = spies.findIndex(s => s.isActive); if (i > -1) setActive(ids[i]); };

    // Where a section should land. The pinned projects section lands exactly where its
    // horizontal ride starts; everything else lands just below the floating nav.
    const targetY = (id) => {
      if (id === 'home') return 0;
      const ride = ScrollTrigger.getById('ride');
      if (id === 'projects' && ride) return ride.start;
      const el = document.getElementById(id);
      const offset = $('.nav-pill').offsetHeight + 28;
      return Math.max(0, el.getBoundingClientRect().top + scrollY - offset);
    };
    const nav = $('.nav');
    // wait a moment before handing control back, so the last scroll event of the tween
    // doesn't hide the nav or flicker the active link
    const finish = () => gsap.delayedCall(.25, () => { window.__showNav && window.__showNav(); navigating = false; syncActive(); });

    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!ids.includes(id)) return;
      e.preventDefault();
      navigating = true;
      setActive(id);
      window.__showNav && window.__showNav();
      const y = targetY(id), dist = Math.abs(y - scrollY);
      gsap.to(window, {
        scrollTo: { y, autoKill: true },
        duration: reduce ? 0 : gsap.utils.clamp(.6, 1.6, dist / 2500),
        ease: 'power3.inOut', overwrite: true,
        onComplete: () => {
          // re-check once in case a late layout change moved the target
          const y2 = targetY(id);
          if (Math.abs(y2 - scrollY) > 2) window.scrollTo(0, y2);
          finish();
          const el = document.getElementById(id);
          if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
          el.focus({ preventScroll: true });
          history.replaceState(null, '', '#' + id);
        },
        onAutoKill: finish
      });
    });

  }

  /* ---------- hero: throwable letters ---------- */
  function initHero() {
    const name = $('.hero-name');
    const split = SplitText.create($$('.name-line', name), { type: 'chars', charsClass: 'ch', aria: 'none' });
    const chars = split.chars;
    gsap.set(name, { visibility: 'visible' });
    const hint = $('.hero-hint');
    if (!fine) $('.hint-text').textContent = 'The letters in my name are bouncy. Tap one.';

    const intro = gsap.timeline({ defaults: { ease: 'back.out(1.8)' } });
    if (!reduce) {
      intro.from(chars, { yPercent: 130, rotation: () => gsap.utils.random(-40, 40), opacity: 0, duration: 1, stagger: .045 })
        .from('.hero-role', { y: 20, opacity: 0, duration: .6 }, .2)
        .from('.shape', { scale: 0, rotation: -120, duration: 1, stagger: .1, ease: 'elastic.out(1,.5)' }, .4)
        .from('.sticker', { scale: 0, rotation: -200, duration: 1.1, ease: 'elastic.out(1,.6)' }, .6)
        .from('.hero-foot > *', { y: 30, opacity: 0, duration: .7, stagger: .12 }, .7)
        .from('.nav-pill', { y: -80, opacity: 0, duration: .8 }, .3);
      gsap.to('.hint-hand', { rotation: 18, repeat: -1, yoyo: true, duration: .35, ease: 'sine.inOut', transformOrigin: '70% 90%' });
      gsap.fromTo('.live', { boxShadow: '0 0 0 0 rgba(63,203,151,.65)' }, { boxShadow: '0 0 0 10px rgba(63,203,151,0)', repeat: -1, duration: 1.4, ease: 'power1.out' });
    }

    // sticker spin, boosted by scroll speed
    if (!reduce) {
      const spin = gsap.to('.sticker svg', { rotation: 360, repeat: -1, duration: 16, ease: 'none' });
      ScrollTrigger.create({ onUpdate: s => { spin.timeScale(1 + Math.min(Math.abs(s.getVelocity()) / 150, 12)); gsap.to(spin, { timeScale: 1, duration: 1.2, overwrite: true }); } });
      gsap.to('.hero .shape', { y: (i) => [-120, 160, -80, 200][i], ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    let hinted = false;
    const hideHint = () => { if (hinted) return; hinted = true; gsap.to(hint, { opacity: 0, y: -10, duration: .4 }); };

    if (fine) {
      chars.forEach(ch => {
        let back;
        const goHome = () => gsap.to(ch, { x: 0, y: 0, rotation: 0, scale: 1, duration: reduce ? .3 : 1.8, ease: 'elastic.out(1,.3)' });
        Draggable.create(ch, {
          type: 'x,y', inertia: !reduce, bounds: '.hero', zIndexBoost: true, edgeResistance: .6,
          onPress() { back && back.kill(); ch.classList.add('grabbed'); hideHint(); gsap.to(ch, { scale: 1.15, rotation: gsap.utils.random(-15, 15), duration: .25 }); },
          onDrag() { gsap.to(ch, { rotation: gsap.utils.clamp(-35, 35, this.deltaX * 2.5), duration: .3 }); },
          onRelease() { ch.classList.remove('grabbed'); if (!this.isThrowing) back = gsap.delayedCall(.6, goHome); },
          onThrowComplete() { back = gsap.delayedCall(.6, goHome); }
        });
      });
      // letters swell near the pointer
      if (!reduce) {
        const hero = $('.hero');
        let raf = 0, mx = -999, my = -999;
        hero.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(tick); });
        hero.addEventListener('pointerleave', () => { mx = my = -9999; if (!raf) raf = requestAnimationFrame(tick); });
        function tick() {
          raf = 0;
          chars.forEach(ch => {
            const r = ch.getBoundingClientRect();
            const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
            const t = gsap.utils.clamp(0, 1, 1 - d / 320);
            gsap.to(ch, { '--w': 700 + t * 100 - (1 - t) * 0, '--wd': 100 - t * 25, duration: .5, overwrite: 'auto' });
          });
          // shapes drift away from the pointer
          $$('.hero .shape').forEach(s => {
            const k = +s.dataset.depth / 1000;
            gsap.to(s, { xPercent: (mx - innerWidth / 2) * k, yPercent: (my - innerHeight / 2) * k, duration: 1, overwrite: 'auto' });
          });
        }
      }
    } else {
      chars.forEach(ch => ch.addEventListener('click', () => {
        hideHint();
        if (reduce) return;
        gsap.timeline().to(ch, { y: -gsap.utils.random(50, 110), rotation: gsap.utils.random([-360, 360]), duration: .45, ease: 'power2.out' })
          .to(ch, { y: 0, duration: .9, ease: 'bounce.out' }).set(ch, { rotation: 0 });
      }));
    }
  }

  /* ---------- section heading reveals ---------- */
  function initReveals() {
    if (reduce) return;
    $$('.reveal').forEach(h => {
      SplitText.create(h, { type: 'lines,words', mask: 'lines', linesClass: 'rl', autoSplit: true, onSplit(self) {
        return gsap.from(self.words, { yPercent: 110, rotation: 6, duration: .9, stagger: .05, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
      }});
    });
    gsap.from('.exp-card', { y: 80, rotation: -2, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.exp-card', start: 'top 85%', once: true } });
  }

  /* ---------- about: words light up as you scroll ---------- */
  function initAbout() {
    if (reduce) return;
    SplitText.create('.about-lead', { type: 'words', autoSplit: true, onSplit(self) {
      return gsap.fromTo(self.words, { opacity: .14 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: '.about-lead', start: 'top 80%', end: 'bottom 45%', scrub: true } });
    }});
  }

  /* ---------- projects: horizontal ride, tilt, looping mockups ---------- */
  function initProjects() {
    const section = $('.projects'), track = $('.track');
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      section.classList.add('is-horizontal');
      const dist = () => track.scrollWidth - document.documentElement.clientWidth;
      // The track moves ~1.8px sideways per 1px of vertical scroll, so getting past the
      // section doesn't take a marathon of scrolling.
      const SPEED = 1.8;
      const items = $$('.track > *');
      // progress (0-1) at which each item sits at the left edge of the track
      const stops = () => {
        const d = dist(), first = items[0].offsetLeft;
        const p = items.map(el => gsap.utils.clamp(0, 1, (el.offsetLeft - first) / d));
        if (p[p.length - 1] < 1) p.push(1);
        return [...new Set(p)];
      };
      let snapPoints = [];
      const ride = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: {
        id: 'ride', trigger: '.pin', pin: true, anticipatePin: 1, scrub: .4, start: 'top top', end: () => '+=' + Math.round(dist() / SPEED), invalidateOnRefresh: true,
        onRefresh: () => { snapPoints = stops(); },
        snap: { snapTo: v => gsap.utils.snap(snapPoints, v), duration: { min: .2, max: .5 }, delay: .08, ease: 'power2.out' },
        onUpdate: s => gsap.set('.proj-progress i', { scaleX: s.progress })
      }});
      const st = ride.scrollTrigger;
      snapPoints = stops();

      // jump to the previous / next card
      const scrollToProgress = p => gsap.to(window, { scrollTo: { y: st.start + p * (st.end - st.start), autoKill: true }, duration: reduce ? 0 : .6, ease: 'power3.inOut', overwrite: true });
      const step = dir => {
        const p = st.progress, eps = .002;
        const next = dir > 0 ? snapPoints.find(v => v > p + eps) : [...snapPoints].reverse().find(v => v < p - eps);
        if (next !== undefined) scrollToProgress(next);
        else if (dir > 0) scrollToProgress(1); else scrollToProgress(0);
      };
      const prev = $('.proj-prev'), nextBtn = $('.proj-next');
      const onPrev = () => step(-1), onNext = () => step(1);
      prev && prev.addEventListener('click', onPrev);
      nextBtn && nextBtn.addEventListener('click', onNext);

      // horizontal trackpad swipes / shift+wheel move the ride too
      const onWheel = e => {
        if (!st.isActive) return;
        const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
        if (Math.abs(dx) <= Math.abs(e.deltaY) && !e.shiftKey) return;
        e.preventDefault();
        window.scrollBy(0, dx / SPEED);
      };
      section.addEventListener('wheel', onWheel, { passive: false });

      // arrow keys while the ride is on screen
      const onKey = e => {
        if (!st.isActive || e.altKey || e.ctrlKey || e.metaKey) return;
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      };
      addEventListener('keydown', onKey);

      // tabbing to an off-screen card brings it into view
      const onFocus = e => {
        const item = e.target.closest('.track > *');
        if (!item) return;
        const d = dist(), p = gsap.utils.clamp(0, 1, (item.offsetLeft - items[0].offsetLeft) / d);
        const r = item.getBoundingClientRect();
        if (r.left < 0 || r.right > innerWidth) { gsap.killTweensOf(window); window.scrollTo(0, st.start + p * (st.end - st.start)); }
      };
      track.addEventListener('focusin', onFocus);
      const cleanup = () => {
        prev && prev.removeEventListener('click', onPrev);
        nextBtn && nextBtn.removeEventListener('click', onNext);
        section.removeEventListener('wheel', onWheel);
        removeEventListener('keydown', onKey);
        track.removeEventListener('focusin', onFocus);
      };
      $$('.track > *').forEach(el => {
        gsap.from(el, { y: 90, rotation: 5, scrollTrigger: { trigger: el, containerAnimation: ride, start: 'left 105%', end: 'left 65%', scrub: true } });
      });
      $$('.poster').forEach(p => gsap.from(p, { scale: .5, rotation: -12, scrollTrigger: { trigger: p.closest('.card'), containerAnimation: ride, start: 'left 95%', end: 'left 50%', scrub: true } }));
      return () => { cleanup(); section.classList.remove('is-horizontal'); };
    });

    if (fine && !reduce) {
      $$('.card').forEach(card => {
        gsap.set(card, { transformPerspective: 900 });
        const rx = gsap.quickTo(card, 'rotationX', { duration: .5, ease: 'power3' }), ry = gsap.quickTo(card, 'rotationY', { duration: .5, ease: 'power3' });
        card.addEventListener('pointermove', e => {
          const r = card.getBoundingClientRect();
          rx(((e.clientY - r.top) / r.height - .5) * -9); ry(((e.clientX - r.left) / r.width - .5) * 11);
        });
        card.addEventListener('pointerleave', () => { rx(0); ry(0); });
        const poster = $('.poster', card), blob = $('.poster-shape', card);
        if (poster) {
          card.addEventListener('pointerenter', () => { gsap.to(poster, { scale: 1.12, rotation: -4, duration: .5, ease: 'back.out(2)' }); gsap.to(blob, { scale: 1.6, rotation: '+=90', duration: .8, ease: 'power3.out' }); });
          card.addEventListener('pointerleave', () => { gsap.to(poster, { scale: 1, rotation: 0, duration: .6, ease: 'elastic.out(1,.5)' }); gsap.to(blob, { scale: 1, duration: .8, ease: 'power3.out' }); });
        }
      });
    }

    if (reduce) return;
    // document workflow token
    const steps = $$('.art-docs .step'), token = $('.art-docs .token');
    const flow = gsap.timeline({ repeat: -1, repeatDelay: .6 });
    gsap.set(token, { y: 0 });
    steps.forEach((s, i) => {
      flow.to(token, { y: s.offsetTop, duration: .6, ease: 'back.inOut(2)' }, i ? '+=.25' : 0)
        .add(() => s.classList.add('lit'))
        .fromTo(s, { scale: 1 }, { scale: 1.06, yoyo: true, repeat: 1, duration: .15 });
    });
    flow.to(token, { rotation: 360, scale: 1.3, duration: .5, ease: 'back.out(2)' }, '+=.2')
      .to(token, { scale: 1, rotation: 360, duration: .3 })
      .add(() => steps.forEach(s => s.classList.remove('lit')), '+=.6')
      .set(token, { rotation: 0 });
    // training pills
    const wait = $('.art-train .pill.wait');
    gsap.timeline({ repeat: -1, repeatDelay: 1.2 })
      .to(wait, { scale: 0, duration: .25, delay: 1.2, onComplete: () => { wait.textContent = 'Complete'; wait.classList.remove('wait'); } })
      .to(wait, { scale: 1, duration: .5, ease: 'back.out(3)' })
      .to(wait, { scale: 0, duration: .25, delay: 1.8, onComplete: () => { wait.textContent = 'In progress'; wait.classList.add('wait'); } })
      .to(wait, { scale: 1, duration: .5, ease: 'back.out(3)' });
    // visitor typing
    gsap.timeline({ repeat: -1, repeatDelay: .8 })
      .to('.art-visit .field i', { width: (i) => i ? '55%' : '70%', duration: 1, stagger: .9, ease: 'steps(9)' })
      .to('.art-visit .submit', { scale: .92, duration: .12, yoyo: true, repeat: 1 })
      .to('.art-visit .submit', { backgroundColor: '#3FCB97', color: '#16183A', duration: .2 })
      .to('.art-visit .field i', { width: 0, duration: .3, delay: 1 })
      .to('.art-visit .submit', { backgroundColor: '#16183A', color: '#fff', duration: .2 }, '<');
  }

  /* ---------- skills: scatter, throw, tidy with Flip ---------- */
  function initSkills() {
    const box = $('#toolbox'), pile = $('.pile', box), modeBtn = $('#mode-btn'), shakeBtn = $('#shake-btn');
    const chips = $$('.chip', box);
    chips.forEach(c => c._home = c.parentElement);
    let scattered = false;
    const drags = chips.map(chip => Draggable.create(chip, {
      type: 'x,y', bounds: pile, inertia: !reduce, edgeResistance: .7, zIndexBoost: true,
      onPress() { gsap.to(chip, { scale: 1.12, rotation: gsap.utils.random(-12, 12), duration: .2 }); },
      onRelease() { gsap.to(chip, { scale: 1, duration: .5, ease: 'elastic.out(1,.4)' }); }
    })[0]);
    drags.forEach(d => d.disable());

    const place = () => {
      const W = pile.clientWidth, H = pile.clientHeight - 50, pad = 14, taken = [];
      chips.forEach(chip => {
        const w = chip.offsetWidth, h = chip.offsetHeight;
        let x, y, tries = 0, hit;
        do {
          x = gsap.utils.random(pad, Math.max(pad, W - w - pad)); y = gsap.utils.random(pad, Math.max(pad, H - h - pad));
          hit = taken.some(r => x < r.x + r.w + 6 && x + w + 6 > r.x && y < r.y + r.h + 6 && y + h + 6 > r.y);
        } while (hit && ++tries < 60);
        taken.push({ x, y, w, h });
        chip.style.left = x + 'px'; chip.style.top = y + 'px';
      });
    };

    function scatter(opts = {}) {
      const state = Flip.getState(chips);
      // keep the box the same height in both modes so nothing below it shifts
      box.style.height = Math.max(box.offsetHeight, 480) + 'px';
      box.classList.add('scattered');
      chips.forEach(c => pile.appendChild(c));
      gsap.set(chips, { x: 0, y: 0, rotation: () => gsap.utils.random(-14, 14), scale: 1 });
      place();
      scattered = true;
      drags.forEach(d => { d.enable(); d.update(); });
      setUI();
      if (opts.drop) {
        gsap.from(chips, { y: () => -gsap.utils.random(300, 600), rotation: () => gsap.utils.random(-90, 90), duration: 1.4, ease: 'bounce.out', stagger: { each: .025, from: 'random' } });
      } else if (!reduce) {
        Flip.from(state, { duration: .9, ease: 'back.out(1.3)', stagger: { each: .015, from: 'random' }, absolute: true, onComplete: () => drags.forEach(d => d.update()) });
      }
    }
    function tidy() {
      const state = Flip.getState(chips);
      drags.forEach(d => d.disable());
      box.classList.remove('scattered');
      box.style.height = '';
      chips.forEach(c => { c.style.left = c.style.top = ''; c._home.appendChild(c); });
      gsap.set(chips, { x: 0, y: 0, rotation: 0, scale: 1 });
      scattered = false;
      setUI();
      if (!reduce) Flip.from(state, { duration: .8, ease: 'power3.inOut', stagger: .01, absolute: true });
      gsap.from('.group h3', { opacity: 0, x: -10, duration: .4, stagger: .05, delay: reduce ? 0 : .4 });
    }
    function setUI() {
      $('.btn-label', modeBtn).textContent = scattered ? 'Tidy up' : 'Scatter the toolbox';
      modeBtn.setAttribute('aria-pressed', scattered);
      shakeBtn.hidden = !scattered;
      if (!scattered) ScrollTrigger.refresh();
    }
    modeBtn.addEventListener('click', () => scattered ? tidy() : scatter());
    shakeBtn.addEventListener('click', () => {
      const W = pile.clientWidth, H = pile.clientHeight;
      chips.forEach(chip => {
        const r = { x: chip.offsetLeft, y: chip.offsetTop, w: chip.offsetWidth, h: chip.offsetHeight };
        gsap.to(chip, { x: gsap.utils.random(-r.x + 10, W - r.x - r.w - 10), y: gsap.utils.random(-r.y + 10, H - r.y - r.h - 60), rotation: gsap.utils.random(-40, 40), duration: reduce ? 0 : 1.1, ease: 'elastic.out(1,.45)', onComplete: () => drags[chips.indexOf(chip)].update() });
      });
      if (!reduce) gsap.fromTo(box, { x: -10 }, { x: 0, duration: .5, ease: 'elastic.out(1,.2)' });
    });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (scattered) { gsap.set(chips, { x: 0, y: 0 }); place(); drags.forEach(d => d.update()); } }, 200); });

    // desktop: tools fall into the box the first time you reach it
    if (fine && !reduce && innerWidth >= 900) {
      ScrollTrigger.create({ trigger: box, start: 'top 75%', once: true, onEnter: () => scatter({ drop: true }) });
    }
  }

  /* ---------- education timeline ---------- */
  function initEducation() {
    if (reduce) return;
    gsap.fromTo('.tl-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 80%', end: 'top 30%', scrub: true } });
    gsap.from('.now', { left: '0%', opacity: 0, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 80%', end: 'top 30%', scrub: true } });
    gsap.from('.tl-year', { yPercent: 60, opacity: 0, stagger: .2, duration: .9, ease: 'back.out(2)', scrollTrigger: { trigger: '.timeline', start: 'top 75%', once: true } });
    gsap.from('.tl-dot', { scale: 0, stagger: .3, duration: .7, ease: 'elastic.out(1,.4)', scrollTrigger: { trigger: '.timeline', start: 'top 70%', once: true } });
  }

  /* ---------- confetti for copied email ---------- */
  function confetti(el) {
    const r = el.getBoundingClientRect(), colors = ['#3B3AF0', '#FFC53D', '#3FCB97', '#FF7EAA', '#A385FF'];
    for (let i = 0; i < 36; i++) {
      const p = document.createElement('span');
      p.className = 'confetti';
      p.style.background = colors[i % colors.length];
      if (i % 3 === 0) p.style.borderRadius = '50%';
      document.body.appendChild(p);
      const ang = gsap.utils.random(-Math.PI, 0), v = gsap.utils.random(120, 320);
      gsap.set(p, { x: r.left + r.width / 2, y: r.top + r.height / 2, rotation: gsap.utils.random(0, 360) });
      gsap.timeline({ onComplete: () => p.remove() })
        .to(p, { x: `+=${Math.cos(ang) * v}`, duration: 1.4, ease: 'power2.out' }, 0)
        .to(p, { y: `+=${Math.sin(ang) * v}`, duration: .5, ease: 'power2.out' }, 0)
        .to(p, { y: `+=${gsap.utils.random(200, 380)}`, rotation: '+=540', duration: .9, ease: 'power2.in' }, .5)
        .to(p, { opacity: 0, duration: .3 }, 1.1);
    }
  }
})();
