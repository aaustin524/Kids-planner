import { classNames } from '../lib/helpers'

export function InputField({ label, value, onChange, type = 'text', placeholder = '', helper, min }) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-600">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {helper ? <span className="text-xs font-normal text-slate-400">{helper}</span> : null}
      </span>
      <input
        type={type}
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-plum focus:ring-4 focus:ring-plum/10"
      />
    </label>
  )
}

export function SelectField({ label, value, onChange, children, helper }) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-600">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {helper ? <span className="text-xs font-normal text-slate-400">{helper}</span> : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-plum focus:ring-4 focus:ring-plum/10"
      >
        {children}
      </select>
    </label>
  )
}

export function TextAreaField({ label, value, onChange, rows = 4, helper, placeholder = '' }) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-600">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {helper ? <span className="text-xs font-normal text-slate-400">{helper}</span> : null}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-plum focus:ring-4 focus:ring-plum/10"
      />
    </label>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      <p className="font-display text-2xl text-ink">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  )
}

export function SaveNotice({ message }) {
  if (!message) return null

  const isError = message.type === 'error'

  return (
    <div
      className={classNames(
        'mb-6 rounded-[1.5rem] px-4 py-3 text-sm font-medium',
        isError
          ? 'border border-rose-200 bg-rose-50 text-rose-800'
          : 'border border-emerald-200 bg-emerald-50 text-emerald-800',
      )}
    >
      {message.text}
    </div>
  )
}

export function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'rounded-full px-3 py-1.5 text-xs font-semibold transition',
        active ? 'bg-ink text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      )}
    >
      {children}
    </button>
  )
}
