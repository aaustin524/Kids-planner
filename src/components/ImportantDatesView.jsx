import SectionHeader from './SectionHeader'
import { EmptyState, InputField, SelectField, TextAreaField } from './ui'
import { importantDateTypes } from '../data/sampleData'
import { formatDate } from '../lib/helpers'

function ImportantDatesView({
  children,
  importantDates,
  form,
  editingId,
  onFormChange,
  onSubmit,
  onDelete,
  onEdit,
  onCancelEdit,
}) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
      <SectionHeader
        title="Important Dates"
        description="Keep quizzes, tests, projects, field trips, and school events visible in one place."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[1.75rem] bg-canvas p-5">
          <h3 className="font-display text-2xl text-ink">{editingId ? 'Edit important date' : 'Add important date'}</h3>
          <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField label="Child" value={form.childId} onChange={(value) => onFormChange('childId', value)}>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Type" value={form.type} onChange={(value) => onFormChange('type', value)}>
                {importantDateTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectField>
            </div>
            <InputField label="Title" value={form.title} onChange={(value) => onFormChange('title', value)} placeholder="Event name" />
            <InputField label="Date" type="date" value={form.date} onChange={(value) => onFormChange('date', value)} />
            <TextAreaField label="Notes" value={form.notes} onChange={(value) => onFormChange('notes', value)} placeholder="What should we remember for this date?" />
            <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
              {editingId ? 'Save important date' : 'Add important date'}
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

        <div className="space-y-3">
          {importantDates.length === 0 ? (
            <EmptyState
              title="No school dates yet"
              description="Add the next quiz, field trip, or project date so the dashboard stays useful."
            />
          ) : (
            importantDates.map((item) => (
              <div key={item.id} className="rounded-[1.75rem] border border-white bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum">{item.type}</p>
                    <h3 className="mt-2 font-display text-2xl text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.childName} · {formatDate(item.date)}
                    </p>
                    {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item.id)}
                      className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default ImportantDatesView
