import { useEffect, useMemo, useState } from 'react'

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, targetDate - Date.now()))

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(Math.max(0, targetDate - Date.now()))
    }, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const parts = useMemo(() => {
    const total = Math.floor(timeLeft / 1000)
    const days = Math.floor(total / (3600 * 24))
    const hours = Math.floor((total % (3600 * 24)) / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const seconds = total % 60
    return { days, hours, minutes, seconds }
  }, [timeLeft])

  return parts
}

function App() {
  // Launch date in ~30 days by default
  const launchDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d
  }, [])

  const { days, hours, minutes, seconds } = useCountdown(launchDate.getTime())

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [subCount, setSubCount] = useState(null)

  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    // Fetch current number of subscribers (best-effort)
    ;(async () => {
      try {
        const res = await fetch(`${backendBase}/api/subscribers?limit=1`)
        if (res.ok) {
          const text = await res.text()
          const data = text ? JSON.parse(text) : []
          if (Array.isArray(data)) setSubCount('+' + Math.max(0, data.length))
        }
      } catch {}
    })()
  }, [backendBase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: 'loading', message: 'Submitting...' })

    // Simple client-side email validation
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' })
      return
    }

    try {
      const res = await fetch(`${backendBase}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'coming-soon' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(err.detail || 'Subscription failed')
      }
      setStatus({ type: 'success', message: "You're on the list! We'll keep you posted." })
      setEmail('')
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/80 backdrop-blur">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Building something new
        </div>

        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
          Coming Soon
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-white/70">
          Were crafting a modern experience. Be the first to know when we launch and get early access perks.
        </p>

        {/* Countdown */}
        <div className="mb-10 grid grid-cols-4 gap-3 sm:gap-4">
          {[{ label: 'Days', value: days }, { label: 'Hours', value: hours }, { label: 'Minutes', value: minutes }, { label: 'Seconds', value: seconds }].map((item) => (
            <div key={item.label} className="rounded-xl bg-white/5 p-4 backdrop-blur border border-white/10">
              <div className="text-3xl sm:text-4xl font-bold tabular-nums">{String(item.value).padStart(2, '0')}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-white/60">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Email capture */}
        <form onSubmit={handleSubmit} className="mx-auto mb-6 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20"
            required
          />
          <button
            type="submit"
            disabled={status.type === 'loading'}
            className="rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status.type === 'loading' ? 'Joining…' : 'Notify me'}
          </button>
        </form>

        {status.type !== 'idle' && (
          <p className={
            status.type === 'success'
              ? 'mb-8 text-emerald-300'
              : status.type === 'error'
              ? 'mb-8 text-rose-300'
              : 'mb-8 text-white/70'
          }>
            {status.message}
          </p>
        )}

        {/* Social proof / footer */}
        <div className="mt-4 flex items-center gap-3 text-sm text-white/60">
          <span>Early supporters</span>
          <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-white/80 border border-white/10">
            {subCount || 'Growing'}
          </span>
        </div>

        <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[{ title: 'Fast', desc: 'Performance-first experience' }, { title: 'Secure', desc: 'Best practices by default' }, { title: 'Polished', desc: 'Thoughtful details and design' }].map((f) => (
            <div key={f.title} className="rounded-xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur">
              <div className="text-base font-semibold">{f.title}</div>
              <div className="mt-1 text-sm text-white/70">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-xs text-white/50">
          Tip: set VITE_BACKEND_URL to your API to enable signups.
        </div>
      </div>
    </div>
  )
}

export default App
