import { useEffect, useState } from 'react'
import { childThemeMap, classNames } from '../lib/helpers'

function ChildSummaryCard({ child, stats, onQuickAdd, onNotesChange }) {
  const theme = childThemeMap[child.theme] ?? childThemeMap.coral
  const progressValue = Math.min(100, Math.round(((stats.readingMinutes ?? 0) / (child.readingGoalMinutes || 1)) * 100))
  const [draftNotes, setDraftNotes] = useState(child.notes ?? '')

  useEffect(() => {
    setDraftNotes(child.notes ?? '')
  }, [child.notes])

  return (
    <article className="overflow-hidden rounded-[1.8rem] border border-white/70 bg-white shadow-soft">
      <div className={classNames('bg-gradient-to-r p-5 text-white', theme.gradient)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-white/80">{child.grade}</p>
            <h3 className="mt-1 font-display text-3xl">{child.name}</h3>
            <p className="mt-1 text-sm text-white/90">{child.teacher}</p>
          </div>
          <button
            type="button"
            onClick={() => onQuickAdd(child.id)}
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/30"
          >
            Quick add
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Due soon" value={stats?.dueSoon ?? 0} tone={theme.badge} />
          <Metric label="Overdue" value={stats?.overdue ?? 0} tone="bg-rose-100 text-rose-700 border-rose-200" />
          <Metric label="Done" value={stats?.completed ?? 0} tone="bg-emerald-100 text-emerald-700 border-emerald-200" />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">Weekly reading goal</span>
            <span className="text-slate-500">
              {stats?.readingMinutes ?? 0}/{child.readingGoalMinutes} min
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className={classNames('h-full rounded-full transition-all', theme.progress)} style={{ width: `${progressValue}%` }} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Parent notes</label>
          <textarea
            value={draftNotes}
            onChange={(event) => setDraftNotes(event.target.value)}
            onBlur={() => {
              if (draftNotes !== (child.notes ?? '')) onNotesChange(child.id, draftNotes)
            }}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-plum focus:ring-4 focus:ring-plum/10"
          />
        </div>
      </div>
    </article>
  )
}

function Metric({ label, value, tone }) {
  return (
    <div className={classNames('rounded-2xl border px-4 py-3', tone)}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  )
}

export default ChildSummaryCard
