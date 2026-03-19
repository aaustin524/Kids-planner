function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-3xl text-ink">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  )
}

export default SectionHeader
