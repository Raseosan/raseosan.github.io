// So Sun Studios — small page behaviours. No libraries: the site must stay a plain static page.

// Clips never play by themselves. Scroll is the playhead: scrolling down moves a clip forward,
// scrolling up moves it back, and when the reader stops, the clip stops.
// The scrub.mp4 files carry a keyframe every 4 frames, so any seek lands fast and scrubbing stays smooth.
const clips = [...document.querySelectorAll('video[data-scrub]')]
const near = new Set() // Clips on or near the screen. Only these get seeked.

const loadWatch = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const v = e.target
    if (e.isIntersecting) {
      near.add(v)
      // Load the source on first sight only, so off-screen clips cost nothing.
      if (!v.dataset.loaded) {
        v.dataset.loaded = '1'
        for (const s of v.querySelectorAll('source[data-src]')) s.src = s.dataset.src
        v.preload = 'auto'
        v.load()
        // iOS Safari draws no frame after a seek until the video has played once. A muted
        // play-then-pause unlocks it; elsewhere it is harmless.
        v.addEventListener('loadeddata', () => {
          v.play().then(() => v.pause()).catch(() => {})
          requestTick()
        }, { once: true })
      }
    } else {
      near.delete(v)
    }
  }
}, { rootMargin: '300px 0px' })
clips.forEach((v) => loadWatch.observe(v))

// Map how far a clip has travelled through the screen (0 = entering at the bottom,
// 1 = leaving at the top) onto its timeline.
function scrub (v) {
  if (!v.duration || v.readyState < 1) return
  const r = v.getBoundingClientRect()
  const vh = window.innerHeight
  const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
  const t = p * (v.duration - 0.05)
  // Do not stack seeks: a new seek while one is pending makes Chrome drop frames.
  // The 'seeked' handler below picks up the latest position when this one lands.
  if (v.seeking) { v._want = t; return }
  if (Math.abs(v.currentTime - t) > 1 / 48) v.currentTime = t
}
clips.forEach((v) => v.addEventListener('seeked', () => {
  if (v._want != null) { const t = v._want; v._want = null; v.currentTime = t }
}))

// The hero reel also slides sideways with scroll, so nothing moves while the page is still.
const reelTrack = document.querySelector('.reel__track')

let ticking = false
function requestTick () {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    near.forEach(scrub)
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
