// So Sun Studios — small page behaviours. No libraries: the site must stay a plain static page.

// Clips never play by themselves. Scroll is the playhead: scrolling down steps a clip forward,
// scrolling up steps it back, and when the reader stops, the clip stops.
// Each clip is a set of JPEG sheets (4x4 frames each, made by tools/make-frames.py) painted on a
// canvas. Video seeking was tried first and froze on phones: iOS Safari drops most seeks during
// a touch scroll. Painting from an already-decoded image is instant on every device.
const seqs = [...document.querySelectorAll('canvas.seq')]
const near = new Set() // Canvases on or near the screen. Only these get painted.
const sheetCache = new Map() // url -> Image. The reel and the game list share the same sheets.

function sheet (url) {
  let img = sheetCache.get(url)
  if (!img) {
    img = new Image()
    img.decoding = 'async'
    img.onload = requestTick // A sheet that lands late may hold the frame on screen now.
    img.src = url
    sheetCache.set(url, img)
  }
  return img
}

function setup (c) {
  const d = c.dataset
  c._n = +d.n
  c._cols = +d.cols
  c._per = c._cols * c._cols
  c._fw = +d.w
  c._fh = +d.h
  c._ctx = c.getContext('2d')
  c._last = -1
  // Ask for every sheet now: the first one first, so the opening frames are ready soonest.
  c._sheets = []
  for (let i = 0; i < Math.ceil(c._n / c._per); i++) c._sheets.push(sheet(`${d.seq}/sheet-${i + 1}.jpg`))
}

const loadWatch = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const c = e.target
    if (e.isIntersecting) {
      if (!c._sheets) setup(c)
      near.add(c)
    } else {
      near.delete(c)
    }
  }
  requestTick()
}, { rootMargin: '400px 0px' })
seqs.forEach((c) => loadWatch.observe(c))

// Keep the canvas pixel size equal to its on-screen size (capped at 2x for memory on phones).
function fit (c) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.round(c.clientWidth * dpr)
  const h = Math.round(c.clientHeight * dpr)
  if (w && h && (c.width !== w || c.height !== h)) { c.width = w; c.height = h; c._last = -1 }
}

// Pick the frame from how far the canvas has travelled through the screen
// (0 = entering at the bottom, 1 = leaving at the top), then paint it cover-cropped.
function paint (c) {
  fit(c)
  const r = c.getBoundingClientRect()
  const vh = window.innerHeight
  const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
  let f = Math.round(p * (c._n - 1))
  // If that frame's sheet has not arrived yet, fall back to the nearest loaded one.
  const ready = (i) => { const im = c._sheets[Math.floor(i / c._per)]; return im.complete && im.naturalWidth > 0 }
  if (!ready(f)) {
    let alt = -1
    for (let k = 1; k < c._n && alt < 0; k++) {
      if (f - k >= 0 && ready(f - k)) alt = f - k
      else if (f + k < c._n && ready(f + k)) alt = f + k
    }
    if (alt < 0) return // Nothing loaded yet: the poster background keeps showing.
    f = alt
  }
  if (f === c._last) return
  c._last = f
  const img = c._sheets[Math.floor(f / c._per)]
  const cell = f % c._per
  const fx = (cell % c._cols) * c._fw
  const fy = Math.floor(cell / c._cols) * c._fh
  const s = Math.max(c.width / c._fw, c.height / c._fh)
  const sw = c.width / s
  const sh = c.height / s
  c._ctx.drawImage(img, fx + (c._fw - sw) / 2, fy + (c._fh - sh) / 2, sw, sh, 0, 0, c.width, c.height)
  c.style.backgroundImage = 'none' // The canvas now covers the poster; stop painting both.
}

// The hero reel also slides sideways with scroll, so nothing moves while the page is still.
const reelTrack = document.querySelector('.reel__track')

let ticking = false
function requestTick () {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    near.forEach(paint)
    if (reelTrack) reelTrack.style.setProperty('--x', `${-window.scrollY * 0.6}px`)
  })
}
window.addEventListener('scroll', requestTick, { passive: true })
window.addEventListener('resize', requestTick)
requestTick()

// Fade sections up as they arrive. Runs once per element.
const reveal = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target) }
  }
}, { threshold: 0.12 })
document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el))

// Grow the green spine line as the reader scrolls through the game list.
const spine = document.querySelector('.spine')
const line = spine && spine.querySelector('.spine__line')
if (line) {
  const draw = () => {
    const r = spine.getBoundingClientRect()
    const mid = window.innerHeight * 0.6 // The line "arrives" a little below the middle of the screen.
    const p = Math.min(1, Math.max(0, (mid - r.top) / r.height))
    line.style.setProperty('--p', p.toFixed(4))
  }
  window.addEventListener('scroll', draw, { passive: true })
  window.addEventListener('resize', draw)
  draw()
}

// Lightbox for the stills. Esc, or a click anywhere, closes it.
const box = document.querySelector('.lightbox')
const boxImg = box && box.querySelector('img')
document.querySelectorAll('[data-full]').forEach((b) => {
  b.addEventListener('click', () => {
    boxImg.src = b.dataset.full
    boxImg.alt = b.querySelector('img')?.alt || ''
    box.classList.add('open')
  })
})
if (box) {
  const close = () => box.classList.remove('open')
  box.addEventListener('click', close)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
}

// "Sign up to try!" — the button opens into an email field. A send posts the game and the
// address to FormSubmit, which emails the studio. GitHub Pages has no server, so a form relay
// is the only way a static page can send mail.
// FormSubmit needs a one-time activation: the first submission sends an "Activate Form" email
// to this address, and nothing is delivered until someone clicks it.
const SIGNUP_ENDPOINT = 'https://formsubmit.co/ajax/soe.sun.games@gmail.com'
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

document.querySelectorAll('form.signup').forEach((form) => {
  const game = form.dataset.game
  const open = form.querySelector('.signup__open')
  const field = form.querySelector('.signup__field')
  const input = form.querySelector('input[type="email"]')
  const trap = form.querySelector('.signup__trap')
  const msg = form.querySelector('.signup__msg')
  const say = (text, isError) => { msg.textContent = text; msg.classList.toggle('is-error', !!isError) }

  // Clear an old error as soon as the player starts fixing the address.
  input.addEventListener('input', () => { if (msg.classList.contains('is-error')) say('') })

  open.addEventListener('click', () => {
    open.hidden = true
    field.hidden = false
    input.focus()
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (form.classList.contains('is-sending')) return
    const email = input.value.trim()
    if (!EMAIL_OK.test(email)) { say('Please type a full email address, like name@example.com.', true); input.focus(); return }

    form.classList.add('is-sending')
    say('Sending…')
    try {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `Sign-up to try: ${game}`,
          _template: 'table',
          _captcha: 'false',
          _honey: trap.value, // Filled only by bots. FormSubmit discards those.
          _replyto: email, // So "Reply" in the inbox goes straight to the player.
          game,
          email
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || String(data.success) === 'false') throw new Error(data.message || `HTTP ${res.status}`)
      form.classList.add('is-done')
      field.hidden = true
      say(`Thanks! We'll email you when ${game} is ready to try.`)
      // Count the sign-up, never the address.
      try { if (window.posthog && posthog.capture) posthog.capture('site_signup', { game }) } catch (_) {}
    } catch (err) {
      say('That did not go through. Please try again, or email soe.sun.games@gmail.com.', true)
    } finally {
      form.classList.remove('is-sending')
    }
  })
})
