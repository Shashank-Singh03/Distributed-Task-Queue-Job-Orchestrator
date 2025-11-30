type HeaderProps = {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-slate-950 border-b border-slate-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="text-slate-300 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-100">
            Task Queue Control Plane
          </h1>
        </div>
        <span className="px-3 py-1 text-xs font-medium bg-amber-900 text-amber-100 rounded">
          Production
        </span>
      </div>
    </header>
  )
}
