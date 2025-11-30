import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

type SidebarProps = {
  isCollapsed: boolean
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/jobs', label: 'Jobs', icon: '⚙️' },
    { path: '/dlq', label: 'Dead Letter Queue', icon: '💀' },
    { path: '/health', label: 'Health', icon: '❤️' },
  ]

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-950 border-r border-slate-800 overflow-hidden"
    >
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center ${
                    isCollapsed ? 'justify-center' : 'gap-3'
                  } px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </motion.aside>
  )
}
