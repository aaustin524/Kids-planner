import SectionHeader from './SectionHeader'
import { EmptyState, InputField, SelectField, TextAreaField } from './ui'
import { subjectOptions, weekdayOptions } from '../data/sampleData'
import { classNames, getCurrentWeekDates, getWeekdayLabel, subjectThemeMap } from '../lib/helpers'

function WeeklyPlannerView({
  children,
  plannerTasks,
  assignments,
  form,
  editingId,
  generatedPlannerCount,
  onGeneratePlan,
  onFormChange,
  onSubmit,
  onDeleteTask,
  onEditTask,
  onCancelEdit,
  onQuickAddDay,
}) {
  const week = getCurrentWeekDates()
  const hasPlannerTasks = plannerTasks.length > 0
  const hasGeneratedTasks = generatedPlannerCount > 0

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
      <SectionHeader
        title="Weekly Planner"
        description="Plan study blocks Monday through Friday and keep due work visible alongside manual tasks."
        action={
          <button
            type="button"
            onClick={onGeneratePlan}
            className={classNames(
              'rounded-2xl px-4 py-3 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-4 focus:ring-plum/10',
              generatedPlannerCount > 0
                ? 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                : 'bg-ink text-white hover:bg-slate-700',
            )}
          >
            {generatedPlannerCount > 0 ? 'Regenerate Plan' : 'Generate Weekly Plan'}
          </button>
        }
      />

      <div className="mb-6 rounded-[1.75rem] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4 shadow-sm sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Plan the week with one click</p>
            <p className="mt-1 text-sm text-slate-500">Generated tasks are refreshed each time. Manual tasks are preserved.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TaskModeBadge isGenerated label="Auto tasks" />
            <TaskModeBadge label="Manual tasks" />
          </div>
        </div>
      </div>

      {!hasPlannerTasks ? (
        <div className="mb-6">
          <EmptyState
            title="Build this week in a click"
            description="Generate a weekly plan from assignments and school dates, or start with a few manual tasks for the days that need extra structure."
          />
        </div>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(20rem,0.9fr),minmax(0,1.1fr)]">
        <div className="min-w-0 rounded-[1.75rem] border border-white/70 bg-canvas p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-display text-2xl text-ink">{editingId ? 'Edit planner task' : 'Add planner task'}</h3>
              <p className="mt-1 text-sm text-slate-500">Add a study block, after-school reminder, or custom family task.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-slate-200">
              Manual
            </span>
          </div>

          <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField label="Child" value={form.childId} onChange={(value) => onFormChange('childId', value)}>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Day" value={form.day} onChange={(value) => onFormChange('day', value)}>
                {weekdayOptions.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField label="Subject" value={form.subject} onChange={(value) => onFormChange('subject', value)}>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </SelectField>
              <InputField label="Time" value={form.time} onChange={(value) => onFormChange('time', value)} placeholder="4:00 PM" />
            </div>
            <InputField label="Task title" value={form.title} onChange={(value) => onFormChange('title', value)} placeholder="Study block or after-school task" helper="Required" />
            <TextAreaField label="Notes" value={form.notes} onChange={(value) => onFormChange('notes', value)} placeholder="Optional study note or reminder" />
            <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
              {editingId ? 'Save planner task' : 'Add to planner'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            ) : null}
          </form>
        </div>

        <div className="min-w-0 overflow-x-auto pb-2">
          <div className="grid min-w-[72rem] grid-cols-5 gap-4">
            {week.map((dayInfo) => {
              const tasksForDay = plannerTasks.filter((task) => task.day === dayInfo.day)
              const dueAssignments = assignments.filter((assignment) => getWeekdayLabel(assignment.dueDate) === dayInfo.day)
              const taskCount = tasksForDay.length + dueAssignments.length

              return (
                <div
                  key={dayInfo.day}
                  className={classNames(
                    'min-w-0 flex min-h-[21rem] flex-col overflow-hidden rounded-[1.75rem] border p-4 shadow-sm transition',
                    dayInfo.isToday
                      ? 'border-ink bg-[linear-gradient(180deg,rgba(15,23,42,0.03),rgba(255,255,255,0.96))] shadow-soft'
                      : 'border-slate-200 bg-white',
                  )}
                >
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 font-display text-[1.45rem] leading-none text-ink">{dayInfo.day}</h3>
                      <div className="flex flex-none flex-wrap items-center justify-end gap-2">
                        {dayInfo.isToday ? (
                          <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                            Today
                          </span>
                        ) : null}
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {taskCount} {taskCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{dayInfo.iso}</p>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => onQuickAddDay(dayInfo.day)}
                        className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        + Quick add
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex-1 space-y-2.5">
                    {dueAssignments.map((assignment) => (
                      <div key={assignment.id} className="min-w-0 rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Due assignment</p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-slate-200">
                            {assignment.subject}
                          </span>
                        </div>
                        <p className="mt-2 break-words text-sm font-medium leading-5 text-ink">{assignment.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{assignment.childName}</p>
                      </div>
                    ))}

                    {tasksForDay.map((task) => (
                      <div key={task.id} className={classNames('min-w-0 rounded-2xl border px-3 py-3 shadow-sm', subjectThemeMap[task.subject])}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <TaskModeBadge isGenerated={task.generatedBy === 'weekly-plan'} label={task.generatedBy === 'weekly-plan' ? 'Auto' : 'Manual'} />
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{task.subject}</span>
                            </div>
                            <p className="mt-2 break-words text-sm font-semibold leading-5 text-slate-800">{task.title}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                              {task.time ? <span>{task.time}</span> : <span>Flexible time</span>}
                              <span className="break-words">{task.childName}</span>
                            </div>
                          </div>
                          <div className="flex flex-none items-center gap-3 self-start pt-0.5">
                            <button
                              type="button"
                              onClick={() => onEditTask(task.id)}
                              className="text-xs font-semibold text-slate-500 transition hover:text-ink"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task.id)}
                              className="text-xs font-semibold text-slate-500 transition hover:text-rose-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {task.notes ? (
                          <div className="mt-3 break-words rounded-xl bg-white/55 px-3 py-2 text-xs leading-5 text-slate-600 ring-1 ring-white/60">
                            {task.notes}
                          </div>
                        ) : null}
                      </div>
                    ))}

                    {tasksForDay.length === 0 && dueAssignments.length === 0 ? (
                      <PlannerDayEmptyState
                        isToday={dayInfo.isToday}
                        hasGeneratedTasks={hasGeneratedTasks}
                      />
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function TaskModeBadge({ isGenerated = false, label }) {
  return (
    <span
      className={classNames(
        'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
        isGenerated
          ? 'bg-white/85 text-slate-600 ring-1 ring-white/90'
          : 'bg-slate-900/10 text-slate-700 ring-1 ring-slate-900/10',
      )}
    >
      {label}
    </span>
  )
}

function PlannerDayEmptyState({ isToday, hasGeneratedTasks }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
      <p className="font-display text-xl text-ink">{isToday ? 'Open block today' : 'Nothing planned yet'}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {hasGeneratedTasks
          ? 'Use quick add for a custom task or leave this day lighter.'
          : 'Generate the weekly plan or add a manual task to start shaping this day.'}
      </p>
    </div>
  )
}

export default WeeklyPlannerView
