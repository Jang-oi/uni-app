import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const tabs = ['일정', '업무', '가상머신', '관리자']

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 drag-region">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
          <span className="text-white text-xs font-bold">구4</span>
        </div>
      </div>

      {/* Center: Navigation Tabs */}
      <nav className="flex items-center gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            variant="ghost"
            size="sm"
            className="relative px-4 py-2 text-sm font-medium flex items-center gap-1.5"
          >
            <span className={activeTab === tab ? 'text-slate-900' : 'text-slate-600'}>{tab}</span>
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </Button>
        ))}
      </nav>

      {/* Right: User & Window Controls */}
      <div className="flex items-center gap-2"></div>
    </header>
  )
}
