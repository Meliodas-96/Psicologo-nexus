const WEBHOOK_URL = window.CONFIG?.WEBHOOK_URL;
const CHAT_SECRET = window.CONFIG?.CHAT_SECRET;

const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const sendIcon = document.getElementById('send-icon');
const messagesEl = document.getElementById('messages');
const chipsEl = document.getElementById('chips');
const typingEl = document.getElementById('typing');
const chatScroll = document.getElementById('chat-scroll');
const statusEl = document.getElementById('status');
const statusText = statusEl.querySelector('.status-text');
const statusDot = statusEl.querySelector('.status-dot');
const themeToggle = document.getElementById('theme-toggle');
const iconMoon = document.getElementById('icon-moon');
const iconSun = document.getElementById('icon-sun');

/* ============ Tema ============ */

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  iconMoon.classList.toggle('hidden', !dark);
  iconSun.classList.toggle('hidden', dark);
  if (window.__nexusSetBgTheme) window.__nexusSetBgTheme(dark);
}

applyTheme(localStorage.getItem('nexus-theme') || 'dark');

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem('nexus-theme', next);
  applyTheme(next);
});

/* ============ Tilt 3D en botones ============ */

document.querySelectorAll('.tilt').forEach((el) => {
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.classList.add('tilting');
    el.style.transform = `perspective(400px) rotateY(${px * 18}deg) rotateX(${py * -18}deg) scale(1.07)`;
  });
  el.addEventListener('mouseleave', () => {
    el.classList.remove('tilting');
    el.style.transform = '';
  });
});

/* ============ Ripple al hacer click ============ */

function attachRipple(el) {
  el.addEventListener('pointerdown', (e) => {
    const r = el.getBoundingClientRect();
    const dot = document.createElement('span');
    const size = Math.max(r.width, r.height);
    dot.className = 'ripple';
    dot.style.width = dot.style.height = size + 'px';
    dot.style.left = (e.clientX - r.left - size / 2) + 'px';
    dot.style.top = (e.clientY - r.top - size / 2) + 'px';
    el.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  });
}
attachRipple(sendBtn);
attachRipple(themeToggle);

/* ============ Sesion ============ */

function getSessionId() {
  let id = localStorage.getItem('nexus-session');
  if (!id) {
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    localStorage.setItem('nexus-session', id);
  }
  return id;
}

/* ============ Mensajes ============ */

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: 'smooth' });
  });
}

const AVATAR_BOT = '<img src="src/Logo.webp" alt="" class="w-[24px] h-[24px] rounded-full object-cover" />';
const AVATAR_USER = '<svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>';

function appendMessage(role, text, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = `message flex gap-3 items-end animate-fade-up${role === 'user' ? ' user flex-row-reverse' : ''}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${role === 'user' ? 'avatar-user' : 'avatar-bot'}`;
  avatar.innerHTML = role === 'user' ? AVATAR_USER : AVATAR_BOT;

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role === 'user' ? 'bubble-user' : 'bubble-bot'}`;
  if (opts.shimmer) bubble.classList.add('text-shimmer');
  bubble.innerHTML = escapeHtml(text);

  wrap.append(avatar, bubble);
  messagesEl.appendChild(wrap);
  scrollToBottom();
  return wrap;
}

/* ============ Chips de sugerencia ============ */

const SUGGESTIONS = [
  'Me siento ansioso',
  'No puedo dormir',
  'Tengo un conflicto con alguien',
  'Ayúdame a motivarme'
];

let chipsActive = true;
SUGGESTIONS.forEach((s) => {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.textContent = s;
  chip.addEventListener('click', () => {
    if (!chipsActive || sendBtn.disabled) return;
    sendMessage(s);
  });
  chipsEl.appendChild(chip);
});

function removeChips() {
  if (!chipsActive) return;
  chipsActive = false;
  chipsEl.style.transition = 'opacity .4s ease, transform .4s ease';
  chipsEl.style.opacity = '0';
  chipsEl.style.transform = 'translateY(8px)';
  setTimeout(() => chipsEl.remove(), 420);
}

/* ============ Estado ============ */

function setStatus(online, label) {
  statusText.textContent = label || (online ? 'En línea' : 'Sin conexión');
  statusDot.style.background = online ? '#34d399' : '#ff5c5c';
  statusDot.style.boxShadow = `0 0 10px ${online ? '#34d399' : '#ff5c5c'}`;
  statusEl.classList.toggle('offline', !online);
}

function setBusy(busy) {
  sendBtn.disabled = busy;
  input.disabled = busy;
  typingEl.classList.toggle('hidden', !busy);
  typingEl.classList.toggle('flex', busy);
  if (busy) scrollToBottom();
  else input.focus();
}

function extractReply(data) {
  if (data === null || data === undefined) return null;
  if (typeof data === 'string') return data;
  return data.output ?? data.message ?? data.text ?? data.reply ?? null;
}

/* ============ Envio ============ */

async function sendMessage(text) {
  removeChips();
  appendMessage('user', text);
  setBusy(true);

  sendIcon.classList.remove('fly');
  void sendIcon.offsetWidth;
  sendIcon.classList.add('fly');
  setTimeout(() => sendIcon.classList.remove('fly'), 600);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendMessage',
        sessionId: getSessionId(),
        chatInput: text,
        auth: CHAT_SECRET
      }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = raw; }
    const reply = extractReply(data);
    if (!reply) throw new Error('Respuesta vacía');
    appendMessage('assistant', String(reply));
    setStatus(true);
  } catch (err) {
    setStatus(false, 'Error');
    const msg = err.name === 'AbortError'
      ? 'Parece que me quedé pensando demasiado. ¿Me lo repites?'
      : 'Se me cortó la conexión un momento. ¿Puedes repetirme el mensaje?';
    appendMessage('assistant', msg);
  } finally {
    clearTimeout(timer);
    setBusy(false);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || sendBtn.disabled) return;
  input.value = '';
  sendMessage(text);
});

/* ============ Bienvenida ============ */

appendMessage('assistant', 'Bienvenido. Soy tu espacio de calma y claridad. Cuéntame qué te trae hoy aquí.', { shimmer: true });
setStatus(true);
input.focus();
