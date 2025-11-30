import { useState, ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto bg-slate-100 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
