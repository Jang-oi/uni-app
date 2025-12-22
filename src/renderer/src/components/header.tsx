import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const tabs = [
  { id: '가상머신', label: '가상 머신' },
  {
    id: '업무',
    label: '업무',
    subMenus: [
      { id: '팀업무', label: '팀 업무' },
      { id: '개인업무', label: '개인 업무' }
    ]
  },
  { id: '일정', label: '일정' },
  { id: '버전관리', label: '버전관리' },
  { id: '관리자', label: '관리자' }
]

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const isTabActive = (tabId: string, subMenus?: Array<{ id: string; label: string }>) => {
    if (activeTab === tabId) return true
    if (subMenus) {
      return subMenus.some((sub) => sub.id === activeTab)
    }
    return false
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 drag-region">
      <div className="flex items-center gap-3">
        <div className="w-12 h-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-md flex items-center justify-center">
          <span className="text-white text-xs font-bold">구독4</span>
        </div>
      </div>

      {/* Center: Navigation Tabs */}
      <nav className="flex items-center gap-1">
        {tabs.map((tab) => {
          if (tab.subMenus) {
            return (
              // DropdownMenuTrigger에 직접 Button 스타일을 적용합니다.
              <DropdownMenu key={tab.id}>
                <DropdownMenuTrigger
                  // Button 컴포넌트 대신 직접 버튼 스타일 클래스를 넣습니다.
                  className="relative px-4 py-2 text-sm font-medium flex items-center gap-1.5 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  <span className={isTabActive(tab.id, tab.subMenus) ? 'text-slate-900' : 'text-slate-600'}>{tab.label}</span>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={16}
                    className={isTabActive(tab.id, tab.subMenus) ? 'text-slate-900' : 'text-slate-400'}
                  />
                  {/* 활성 탭 표시줄 */}
                  {isTabActive(tab.id, tab.subMenus) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </DropdownMenuTrigger>

                <DropdownMenuContent align="center" className="w-40 bg-white border border-slate-200 shadow-lg p-1">
                  {tab.subMenus.map((subMenu) => (
                    <DropdownMenuItem
                      key={subMenu.id}
                      onClick={() => setActiveTab(subMenu.id)}
                      className={`px-2 py-1.5 text-sm cursor-pointer rounded-sm ${
                        activeTab === subMenu.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {subMenu.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }

          return (
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
          )
        })}
      </nav>

      {/* Right: User & Window Controls */}
      <div className="flex items-center gap-2"></div>
    </header>
  )
}
