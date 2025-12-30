import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const tabs = [
  { id: '대시보드', label: '대시보드' },
  { id: '가상머신', label: '가상 머신' },
  { id: '업무', label: '업무' },
  { id: '버전관리', label: '버전관리' }
]

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 drag-region">
      <div className="flex items-center gap-3">
        <div className="w-12 h-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-md flex items-center justify-center">
          <span className="text-white text-xs font-bold">구독4</span>
        </div>
      </div>

      {/* Center: Navigation Tabs */}
      <nav className="flex items-center gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            variant="ghost"
            size="sm"
            className="relative px-4 py-2 text-sm font-medium flex items-center gap-1.5"
          >
            <span className={activeTab === tab.id ? 'text-slate-900' : 'text-slate-600'}>{tab.label}</span>
            {activeTab === tab.id && (
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
