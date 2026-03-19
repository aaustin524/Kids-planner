import SectionHeader from './SectionHeader'
import { EmptyState, InputField, SelectField, TextAreaField } from './ui'
import { priorityOptions, statusOptions, subjectOptions } from '../data/sampleData'
import { classNames, formatDate, isOverdue, subjectThemeMap } from '../lib/helpers'

function AssignmentsView({
  children,
  assignments,
  filters,
  form,
  editingId,
  statusSummary,
  onFilterChange,
  onFormChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancelEdit,
  onStatusChange,
}) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
      <SectionHeader
        title="Assignments"
        description="Track schoolwork with filters, priorities, notes, and an easy edit flow."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[1.75rem] bg-canvas p-5">
          <h3 className="font-display text-2xl text-ink">{editingId ? 'Edit assignment' : 'Add assignment'}</h3>
          <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField label="Child" value={form.childId} onChange={(value) => onFormChange('childId', value)}>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Subject" value={form.subject} onChange={(value) => onFormChange('subject', value)}>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </SelectField>
            </div>
            <InputField label="Title" value={form.title} onChange={(value) => onFormChange('title', value)} placeholder="Assignment title" helper="Required" />
            <div className="grid gap-3 md:grid-cols-3">
              <InputField label="Due date" type="date" value={form.dueDate} onChange={(value) => onFormChange('dueDate', value)} />
              <SelectField label="Priority" value={form.priority} onChange={(value) => onFormChange('priority', value)}>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Status" value={form.status} onChange={(value) => onFormChange('status', value)}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextAreaField label="Notes" value={form.notes} onChange={(value) => onFormChange('notes', value)} placeholder="Helpful reminder, supply note, or study tip" />
            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
                {editingId ? 'Save changes' : 'Add assignment'}
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
            </div>
          </form>
        </div>

        <div>
          <div className="grid gap-4 rounded-[1.75rem] bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Visible</p>
                <p className="mt-2 font-display text-2xl text-ink">{statusSummary.visible}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Due soon</p>
                <p className="mt-2 font-display text-2xl text-coral">{statusSummary.dueSoon}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Overdue</p>
                <p className="mt-2 font-display text-2xl text-rose-700">{statusSummary.overdue}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Done</p>
                <p className="mt-2 font-display text-2xl text-emerald-700">{statusSummary.completed}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <InputField
                label="Search"
                value={filters.search}
                onChange={(value) => onFilterChange('search', value)}
                placeholder="Search title or notes"
              />
              <SelectField label="Filter child" value={filters.childId} onChange={(value) => onFilterChange('childId', value)}>
                <option value="all">All children</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Filter subject" value={filters.subject} onChange={(value) => onFilterChange('subject', value)}>
                <option value="all">All subjects</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Filter status" value={filters.status} onChange={(value) => onFilterChange('status', value)}>
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onFilterChange('childId', 'all')
                  onFilterChange('subject', 'all')
                  onFilterChange('status', 'all')
                  onFilterChange('search', '')
                }}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                Clear filters
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {assignments.length === 0 ? (
              <EmptyState
                title="No assignments match right now"
                description="Try clearing a filter, changing the search text, or adding a new assignment."
              />
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={classNames(
                    'rounded-[1.75rem] border bg-white p-5 shadow-soft transition',
                    isOverdue(assignment.dueDate, assignment.status)
                      ? 'border-rose-200 ring-2 ring-rose-100'
                      : 'border-white',
                  )}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={classNames('rounded-full border px-3 py-1 text-xs font-semibold', subjectThemeMap[assignment.subject])}>
                          {assignment.subject}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {assignment.priority}
                        </span>
                        <span
                          className={classNames(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            assignment.status === 'Done'
                              ? 'bg-emerald-100 text-emerald-700'
                              : assignment.status === 'In Progress'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {assignment.status}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-2xl text-ink">{assignment.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {assignment.childName} · Due {formatDate(assignment.dueDate)}
                        {isOverdue(assignment.dueDate, assignment.status) ? ' · Overdue' : ''}
                      </p>
                      {assignment.notes ? <p className="mt-2 text-sm text-slate-600">{assignment.notes}</p> : null}
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <SelectField label="Status" value={assignment.status} onChange={(value) => onStatusChange(assignment.id, value)}>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </SelectField>
                      <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(assignment.id)}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(assignment.id)}
                        className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        Delete
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AssignmentsView
