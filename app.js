(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Nav ---------- */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#navLinks a').forEach((a) =>
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    })
  );

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Owl: eyes follow the cursor, blink, wiggle on click ---------- */
  const owl = $('#owl');
  const pupils = $$('.pupil', owl);
  const lid = $('.lid', owl);

  function lookAt(clientX, clientY) {
    const r = owl.getBoundingClientRect();
    const scale = r.width / 120;
    pupils.forEach((p) => {
      const cx = r.left + Number(p.dataset.cx) * scale;
      const cy = r.top + Number(p.dataset.cy) * scale;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const max = 8; // max pupil travel in SVG units
      const k = Math.min(max, dist / 25) / dist;
      p.setAttribute('transform', `translate(${(dx * k).toFixed(2)} ${(dy * k).toFixed(2)})`);
    });
  }
  window.addEventListener('pointermove', (e) => lookAt(e.clientX, e.clientY), { passive: true });

  async function blink() {
    lid.setAttribute('height', '44');
    await wait(110);
    lid.setAttribute('height', '0');
  }
  (function blinkLoop() {
    setTimeout(async () => {
      if (!reduce) await blink();
      blinkLoop();
    }, 2500 + Math.random() * 3000);
  })();

  owl.addEventListener('click', () => {
    owl.classList.remove('wiggle');
    void owl.getBoundingClientRect();
    owl.classList.add('wiggle');
    blink();
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.section-head, .demo-grid, .walk, .g-step, .steps li, .practice, .feature, .use, .eth, .sg, .plan, .faq details, .download-inner');
  revealEls.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      }),
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));

  /* ---------- Live demo ---------- */
  const DEMOS = [
    {
      small: 'Great, thanks for the intro. Let’s do some design.',
      q: 'How would you design a rate limiter for a public API?',
      sections: [
        ['Approach', ['<b>Token bucket</b> per API key, stored in <code>Redis</code>', 'Refill at a fixed rate; return <code>429</code> when empty', 'Use Lua scripts so check-and-decrement is atomic']],
        ['Trade-offs', ['Sliding window is fairer but costs more memory', 'Mention per-region limits for global traffic']],
      ],
    },
    {
      small: 'Hi! Thanks for making the time today.',
      q: 'So, tell me about yourself.',
      sections: [
        ['Structure: present → past → future', ['<b>Now:</b> your current role and one big win with a number', '<b>Before:</b> 1–2 experiences that led here', '<b>Next:</b> why this role is the logical next step']],
        ['Tip', ['Keep it under 90 seconds and end on the role you’re interviewing for']],
      ],
    },
    {
      small: 'Let’s talk about how you work with people.',
      q: 'Tell me about a time you disagreed with a teammate.',
      sections: [
        ['Use STAR', ['<b>Situation:</b> the project and what was at stake', '<b>Task:</b> the decision you disagreed on', '<b>Action:</b> how you used data and listened first', '<b>Result:</b> the outcome and what you learned']],
        ['Avoid', ['Blaming the teammate. Show empathy and shared goals']],
      ],
    },
    {
      small: 'Quick SQL one for you.',
      q: 'How would you find the second-highest salary in a table?',
      sections: [
        ['Answer', ['<code>SELECT MAX(salary) FROM emp WHERE salary &lt; (SELECT MAX(salary) FROM emp);</code>', 'Or use <code>DENSE_RANK() OVER (ORDER BY salary DESC)</code> and filter rank = 2']],
        ['Follow-up to expect', ['Handling ties and NULLs, and the Nth-highest version']],
      ],
    },
  ];

  const tEl = $('#hudTranscript');
  const aEl = $('#hudAnswers');
  const statusEl = $('#hudStatus');
  let runId = 0;

  async function typeLine(who, text, isQ, id) {
    const line = document.createElement('div');
    line.className = 't-line' + (isQ ? ' q' : '');
    line.innerHTML = `<b>${who}</b><span class="caret"></span>`;
    tEl.appendChild(line);
    const span = line.querySelector('span');
    for (let i = 1; i <= text.length; i++) {
      if (id !== runId) return false;
      span.textContent = text.slice(0, i);
      await wait(reduce ? 0 : 22);
    }
    span.classList.remove('caret');
    return true;
  }

  async function playDemo(i) {
    const id = ++runId;
    const d = DEMOS[i];
    tEl.innerHTML = '';
    aEl.innerHTML = '';
    statusEl.textContent = 'Listening · mock interview';
    if (!(await typeLine('Interviewer', d.small, false, id))) return;
    await wait(350);
    if (!(await typeLine('Interviewer', d.q, true, id))) return;
    if (id !== runId) return;

    statusEl.textContent = 'Question detected · coaching…';
    const card = document.createElement('div');
    card.className = 'a-card';
    card.innerHTML = `<div class="aq">Q: ${d.q}</div><div class="thinking"><i></i><i></i><i></i> Thinking…</div>`;
    aEl.appendChild(card);
    await wait(reduce ? 0 : 900);
    if (id !== runId) return;

    card.querySelector('.thinking').remove();
    const lis = [];
    d.sections.forEach(([title, items]) => {
      const h = document.createElement('h4');
      h.textContent = title;
      const ul = document.createElement('ul');
      items.forEach((html) => {
        const li = document.createElement('li');
        li.innerHTML = html;
        ul.appendChild(li);
        lis.push(li);
      });
      card.append(h, ul);
    });
    for (const li of lis) {
      if (id !== runId) return;
      li.classList.add('show');
      await wait(reduce ? 0 : 260);
    }
    statusEl.textContent = 'Listening · mock interview';
  }

  const chips = $$('.chip');
  chips.forEach((c) =>
    c.addEventListener('click', () => {
      chips.forEach((x) => x.classList.toggle('active', x === c));
      playDemo(Number(c.dataset.demo));
    })
  );

  // Autoplay when the demo scrolls into view, then cycle until the visitor clicks
  let autoCycle = true;
  chips.forEach((c) => c.addEventListener('click', () => (autoCycle = false)));
  const demoIO = new IntersectionObserver(
    async (entries) => {
      if (!entries[0].isIntersecting) return;
      demoIO.disconnect();
      let i = 0;
      while (autoCycle) {
        chips.forEach((x, k) => x.classList.toggle('active', k === i));
        await playDemo(i);
        await wait(3500);
        if (!autoCycle) break;
        i = (i + 1) % DEMOS.length;
      }
    },
    { threshold: 0.35 }
  );
  demoIO.observe($('#hud'));

  /* ---------- Practice: question generator ---------- */
  const BANK = {
    sde: {
      label: 'Software engineer',
      qs: [
        ['Easy', 'What happens when you type a URL into your browser and press Enter?', ['DNS lookup turns the domain into an IP', 'TCP + TLS handshake', 'HTTP request, server response, then rendering (DOM, CSS, JS)', 'Mention caching at each layer']],
        ['Medium', 'How would you design a URL shortener like bit.ly?', ['Clarify scale: reads far exceed writes', 'Base62 IDs from a counter or hash', 'Key-value store + cache for hot links', 'Analytics via an async event queue']],
        ['Medium', 'Explain the difference between a process and a thread.', ['Processes have separate memory; threads share it', 'Threads are cheaper to create and switch', 'Shared memory means you need locks and have to watch for races', 'Give a real example from your work']],
        ['Hard', 'How would you find the top 10 trending hashtags in real time?', ['Stream events through Kafka', 'Count per sliding window (count-min sketch at scale)', 'Min-heap of size 10 per window', 'Trade exactness for memory, and say so']],
      ],
    },
    pm: {
      label: 'Product manager',
      qs: [
        ['Easy', 'What is your favourite product and why?', ['Pick something you really use', 'The user, their problem, and why this solves it well', 'One thing you would improve, with a metric']],
        ['Medium', 'Daily active users dropped 10% last week. What do you do?', ['Check the data first: tracking bugs, seasonality', 'Segment by platform, region, version and cohort', 'Internal vs external causes', 'Form hypotheses, then prioritise fixes']],
        ['Medium', 'How would you improve Google Maps for bikers?', ['Pick a user segment and their journey', 'List pain points: safety, elevation, parking', 'Prioritise with impact vs effort', 'Define success metrics']],
        ['Hard', 'Should Swiggy launch a grocery subscription?', ['Goal: retention, AOV or frequency?', 'Target users and willingness to pay', 'Unit economics and cannibalisation', 'An MVP experiment and a clear go/no-go metric']],
      ],
    },
    data: {
      label: 'Data analyst',
      qs: [
        ['Easy', 'What is the difference between INNER JOIN and LEFT JOIN?', ['INNER keeps only matching rows', 'LEFT keeps all left rows, with NULLs where there is no match', 'Give an example: customers without orders']],
        ['Medium', 'How would you measure the success of a new checkout page?', ['Primary metric: conversion rate', 'Guardrails: AOV, errors, load time', 'A/B test with enough sample size', 'Check novelty effects over 2+ weeks']],
        ['Medium', 'Explain p-value to a non-technical manager.', ['How surprising the result would be if nothing had really changed', 'Small p-value: unlikely to be chance', 'It is not the probability the idea is true']],
        ['Hard', 'Sales look flat overall but grew in every region. How?', ["Simpson's paradox", 'The mix shifted toward lower-volume regions', 'Show a weighted vs unweighted breakdown']],
      ],
    },
    design: {
      label: 'Designer',
      qs: [
        ['Easy', 'Walk me through your design process.', ['Understand: research and constraints', 'Define the problem and success', 'Explore, prototype, test', 'Ship, measure, iterate, with one real example']],
        ['Medium', 'Redesign the ATM experience for first-time users.', ['Who: new users, elderly, low literacy', 'Pain points: jargon, time pressure, card retrieval', 'Ideas: clear language, voice, bigger targets', 'Measure errors and time to cash']],
        ['Medium', 'How do you handle feedback you disagree with?', ['Understand the goal behind the feedback', 'Bring evidence: user data, usability tests', 'Propose a quick test instead of arguing']],
        ['Hard', 'Design a smartwatch app for managing medication.', ['Tiny screen, glanceable, one tap to act', 'Reminders, confirm dose, escalate to a caregiver', 'Accessibility and trust (privacy)']],
      ],
    },
    hr: {
      label: 'Behavioural',
      qs: [
        ['Easy', 'Why do you want to work here?', ['Company mission or product you connect with', 'How your skills match the role', 'What you want to learn and grow into']],
        ['Medium', 'Tell me about a time you failed.', ['Pick a real, moderate failure', 'Own it, without blaming anyone', 'What you changed afterwards and the result']],
        ['Medium', 'Describe a time you led without authority.', ['STAR format', 'How you built alignment: data, empathy, small wins', 'Quantify the outcome']],
        ['Hard', 'What is your biggest weakness?', ['A real but non-critical weakness', 'Concrete steps you are taking to improve', 'Evidence it is getting better']],
      ],
    },
  };

  let role = 'sde';
  let lastIdx = -1;
  let timerId = null;
  const qCard = $('#qCard');
  const qText = $('#qText');
  const qRole = $('#qRole');
  const qLevel = $('#qLevel');
  const outline = $('#outline');
  const revealBtn = $('#revealBtn');
  const timer = $('#timer');
  const timerFill = $('#timerFill');
  const timerText = $('#timerText');

  $$('.role').forEach((b) =>
    b.addEventListener('click', () => {
      $$('.role').forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-checked', String(x === b));
      });
      role = b.dataset.role;
      lastIdx = -1;
      hoot();
    })
  );

  function hoot() {
    const set = BANK[role];
    let idx;
    do { idx = Math.floor(Math.random() * set.qs.length); } while (idx === lastIdx && set.qs.length > 1);
    lastIdx = idx;
    const [level, q, points] = set.qs[idx];

    qCard.classList.remove('flip');
    void qCard.offsetWidth;
    qCard.classList.add('flip');

    setTimeout(() => {
      qRole.textContent = set.label;
      qLevel.textContent = level;
      qLevel.className = 'lvl ' + level.toLowerCase();
      qText.textContent = q;
      outline.hidden = true;
      outline.innerHTML = '';
      points.forEach((p, k) => {
        const li = document.createElement('li');
        li.textContent = p;
        li.style.animationDelay = k * 90 + 'ms';
        outline.appendChild(li);
      });
      revealBtn.hidden = false;
      revealBtn.textContent = 'Reveal answer outline';
      startTimer();
    }, 200);
  }

  function startTimer() {
    clearInterval(timerId);
    timer.hidden = false;
    const total = 30;
    let left = total;
    timerFill.style.transform = 'scaleX(1)';
    timerText.textContent = `Think for ${left}s…`;
    timerId = setInterval(() => {
      left -= 1;
      timerFill.style.transform = `scaleX(${left / total})`;
      timerText.textContent = left > 0 ? `Think for ${left}s…` : 'Time! How did you do?';
      if (left <= 0) { clearInterval(timerId); showOutline(); }
    }, 1000);
  }

  function showOutline() {
    clearInterval(timerId);
    timer.hidden = true;
    outline.hidden = false;
    revealBtn.hidden = true;
  }

  $('#hootBtn').addEventListener('click', hoot);
  revealBtn.addEventListener('click', showOutline);

  /* ---------- Pricing toggle ---------- */
  $$('.billing-toggle button').forEach((b) =>
    b.addEventListener('click', () => {
      $$('.billing-toggle button').forEach((x) => x.classList.toggle('active', x === b));
      const mode = b.dataset.bill;
      $$('[data-month]').forEach((el) => (el.textContent = el.dataset[mode]));
    })
  );

  /* ---------- Chrome link placeholder ---------- */
  $('#chromeLink').addEventListener('click', (e) => {
    if ($('#chromeLink').getAttribute('href') === '#') {
      e.preventDefault();
      alert('The Chrome Web Store link is coming soon.');
    }
  });
  /* ---------- Reviews & feedback form ---------- */
  // Form submissions are emailed to FEEDBACK_EMAIL via FormSubmit (free, no sign-up).
  // The very first submission sends a one-time "Activate form" email to that address: click it once.
  // After activating, FormSubmit gives you a random alias; swap it in below to hide your email from the page source.
  const FEEDBACK_EMAIL = 'gethootie.ai@gmail.com';
  const FORM_ENDPOINT = `https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`;

  const fbForm = $('#fbForm');
  const stars = $$('#stars button');
  const ratingInput = $('#ratingInput');
  const fbStatus = $('#fbStatus');
  const msgLabel = $('#msgLabel');
  const fbMessage = $('#fbMessage');
  const TYPE_COPY = {
    Review: ['Your review', 'How did Hootie help you prepare?'],
    Feedback: ['Your feedback', 'What works well, and what feels off?'],
    Suggestion: ['Your idea', 'What should Hootie do next?'],
    Bug: ['What went wrong?', 'What did you do, what happened, and which app (Mac or Chrome)?'],
  };

  function paintStars(v) { stars.forEach((s) => s.classList.toggle('on', Number(s.dataset.v) <= v)); }
  stars.forEach((s) => {
    s.addEventListener('click', () => { ratingInput.value = s.dataset.v; paintStars(Number(s.dataset.v)); });
    s.addEventListener('mouseenter', () => paintStars(Number(s.dataset.v)));
  });
  $('#stars').addEventListener('mouseleave', () => paintStars(Number(ratingInput.value || 0)));

  $$('input[name="type"]', fbForm).forEach((r) =>
    r.addEventListener('change', () => {
      const isReview = r.value === 'Review';
      $('#ratingRow').hidden = !isReview;
      $('#publishRow').hidden = !isReview;
      msgLabel.textContent = TYPE_COPY[r.value][0];
      fbMessage.placeholder = TYPE_COPY[r.value][1];
    })
  );

  fbForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(fbForm).entries());
    if (data._gotcha) return; // spam bot
    const field = fbMessage.closest('.fb-field');
    if (!data.message || data.message.trim().length < 3) {
      field.classList.add('invalid');
      fbStatus.className = 'fb-status err';
      fbStatus.textContent = 'Please write a short message first.';
      fbMessage.focus();
      return;
    }
    field.classList.remove('invalid');
    if (data.type !== 'Review') { delete data.rating; delete data.publish; }

    const btn = $('#fbSubmit');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    fbStatus.className = 'fb-status';
    fbStatus.textContent = '';

    try {
      if (location.protocol === 'file:') {
        throw new Error('The form can\'t send from a file opened by double-click. Run "npx serve ." in the website folder and open http://localhost:3000, or use the live site.');
      }
      if (FORM_ENDPOINT) {
        // Never leave the button stuck on "Sending…": give up waiting after 12s.
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12000);
        let res;
        try {
          res = await fetch(FORM_ENDPOINT, {
          signal: ctrl.signal,
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, _gotcha: undefined, _subject: `New Hootie ${data.type}${data.rating ? ' (' + data.rating + '★)' : ''}`, _template: 'table', _captcha: 'false' }),
          });
        } catch (e) {
          clearTimeout(timer);
          if (e.name === 'AbortError') {
            // The email service is slow to answer, but the message has usually been delivered already.
            showThanks(data.type, true);
            return;
          }
          throw e;
        }
        clearTimeout(timer);
        let out = {};
        try { out = JSON.parse(await res.text()); } catch (e) { /* not JSON */ }
        if (res.ok && out.success === undefined) out.success = true; // treat a plain 200 as sent
        console.log('[Hootie feedback] FormSubmit response', res.status, out);
        const ok = res.ok && (out.success === true || out.success === 'true');
        if (!ok) {
          const msg = String(out.message || '');
          if (/activat/i.test(msg)) {
            throw new Error('Almost there: the form needs a one-time activation. Check the inbox (and spam) of ' + FEEDBACK_EMAIL + ' for an email from FormSubmit and click "Activate Form", then send again.');
          }
          throw new Error(msg || `Couldn't send (error ${res.status}).`);
        }
        showThanks(data.type);
      } else {
        const lines = [
          `Type: ${data.type}`,
          data.rating ? `Rating: ${data.rating}/5` : '',
          data.name ? `Name: ${data.name}` : '',
          data.role ? `Role: ${data.role}` : '',
          data.email ? `Email: ${data.email}` : '',
          data.publish ? 'OK to publish: yes' : '',
          '',
          data.message,
        ].filter((l, i) => l !== '' || i === 6);
        window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Hootie ' + data.type)}&body=${encodeURIComponent(lines.join('\n'))}`;
        fbStatus.className = 'fb-status ok';
        fbStatus.textContent = 'Your email app should open with your message ready to send.';
        btn.disabled = false;
        btn.textContent = 'Send to Hootie';
      }
    } catch (err) {
      fbStatus.className = 'fb-status err';
      const why = err && err.message && !/Failed to fetch|NetworkError|Load failed/i.test(err.message) ? err.message : `Couldn't reach the feedback service. Check your internet or ad-blocker, or email ${FEEDBACK_EMAIL}.`;
      fbStatus.textContent = why;
      btn.disabled = false;
      btn.textContent = 'Send to Hootie';
    }
  });

  function showThanks(type, slow) {
    fbForm.innerHTML = `
      <div class="fb-done">
        <img src="assets/icon-192.png" alt="" width="80" height="80" />
        <h3>Hoot hoot, thank you! 🦉</h3>
        <p>${slow ? `Your ${type.toLowerCase()} is on its way. It can take a minute to arrive.` : `Your ${type.toLowerCase()} landed safely.`} We read every message.</p>
        <button type="button" class="btn btn-ghost btn-sm" onclick="location.reload()">Send another</button>
      </div>`;
  }
  /* ---------- Suggest the right Mac download ---------- */
  (async () => {
    const arm = $('#macDownload'), intel = $('#macIntelDownload');
    if (!arm || !intel) return;
    let isIntel = null;
    try {
      if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        const v = await navigator.userAgentData.getHighEntropyValues(['architecture']);
        if (v.architecture) isIntel = v.architecture === 'x86';
      }
    } catch (e) { /* ignore */ }
    const isWin = /Windows/i.test(navigator.userAgent);
    const win = $('#winDownload');
    if (isWin && win) {
      arm.classList.replace('btn-primary', 'btn-ghost'); arm.classList.add('light');
      win.classList.replace('btn-ghost', 'btn-primary'); win.classList.remove('light');
      win.parentNode.insertBefore(win, arm);
      return;
    }
    const isMac = /Mac/i.test(navigator.platform || '') || /Mac OS X/i.test(navigator.userAgent);
    if (isMac && isIntel === true) {
      arm.classList.replace('btn-primary', 'btn-ghost'); arm.classList.add('light');
      intel.classList.replace('btn-ghost', 'btn-primary'); intel.classList.remove('light');
      intel.parentNode.insertBefore(intel, arm);
    }
  })();
  /* ---------- Setup walkthrough (animated "video") ---------- */
  (() => {
    const walk = $('#walk');
    if (!walk) return;
    const mock = $('#mock');
    const video = $('#walkVideo');
    // If a real screen recording exists at assets/setup.mp4, show it instead of the animation.
    fetch('assets/setup.mp4', { method: 'HEAD' }).then((r) => {
      if (r.ok && (r.headers.get('content-type') || '').includes('video')) {
        mock.hidden = true; video.hidden = false; video.controls = true;
      }
    }).catch(() => {});

    const el = (id) => $('#' + id);
    const steps = $$('#walkSteps li');
    const cursor = el('mCursor');
    const KEYS = ['sk-ant-••••••••A1f', 'sk-ant-••••••••9Qz'];
    let step = 0, playing = true, timer = null, typing = null, token = 0;

    function moveCursor(target) {
      if (!target) return;
      const m = mock.getBoundingClientRect(), r = target.getBoundingClientRect();
      cursor.style.left = (r.left - m.left + r.width * 0.6) + 'px';
      cursor.style.top = (r.top - m.top + r.height * 0.55) + 'px';
    }
    function typeInto(node, text, speed, t) {
      return new Promise((res) => {
        let i = 0; clearInterval(typing);
        typing = setInterval(() => {
          if (t !== token) { clearInterval(typing); return res(); }
          node.textContent = text.slice(0, ++i);
          if (i >= text.length) { clearInterval(typing); res(); }
        }, reduce ? 0 : speed);
      });
    }
    function view(which) {
      el('mHud').hidden = which !== 'hud';
      el('mSettings').hidden = which !== 'settings';
    }
    function resetSettings(upTo) {
      el('mProvider').textContent = upTo >= 1 ? 'Anthropic (Claude)' : 'OpenAI';
      el('mLlm').textContent = upTo >= 3 ? KEYS.join('\n') : '';
      el('mLlmBadge').textContent = upTo >= 3 ? 'Active key: 1 / 2' : 'Active key: none';
      el('mLlmBadge').classList.toggle('ok', upTo >= 3);
      el('mGroq').textContent = upTo >= 4 ? 'gsk_••••••••Xw2' : '';
      el('mGroqBadge').textContent = upTo >= 4 ? 'Active key: 1 / 1' : 'Active key: none';
      el('mGroqBadge').classList.toggle('ok', upTo >= 4);
      el('mResume').textContent = upTo >= 5 ? '✓ resume.pdf' : '📄 Upload resume';
      el('mResume').classList.toggle('done', upTo >= 5);
      $$('.m-focus', mock).forEach((n) => n.classList.remove('m-focus'));
    }
    function resetHud() {
      el('mHudStatus').textContent = 'Hootie is ready';
      $('.m-status', mock).classList.remove('on');
      el('mTranscript').innerHTML = '<span class="m-dim">Waiting for audio…</span>';
      el('mAnswer').innerHTML = '<span class="m-dim">Answers appear here</span>';
      el('mToast').classList.remove('show');
    }

    async function show(n) {
      const t = ++token;
      step = n;
      steps.forEach((li, i) => { li.classList.toggle('on', i === n); li.classList.toggle('done', i < n); });
      el('mGear').classList.remove('hit'); el('mSave').classList.remove('hit');
      const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
      if (n === 0) {
        resetHud(); view('hud'); moveCursor(el('mTranscript'));
        await wait(500); if (t !== token) return;
        moveCursor(el('mGear')); await wait(700); if (t !== token) return;
        el('mGear').classList.add('hit');
      } else if (n >= 1 && n <= 4) {
        view('settings'); resetSettings(n);
        if (n === 1) { moveCursor(el('mProvider')); await wait(600); if (t !== token) return; el('mProvider').classList.add('m-focus'); el('mProvider').textContent = 'Anthropic (Claude)'; }
        if (n === 2) {
          const a = el('mLlm'); moveCursor(a); a.classList.add('m-focus');
          await typeInto(a, KEYS.join('\n'), 45, t); if (t !== token) return;
          el('mLlmBadge').textContent = 'Active key: 1 / 2'; el('mLlmBadge').classList.add('ok');
        }
        if (n === 3) {
          const g = el('mGroq'); moveCursor(g); g.classList.add('m-focus');
          await typeInto(g, 'gsk_••••••••Xw2', 55, t); if (t !== token) return;
          el('mGroqBadge').textContent = 'Active key: 1 / 1'; el('mGroqBadge').classList.add('ok');
        }
        if (n === 4) {
          moveCursor(el('mResume')); await wait(600); if (t !== token) return;
          el('mResume').textContent = '✓ resume.pdf'; el('mResume').classList.add('done');
          await wait(500); if (t !== token) return;
          moveCursor(el('mSave')); await wait(650); if (t !== token) return;
          el('mSave').classList.add('hit');
        }
      } else if (n === 5 || n === 6) {
        view('hud'); resetHud();
        $('.m-status', mock).classList.add('on');
        el('mHudStatus').textContent = 'Listening · mock interview';
        moveCursor(el('mAnswer'));
        el('mTranscript').innerHTML = '<b>Interviewer</b> ';
        const tspan = document.createElement('span'); el('mTranscript').appendChild(tspan);
        await typeInto(tspan, 'Tell me about a project you are proud of.', 28, t); if (t !== token) return;
        await wait(400); if (t !== token) return;
        el('mAnswer').innerHTML = '<ul style="padding:0;margin:0"><li>Lead with the impact (a number)</li><li>Your role and the hard part</li><li>What you would do differently</li></ul>';
        if (n === 6) {
          await wait(500); if (t !== token) return;
          el('mToast').classList.add('show');
        }
      }
    }

    function schedule() {
      clearTimeout(timer);
      if (!playing) return;
      const dur = [2200, 2000, 3400, 2600, 3000, 3600, 3400][step] || 2500;
      timer = setTimeout(() => { show((step + 1) % steps.length).then(schedule); }, dur);
    }
    function go(n) { show(n).then(schedule); }

    steps.forEach((li, i) => li.addEventListener('click', () => { go(i); }));
    $('#walkNext').addEventListener('click', () => go((step + 1) % steps.length));
    $('#walkPrev').addEventListener('click', () => go((step - 1 + steps.length) % steps.length));
    const playBtn = $('#walkPlay');
    playBtn.addEventListener('click', () => {
      playing = !playing;
      playBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
      if (playing) schedule(); else clearTimeout(timer);
    });

    // Start when the walkthrough scrolls into view.
    const wio = new IntersectionObserver((en) => {
      if (en[0].isIntersecting) { wio.disconnect(); go(0); }
    }, { threshold: 0.3 });
    wio.observe(walk);
    resetSettings(0); resetHud();

    // OS tabs in step 1
    $$('.tabs-os button').forEach((b) => b.addEventListener('click', () => {
      $$('.tabs-os button').forEach((x) => x.classList.toggle('active', x === b));
      $$('.os-pane').forEach((p) => (p.hidden = p.dataset.os !== b.dataset.os));
    }));
    if (/Windows/i.test(navigator.userAgent)) { const w = $('.tabs-os button[data-os="win"]'); if (w) w.click(); }

    /* ---------- Stealth Demo Toggle ---------- */
    const btnSeeSelf = $('#btnSeeSelf');
    const btnSeeInterviewer = $('#btnSeeInterviewer');
    const stealthHud = $('#stealthHud');
    const recruiterWatermark = $('#recruiterWatermark');

    if (btnSeeSelf && btnSeeInterviewer) {
      btnSeeSelf.addEventListener('click', () => {
        btnSeeSelf.classList.add('active');
        btnSeeInterviewer.classList.remove('active');
        stealthHud.classList.remove('hidden-hud');
        recruiterWatermark.classList.remove('visible');
      });

      btnSeeInterviewer.addEventListener('click', () => {
        btnSeeInterviewer.classList.add('active');
        btnSeeSelf.classList.remove('active');
        stealthHud.classList.add('hidden-hud');
        recruiterWatermark.classList.add('visible');
      });
    }
  })();
})();

