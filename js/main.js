// HumanoidVerse — Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFeaturedRobots();
  initNews();
  initNewsletter();
  initScrollAnimations();
  initModal();
  initCounterAnimations();
  initParallaxHero();
});

// ── Navbar ──
function initNavbar() {
  const toggle = document.getElementById('mobileToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.navbar')) links.classList.remove('open');
    });
  }
  // Scroll effect
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.style.borderBottomColor = window.scrollY > 50 ? 'rgba(255,255,255,0.08)' : 'transparent';
  });
}

// ── Featured Robots (top 5) ──
function initFeaturedRobots() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = ROBOTS.slice(0, 6);
  grid.innerHTML = featured.map(r => createRobotCard(r)).join('');
}

// ── Robot Card HTML ──
function createRobotCard(robot) {
  return `
    <div class="robot-card fade-in" data-robot-id="${robot.id}" onclick="openRobotModal('${robot.id}')">
      <div class="robot-card-image" style="background: linear-gradient(135deg, ${robot.color}15, ${robot.color}05);">
        <span class="placeholder-icon">🤖</span>
        <span class="card-badge">${robot.status}</span>
      </div>
      <div class="robot-card-body">
        <div class="manufacturer">${robot.manufacturer} · ${robot.country}</div>
        <h3>${robot.name}</h3>
        <p class="tagline">${robot.tagline}</p>
        <div class="robot-card-specs">
          <div class="mini-spec"><div class="val">${robot.specs.height}cm</div><div class="lbl">Height</div></div>
          <div class="mini-spec"><div class="val">${robot.specs.dof}</div><div class="lbl">DoF</div></div>
          <div class="mini-spec"><div class="val">${robot.specs.speed}m/s</div><div class="lbl">Speed</div></div>
        </div>
      </div>
      <div class="robot-card-footer">
        <span class="price">${robot.price.length > 20 ? robot.price.substring(0, 20) + '…' : robot.price}</span>
        <span class="arrow">→</span>
      </div>
    </div>`;
}

// ── News ──
function initNews() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  grid.innerHTML = NEWS.map(n => `
    <div class="news-card fade-in">
      <div class="news-meta">
        <span class="news-category">${n.category}</span>
        <span class="news-date">${new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
      <h3>${n.title}</h3>
      <p>${n.excerpt}</p>
    </div>`).join('');
}

// ── Newsletter ──
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.textContent = '✓ Subscribed!';
    btn.style.background = 'var(--accent-green)';
    setTimeout(() => { btn.textContent = 'Subscribe'; btn.style.background = ''; }, 3000);
  });
}

// ── Scroll Animations ──
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ── Modal ──
function initModal() {
  const overlay = document.getElementById('robotModal');
  const close = document.getElementById('modalClose');
  if (!overlay || !close) return;
  close.addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.classList.remove('active');
  });
}

function openRobotModal(robotId) {
  const robot = ROBOTS.find(r => r.id === robotId);
  if (!robot) return;
  const modal = document.getElementById('robotModal');
  const body = document.getElementById('modalBody');
  const hero = modal.querySelector('.modal-hero');
  hero.style.background = `linear-gradient(135deg, ${robot.color}20, ${robot.color}08)`;

  const numericSpecs = ['height', 'weight', 'dof', 'speed', 'payload', 'battery'];

  body.innerHTML = `
    <span class="robot-status">${robot.status}</span>
    <h2>${robot.name} <span style="font-weight:400; font-size:0.6em; color: var(--text-secondary);">${robot.generation}</span></h2>
    <p class="modal-maker">${robot.manufacturer} · ${robot.country} · ${robot.year}</p>
    <p class="modal-desc">${robot.description}</p>
    <div class="specs-grid">
      ${numericSpecs.map(key => `
        <div class="spec-card">
          <div class="spec-icon">${SPEC_LABELS[key].icon}</div>
          <div class="spec-val">${robot.specs[key]}${SPEC_LABELS[key].unit ? ' ' + SPEC_LABELS[key].unit : ''}</div>
          <div class="spec-lbl">${SPEC_LABELS[key].label}</div>
        </div>`).join('')}
    </div>
    <div class="pros-cons">
      <div>
        <h4 style="color: var(--accent-green);">✓ Strengths</h4>
        <ul class="pros-list">${robot.pros.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
      <div>
        <h4 style="color: var(--accent-red);">✗ Weaknesses</h4>
        <ul class="cons-list">${robot.cons.map(c => `<li>${c}</li>`).join('')}</ul>
      </div>
    </div>
    <div class="modal-price">
      <span class="price-label">Estimated Price</span>
      <span class="price-value">${robot.price}</span>
    </div>`;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.modal-close').onclick = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };
}

// ── Robots Page Functions ──
function initRobotsPage() {
  const grid = document.getElementById('allRobotsGrid');
  const search = document.getElementById('searchInput');
  const catFilter = document.getElementById('categoryFilter');
  const mfgFilter = document.getElementById('manufacturerFilter');
  const sortSelect = document.getElementById('sortSelect');

  if (!grid) return;

  function render() {
    let filtered = [...ROBOTS];
    const q = (search?.value || '').toLowerCase();
    const cat = catFilter?.value || 'All';
    const mfg = mfgFilter?.value || 'All';
    const sort = sortSelect?.value || 'name';

    if (q) filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(q) || r.manufacturer.toLowerCase().includes(q) || r.tagline.toLowerCase().includes(q));
    if (cat !== 'All') filtered = filtered.filter(r => r.category === cat);
    if (mfg !== 'All') filtered = filtered.filter(r => r.manufacturer === mfg);

    filtered.sort((a, b) => {
      switch(sort) {
        case 'name': return a.name.localeCompare(b.name);
        case 'year': return b.year - a.year;
        case 'height': return b.specs.height - a.specs.height;
        case 'speed': return b.specs.speed - a.specs.speed;
        case 'dof': return b.specs.dof - a.specs.dof;
        case 'payload': return b.specs.payload - a.specs.payload;
        default: return 0;
      }
    });

    grid.innerHTML = filtered.length ? filtered.map(r => createRobotCard(r)).join('')
      : '<p style="text-align:center; color: var(--text-secondary); grid-column: 1/-1; padding: 60px 0;">No robots found matching your criteria.</p>';

    // Re-init scroll animations for new cards
    setTimeout(() => {
      document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
        el.classList.add('visible');
      });
    }, 50);
  }

  // Populate filters
  if (catFilter) {
    const uniqueCats = ['All', ...new Set(ROBOTS.map(r => r.category))];
    catFilter.innerHTML = uniqueCats.map(c => `<option value="${c}">${c}</option>`).join('');
  }
  if (mfgFilter) {
    mfgFilter.innerHTML = '<option value="All">All Manufacturers</option>' + MANUFACTURERS.map(m => `<option value="${m}">${m}</option>`).join('');
  }

  search?.addEventListener('input', render);
  catFilter?.addEventListener('change', render);
  mfgFilter?.addEventListener('change', render);
  sortSelect?.addEventListener('change', render);

  render();
}

// ── Compare Page Functions ──
function initComparePage() {
  const sel1 = document.getElementById('robot1Select');
  const sel2 = document.getElementById('robot2Select');
  if (!sel1 || !sel2) return;

  const opts = '<option value="">Select a Robot...</option>' + ROBOTS.map(r => `<option value="${r.id}">${r.name} — ${r.manufacturer}</option>`).join('');
  sel1.innerHTML = opts;
  sel2.innerHTML = opts;

  // Set defaults
  sel1.value = 'atlas';
  sel2.value = 'optimus';

  function renderComparison() {
    renderRobotPanel('compare1', sel1.value);
    renderRobotPanel('compare2', sel2.value);
    highlightWinners();
  }

  sel1.addEventListener('change', renderComparison);
  sel2.addEventListener('change', renderComparison);
  renderComparison();
}

function renderRobotPanel(panelId, robotId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  if (!robotId) {
    panel.innerHTML = '<p style="color: var(--text-secondary); font-size: 1.2rem;">Select a robot to compare</p>';
    panel.classList.remove('filled');
    return;
  }

  const r = ROBOTS.find(x => x.id === robotId);
  if (!r) return;

  panel.classList.add('filled');
  const specKeys = ['height', 'weight', 'dof', 'speed', 'payload', 'battery'];

  panel.innerHTML = `
    <div style="text-align:center; margin-bottom: 20px;">
      <div style="width:80px; height:80px; border-radius:50%; background: linear-gradient(135deg, ${r.color}30, ${r.color}10);
        display:flex; align-items:center; justify-content:center; margin: 0 auto 12px; font-size: 2rem;">🤖</div>
      <h3 class="compare-robot-name">${r.name}</h3>
      <p class="compare-robot-maker">${r.manufacturer}</p>
    </div>
    <div class="compare-specs-list">
      ${specKeys.map(key => `
        <div class="compare-spec-row" data-spec="${key}">
          <span class="spec-label">${SPEC_LABELS[key].icon} ${SPEC_LABELS[key].label}</span>
          <span class="spec-value" data-val="${r.specs[key]}">${r.specs[key]}${SPEC_LABELS[key].unit ? ' ' + SPEC_LABELS[key].unit : ''}</span>
        </div>`).join('')}
      <div class="compare-spec-row">
        <span class="spec-label">🛡️ IP Rating</span>
        <span class="spec-value">${r.specs.ip_rating}</span>
      </div>
      <div class="compare-spec-row">
        <span class="spec-label">⚙️ Actuator</span>
        <span class="spec-value">${r.specs.actuator}</span>
      </div>
      <div class="compare-spec-row" style="border-bottom:none;">
        <span class="spec-label">💰 Price</span>
        <span class="spec-value" style="color: var(--accent-green); font-size: 0.8rem;">${r.price}</span>
      </div>
    </div>`;
}

function highlightWinners() {
  const panel1 = document.getElementById('compare1');
  const panel2 = document.getElementById('compare2');
  if (!panel1 || !panel2) return;

  const higherIsBetter = ['dof', 'speed', 'payload', 'battery'];
  const lowerIsBetter = ['weight'];

  ['height', 'weight', 'dof', 'speed', 'payload', 'battery'].forEach(spec => {
    const row1 = panel1.querySelector(`[data-spec="${spec}"] .spec-value`);
    const row2 = panel2.querySelector(`[data-spec="${spec}"] .spec-value`);
    if (!row1 || !row2) return;

    const v1 = parseFloat(row1.dataset.val);
    const v2 = parseFloat(row2.dataset.val);
    if (isNaN(v1) || isNaN(v2) || v1 === v2) return;

    if (higherIsBetter.includes(spec)) {
      if (v1 > v2) { row1.classList.add('winner'); row2.classList.add('loser'); }
      else { row2.classList.add('winner'); row1.classList.add('loser'); }
    } else if (lowerIsBetter.includes(spec)) {
      if (v1 < v2) { row1.classList.add('winner'); row2.classList.add('loser'); }
      else { row2.classList.add('winner'); row1.classList.add('loser'); }
    }
  });
}

// ── Animated Counters ──
function initCounterAnimations() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const text = el.textContent;
  const match = text.match(/(\d+)/);
  if (!match) return;

  const target = parseInt(match[1]);
  const suffix = text.replace(match[1], '');
  const duration = 1500;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── Parallax Hero Mouse Effect ──
function initParallaxHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    const bg = hero.querySelector('.hero-bg');
    if (bg) {
      bg.style.transform = `translate(${x * 20}px, ${y * 15}px)`;
    }
  });

  hero.addEventListener('mouseleave', () => {
    const bg = hero.querySelector('.hero-bg');
    if (bg) bg.style.transform = 'translate(0, 0)';
  });
}
