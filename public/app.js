import { content } from './content.js';
import { giscusConfig } from './giscus-config.js';
const $ = (selector) => document.querySelector(selector);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

if (!reducedMotion.matches) document.body.classList.add('js-motion');
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
}), { threshold: .08 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

function updateTime() {
  $('#local-time').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}
updateTime(); setInterval(updateTime, 30000);

function visual(project) {
  let artwork = '';
  if (project.id === 'orbit') artwork = '<div class="orbit-browser"><div class="browser-bar"><i></i><i></i><i></i></div><div class="orbit-nav">dragon / v1.5<small>WINDOWS DESKTOP COMPANION</small></div><div class="orbit-title">Desktop friend.<br><em>Always nearby.</em></div><div class="orbit-bottom">DRAG · WALK · READ · REST &nbsp; ⟶</div><div class="orbit-ball"></div></div>';
  if (project.id === 'forma') artwork = '<div class="forma-sheet"><strong>form®</strong><small>DESIGN. CODE. A LITTLE MAGIC.</small><div class="forma-shape"></div></div>';
  if (project.id === 'echo') {
    const paths = Array.from({ length: 36 }, (_, i) => {
      const points = Array.from({ length: 100 }, (_, j) => {
        const x = j * 4.2;
        const envelope = Math.sin(j / 99 * Math.PI) ** 1.7;
        const y = 60 + i * 4.3 + Math.sin(j / 17 + i / 10) * 62 * envelope + Math.sin(j / 9 - i / 13) * 21 * envelope;
        return `${j ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      return `<path d="${points}"/>`;
    }).join('');
    artwork = `<svg class="wave-art" viewBox="0 0 420 280" aria-hidden="true">${paths}</svg>`;
  }
  return `<div class="project-visual ${escapeHTML(project.className)}"><span class="visual-label">${escapeHTML(project.id.toUpperCase())}® / ${escapeHTML(project.year)}</span>${artwork}<span class="visual-number">FIG. ${escapeHTML(project.index)}</span></div>`;
}

let projects = [];
function renderProjects(filter = 'all') {
  const selected = projects.filter(p => filter === 'all' || p.category === filter);
  $('#projects').innerHTML = selected.map(project => `<article class="project"><button class="project-button" data-project="${escapeHTML(project.id)}" aria-label="查看 ${escapeHTML(project.title)}">${visual(project)}<div class="project-meta"><div><p class="mono">${escapeHTML(project.label)} &nbsp; / &nbsp; ${escapeHTML(project.year)}</p><h3>${escapeHTML(project.title)}</h3></div><span class="project-arrow" aria-hidden="true">↗</span></div></button></article>`).join('');
}

function openDialog(dialog) { dialog.showModal(); document.body.style.overflow = 'hidden'; }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
  dialog.addEventListener('click', e => { const r = dialog.getBoundingClientRect(); if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close(); });
});

$('.filters').addEventListener('click', e => {
  const button = e.target.closest('[data-filter]');
  if (!button) return;
  document.querySelectorAll('[data-filter]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  renderProjects(button.dataset.filter);
});
$('#projects').addEventListener('click', e => {
  const button = e.target.closest('[data-project]');
  if (!button) return;
  const project = projects.find(p => p.id === button.dataset.project);
  $('#detail-content').innerHTML = `<p class="eyebrow">${escapeHTML(project.label)} / PROJECT NOTES</p><h2>${escapeHTML(project.title)}</h2>${visual(project)}<p class="detail-text">${escapeHTML(project.description)}</p><div class="detail-tags">${project.stack.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div><p class="detail-text">${escapeHTML(project.details)}</p>${project.url ? `<a class="detail-source" href="${escapeHTML(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(project.action)} ↗</a>` : ''}${project.secondaryUrl ? `<a class="detail-source" href="${escapeHTML(project.secondaryUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(project.secondaryAction)} ↗</a>` : ''}`;
  openDialog($('#detail-dialog'));
});

async function loadContent() {
  try {
    const data = content;
    projects = data.projects;
    $('#profile-name').textContent = data.profile.name;
    renderProjects();
    $('#notes-list').innerHTML = data.notes.map((note, i) => `<button class="note" data-note="${i}"><span class="mono">${escapeHTML(note.tag)}</span><h3>${escapeHTML(note.title)}</h3><span class="mono">${escapeHTML(note.date)}</span><span aria-hidden="true">↗</span></button>`).join('');
    $('#notes-list').addEventListener('click', e => {
      const button = e.target.closest('[data-note]'); if (!button) return;
      const note = data.notes[Number(button.dataset.note)];
      $('#detail-content').innerHTML = `<p class="eyebrow">${escapeHTML(note.tag)} · ${escapeHTML(note.date)}</p><h2>${escapeHTML(note.title)}</h2><p class="detail-text">${escapeHTML(note.text)}</p>`;
      openDialog($('#detail-dialog'));
    });
  } catch {
    $('#projects').innerHTML = '<div class="loading">作品暂时未能加载。<button id="retry-content">点击重试 ↻</button></div>';
    $('#retry-content').addEventListener('click', loadContent);
  }
}
loadContent();

// Giscus uses a public GitHub Discussion; no private contact data is published.
const comments = document.querySelector('#comments-widget');
if (giscusConfig.repo && giscusConfig.repoId && giscusConfig.categoryId) {
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js'; script.async = true; script.crossOrigin = 'anonymous';
  const settings = {repo:giscusConfig.repo,'repo-id':giscusConfig.repoId,category:giscusConfig.category,'category-id':giscusConfig.categoryId,mapping:'specific',term:'FORM guestbook',strict:'1','reactions-enabled':'1','emit-metadata':'0','input-position':'top',theme:'light',lang:'zh-CN',loading:'lazy'};
  for (const [key,value] of Object.entries(settings)) script.setAttribute('data-'+key,value);
  script.addEventListener('error',()=>{document.querySelector('#comments-status').textContent='留言组件暂时无法加载，可以直接前往 GitHub 讨论区。';});
  document.querySelector('#comments-status').textContent='留言通过 GitHub Discussions 同步；如组件无法加载，可使用下方入口。';
  const fallback=document.querySelector('#discussion-link');fallback.href='https://github.com/'+giscusConfig.repo+'/discussions';fallback.hidden=false;
  comments.append(script);
}

// A parameterized toroidal sculpture: real 3D projection, no video or external assets.
const canvas = $('#sculpture'), panel = $('#art-panel'), ctx = canvas.getContext('2d');
let width = 0, height = 0, rotation = .35, pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
let paused = reducedMotion.matches, visible = true, frame = 0, lastTime = 0;
const points = [];
for (let ring = 0; ring < 145; ring++) {
  const u = ring / 145 * Math.PI * 2;
  for (let segment = 0; segment < 54; segment++) {
    const v = segment / 54 * Math.PI * 2;
    const minor = .42 + .055 * Math.sin(u * 3);
    const twist = v + u * 1.5;
    const r = 1.05 + minor * Math.cos(twist);
    points.push({ x: r * Math.cos(u), y: r * Math.sin(u), z: minor * Math.sin(twist), v, u });
  }
}
function resize() {
  width = panel.clientWidth; height = panel.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * dpr; canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (paused) draw(0);
}
function draw(delta) {
  if (!ctx || !width) return;
  rotation += delta * .00009;
  smoothX += (pointerX - smoothX) * .035; smoothY += (pointerY - smoothY) * .035;
  ctx.clearRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width * .5, height * .5, 0, width * .5, height * .5, width * .5);
  glow.addColorStop(0, '#5e3b242a'); glow.addColorStop(1, '#1a1b1800'); ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
  const ax = .72 + smoothY * .28, ay = -.38 + smoothX * .4, az = rotation;
  const ca = Math.cos(ax), sa = Math.sin(ax), cb = Math.cos(ay), sb = Math.sin(ay), cc = Math.cos(az), sc = Math.sin(az);
  const scale = Math.min(width * .285, height * .3);
  const projected = points.map(p => {
    const x = p.x * cc - p.y * sc, y = p.x * sc + p.y * cc;
    const y1 = y * ca - p.z * sa, z1 = y * sa + p.z * ca;
    const x2 = x * cb + z1 * sb, z2 = -x * sb + z1 * cb;
    const perspective = 4.5 / (4.5 - z2);
    return { x: width * .5 + x2 * scale * perspective, y: height * .49 + y1 * scale * perspective, z: z2, p, perspective };
  }).sort((a, b) => a.z - b.z);
  for (const point of projected) {
    const light = Math.max(0, Math.min(1, (point.z + 1.4) / 2.8));
    const stripe = .75 + .25 * Math.cos(point.p.v * 3 + point.p.u * 2);
    const hue = 16 + light * 14;
    ctx.fillStyle = `hsla(${hue},${65 + light * 20}%,${20 + light * 53}%,${.23 + light * .72})`;
    const radius = (.5 + light * .7) * point.perspective * stripe * Math.max(.7, width / 620);
    ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); ctx.fill();
  }
}
function animate(time) {
  frame = 0;
  if (paused || !visible || document.hidden) return;
  draw(Math.min(time - (lastTime || time), 40)); lastTime = time;
  frame = requestAnimationFrame(animate);
}
function syncAnimation() {
  cancelAnimationFrame(frame); frame = 0; lastTime = 0;
  document.body.classList.toggle('motion-paused', paused);
  $('#motion-toggle').textContent = paused ? '▷' : 'Ⅱ';
  $('#motion-toggle').setAttribute('aria-label', paused ? '播放粒子动画' : '暂停粒子动画');
  $('#motion-toggle').setAttribute('aria-pressed', String(paused));
  if (!paused && visible && !document.hidden) frame = requestAnimationFrame(animate);
}
panel.addEventListener('pointermove', e => { const rect = panel.getBoundingClientRect(); pointerX = ((e.clientX - rect.left) / rect.width - .5) * 2; pointerY = ((e.clientY - rect.top) / rect.height - .5) * 2; });
panel.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
$('#motion-toggle').addEventListener('click', () => { paused = !paused; syncAnimation(); });
new ResizeObserver(resize).observe(panel);
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncAnimation(); }).observe(panel);
document.addEventListener('visibilitychange', syncAnimation);
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncAnimation(); if (paused) draw(0); });
resize(); draw(0); syncAnimation();
