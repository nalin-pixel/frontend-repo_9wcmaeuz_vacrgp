import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { AlarmClock, Lock, Unlock, Settings, BarChart3, Rocket, Play, Camera, Brain, Footprints } from 'lucide-react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Icon size={20} /></div>
      <div>
        <div className="text-zinc-400 text-sm">{label}</div>
        <div className="text-white text-xl font-semibold">{value}</div>
      </div>
    </div>
  )
}

function App() {
  const [userId, setUserId] = useState('demo-user')
  const [alarmTime, setAlarmTime] = useState('07:00')
  const [label, setLabel] = useState('Morning Focus')
  const [apps, setApps] = useState(['instagram','tiktok','twitter'])
  const [customApp, setCustomApp] = useState('')
  const [lockMinutes, setLockMinutes] = useState(45)
  const [taskType, setTaskType] = useState('puzzle')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [lock, setLock] = useState(null) // current lock event
  const [answer, setAnswer] = useState('')
  const [steps, setSteps] = useState(0)
  const [insights, setInsights] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  const appOptions = useMemo(() => (
    ['instagram','tiktok','twitter','facebook','snapchat','youtube','reddit']
  ), [])

  const toggleApp = (a) => {
    setApps(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  const addCustomApp = () => {
    const a = customApp.trim().toLowerCase()
    if (!a) return
    if (!apps.includes(a)) setApps(prev => [...prev, a])
    setCustomApp('')
  }

  const saveAlarm = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/alarms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          alarm_label: label,
          alarm_time: alarmTime,
          apps,
          lock_duration_minutes: lockMinutes,
          task_type: taskType,
        })
      })
      if (!res.ok) throw new Error('Failed to save alarm')
      await res.json()
      setMessage('Alarm saved. We will lock selected apps if you miss it.')
    } catch (e) {
      setMessage('Could not save alarm. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const simulateMiss = async () => {
    setMessage('')
    setLock(null)
    try {
      const url = new URL(`${API_BASE}/locks/simulate`)
      url.searchParams.set('user_id', userId)
      url.searchParams.set('task_type', taskType)
      url.searchParams.set('lock_minutes', String(lockMinutes))
      const res = await fetch(url.toString(), { method: 'POST' })
      const data = await res.json()
      setLock(data)
      setAnswer('')
      setSteps(0)
    } catch (e) {
      setMessage('Simulation failed.')
    }
  }

  const attemptUnlock = async () => {
    if (!lock) return
    try {
      const res = await fetch(`${API_BASE}/locks/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lock_id: lock.id,
          user_id: userId,
          task_type: lock.task_type,
          answer,
          steps: Number(steps)
        })
      })
      const data = await res.json()
      if (data.status === 'unlocked') {
        setMessage('Great job! Your apps are unlocked.')
        setLock({ ...lock, unlocked: true })
      } else if (data.status === 'already_unlocked') {
        setMessage('Already unlocked.')
      } else {
        setMessage(data.detail || 'Try again.')
      }
    } catch (e) {
      setMessage('Could not submit attempt.')
    }
  }

  const fetchInsights = async () => {
    setLoadingInsights(true)
    try {
      const url = new URL(`${API_BASE}/insights/morning`)
      url.searchParams.set('user_id', userId)
      const res = await fetch(url.toString())
      const data = await res.json()
      setInsights(data)
    } catch (e) {
      setInsights(null)
    } finally {
      setLoadingInsights(false)
    }
  }

  useEffect(() => { fetchInsights() }, [])

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),rgba(0,0,0,0))]" />

      {/* Hero */}
      <header className="relative">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-400"><Lock size={18} /></div>
            <div className="font-semibold">Sentinel Alarm</div>
          </div>
          <div className="text-zinc-400 text-sm flex items-center gap-2"><Settings size={16}/> Smart discipline for your mornings</div>
        </div>
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Wake up on time or your socials stay locked
            </h1>
            <p className="text-zinc-400 max-w-xl">
              Unlock your apps by completing a quick task. Choose puzzles, a confirmation photo, or a few steps. Customize lock duration and which apps are affected.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={saveAlarm} disabled={saving} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2 rounded-lg transition">
                <Rocket size={16}/> Save Alarm
              </button>
              <button onClick={simulateMiss} className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2 rounded-lg transition">
                <Play size={16}/> Simulate Missed Alarm
              </button>
            </div>
            {message && <div className="text-sm text-emerald-400">{message}</div>}
          </div>
          <div className="h-[380px] md:h-[460px] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/40">
            <Spline scene="https://prod.spline.design/mwBbOy4jrazr59EO/scene.splinecode" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </header>

      {/* Config & Insights */}
      <main className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
            <div className="flex items-center gap-2 mb-4 text-zinc-300"><AlarmClock size={18}/> Alarm configuration</div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400">User ID</label>
                <input value={userId} onChange={e=>setUserId(e.target.value)} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Label</label>
                <input value={label} onChange={e=>setLabel(e.target.value)} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Alarm time</label>
                <input type="time" value={alarmTime} onChange={e=>setAlarmTime(e.target.value)} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Lock duration (minutes)</label>
                <input type="number" min={5} max={1440} value={lockMinutes} onChange={e=>setLockMinutes(Number(e.target.value))} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-zinc-400">Unlock task</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    {k:'puzzle', label:'Puzzle', icon: Brain},
                    {k:'photo', label:'Photo', icon: Camera},
                    {k:'steps', label:'Steps', icon: Footprints},
                  ].map(opt => (
                    <button key={opt.k} onClick={()=>setTaskType(opt.k)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${taskType===opt.k?'border-emerald-500 bg-emerald-500/10 text-emerald-400':'border-zinc-800 bg-zinc-900 text-zinc-300'}`}>
                      <opt.icon size={16}/> {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-zinc-400">Apps to lock</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {appOptions.map(a => (
                    <button key={a} onClick={()=>toggleApp(a)} className={`px-3 py-1.5 rounded-full text-sm border ${apps.includes(a)?'bg-emerald-500/10 text-emerald-400 border-emerald-500':'bg-zinc-900 text-zinc-300 border-zinc-800'}`}>{a}</button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input value={customApp} onChange={e=>setCustomApp(e.target.value)} placeholder="Add custom app (e.g., whatsapp)" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" />
                  <button onClick={addCustomApp} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700">Add</button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Lock / Unlock Task */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
            <div className="flex items-center gap-2 mb-4 text-zinc-300"><Lock size={18}/> Current lock</div>
            {!lock && (
              <div className="text-zinc-500 text-sm">No active lock. Simulate a missed alarm to preview the experience.</div>
            )}
            {lock && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs ${lock.unlocked?'bg-emerald-500/10 text-emerald-400 border border-emerald-500':'bg-amber-500/10 text-amber-400 border border-amber-500'}`}>{lock.unlocked?'Unlocked':'Locked'}</div>
                  <div className="text-zinc-400 text-sm">Expires at: <span className="text-zinc-200">{new Date(lock.expires_at).toLocaleTimeString()}</span></div>
                </div>
                {lock.task_type === 'puzzle' && (
                  <div className="mt-2">
                    <div className="text-zinc-300 mb-2">Solve to unlock:</div>
                    <div className="text-lg font-medium mb-3">{lock.puzzle_question}</div>
                    <input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Your answer" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" />
                  </div>
                )}
                {lock.task_type === 'steps' && (
                  <div className="mt-2">
                    <div className="text-zinc-300 mb-2">Walk a few steps to unlock</div>
                    <div className="text-zinc-400 text-sm mb-2">Target: {lock.steps_target} steps</div>
                    <input type="number" value={steps} onChange={e=>setSteps(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" />
                  </div>
                )}
                {lock.task_type === 'photo' && (
                  <div className="mt-2">
                    <div className="text-zinc-300 mb-2">Take a quick photo to unlock</div>
                    <div className="text-zinc-500 text-sm mb-3">For demo, click submit to simulate a photo.</div>
                    <input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Type anything to simulate" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" />
                  </div>
                )}
                <div className="pt-2">
                  <button onClick={attemptUnlock} disabled={lock.unlocked} className="inline-flex items-center gap-2 bg-emerald-500 disabled:opacity-50 hover:bg-emerald-400 text-black font-medium px-4 py-2 rounded-lg transition">
                    <Unlock size={16}/> Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Insights */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
            <div className="flex items-center gap-2 mb-4 text-zinc-300"><BarChart3 size={18}/> Morning insights</div>
            {!insights && (
              <div className="text-zinc-500 text-sm">{loadingInsights? 'Loading...' : 'No data yet.'}</div>
            )}
            {insights && (
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Lock} label="Locks" value={insights.total_locks} />
                <StatCard icon={Unlock} label="Unlocked" value={insights.unlocked} />
                <StatCard icon={BarChart3} label="Success rate" value={`${Math.round(insights.success_rate*100)}%`} />
                <StatCard icon={AlarmClock} label="Avg attempts" value={insights.avg_attempts_per_lock.toFixed(2)} />
              </div>
            )}
            <button onClick={fetchInsights} className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2 rounded-lg transition">Refresh</button>
          </div>
        </aside>
      </main>

      <footer className="text-center text-zinc-500 text-xs py-8">
        Built for focus. Customize your mornings and keep distractions at bay.
      </footer>
    </div>
  )
}

export default App
