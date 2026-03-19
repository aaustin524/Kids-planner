import { tabs } from '../data/sampleData'
import { classNames } from '../lib/helpers'

function TopNav({ activeTab, onChange }) {
  return (
    <nav className="sticky top-4 z-20 rounded-[1.75rem] border border-white/70 bg-white/85 p-3 shadow-soft backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={classNames(
              'rounded-2xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-plum/10',
              activeTab === tab
                ? 'bg-ink text-white shadow-lg shadow-slate-300/40'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-ink',
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default TopNav
