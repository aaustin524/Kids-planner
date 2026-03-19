import { useEffect, useState } from 'react'
import ChildSummaryCard from './ChildSummaryCard'
import SectionHeader from './SectionHeader'
import { EmptyState } from './ui'
import { formatDate } from '../lib/helpers'

function DashboardView({
  children,
  childStats,
  todayItems,
  importantDates,
  weeklyNotes,
  onWeeklyNotesChange,
  onQuickAdd,
  onChildNotesChange,
}) {
  const [weeklyNotesDraft, setWeeklyNotesDraft] = useState(weeklyNotes)

  useEffect(() => {
    setWeeklyNotesDraft(weeklyNotes)
  }, [weeklyNotes])

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
        <SectionHeader
          title="Dashboard"
          description="A quick look at both children, upcoming work, and reading progress across the week."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {children.map((child) => (
            <ChildSummaryCard
              key={child.id}
              child={child}
              stats={childStats[child.id]}
              onQuickAdd={onQuickAdd}
              onNotesChange={onChildNotesChange}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr,0.8fr]">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
          <SectionHeader
            title="Today"
            description="Assignments and planner tasks that need attention today."
          />

          <div className="space-y-3">
            {todayItems.length === 0 ? (
              <EmptyState
                title="Nothing urgent today"
                description="Your schedule is clear for today, or everything is already finished."
              />
            ) : (
              todayItems.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum">{item.kind}</p>
                  <h3 className="mt-2 font-display text-xl text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.childName}</p>
                  {item.meta ? <p className="mt-2 text-sm text-slate-600">{item.meta}</p> : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
          <SectionHeader
            title="Upcoming dates"
            description="Tests, projects, and school events coming up soon."
          />

          <div className="space-y-3">
            {importantDates.length === 0 ? (
              <EmptyState
                title="No upcoming dates"
                description="Add quizzes, field trips, and projects to keep the dashboard useful."
              />
            ) : (
              importantDates.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum">{item.type}</p>
                  <h3 className="mt-2 font-display text-xl text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.childName} · {formatDate(item.date)}
                  </p>
                  {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
          <SectionHeader
            title="Weekly notes"
            description="One shared parent note for the full week."
          />
          <textarea
            value={weeklyNotesDraft}
            onChange={(event) => setWeeklyNotesDraft(event.target.value)}
            onBlur={() => {
              if (weeklyNotesDraft !== weeklyNotes) onWeeklyNotesChange(weeklyNotesDraft)
            }}
            rows={7}
            className="w-full rounded-3xl border border-slate-200 bg-canvas px-4 py-4 text-sm text-slate-700 outline-none transition focus:border-plum focus:ring-4 focus:ring-plum/10"
          />
        </section>
      </div>
    </div>
  )
}

export default DashboardView
