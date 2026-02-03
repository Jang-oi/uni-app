import { PackageIcon, Settings02Icon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useHypervStore } from '@/stores/hyperv'
import { useNotificationStore } from '@/stores/notification'

interface HeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const tabs = [
  { id: '대시보드', label: '대시보드' },
  { id: 'HYPER-V', label: 'HYPER-V' },
  { id: '업무', label: '업무' },
  { id: '회식일정', label: '회식일정' },
  { id: '알림', label: '알림' }
]

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const connectedUsers = useHypervStore((state) => state.connectedUsers)

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 drag-region">
      <div className="flex items-center gap-3">
        <div className="w-12 h-6 bg-primary flex items-center justify-center">
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
            {tab.id === '알림' && unreadCount > 0 && (
              <Badge className="h-5 min-w-5 rounded-full px-1 tabular-nums bg-destructive">{unreadCount > 99 ? '99+' : unreadCount}</Badge>
            )}
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

      {/* Right: Settings Menu */}
      <div className="flex items-center gap-2">
        {/* 설정 드롭다운 */}
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-slate-100">
            <HugeiconsIcon icon={Settings02Icon} size={18} className="text-slate-600" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* 접속 현황 서브메뉴 */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                <HugeiconsIcon icon={UserMultiple02Icon} size={14} />
                <span>접속현황</span>
                <span className="ml-auto text-[10px] text-slate-400 tabular-nums">{connectedUsers.length}명</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                <ScrollArea className="h-[calc(28vh-40px)]">
                  {connectedUsers.length === 0 ? (
                    <div className="py-6 text-center">
                      <HugeiconsIcon icon={UserMultiple02Icon} size={24} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-xs text-slate-400">접속 중인 사용자가 없습니다</p>
                    </div>
                  ) : (
                    <div className="p-1">
                      {connectedUsers.map((user) => (
                        <div key={user.hostname} className="flex items-center justify-between px-2 py-2 rounded-md">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium text-slate-700">{user.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(user.connectedAt), { addSuffix: true, locale: ko })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* 버전관리 */}
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => setActiveTab('버전관리')}>
              <HugeiconsIcon icon={PackageIcon} size={14} />
              <span>버전관리</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
