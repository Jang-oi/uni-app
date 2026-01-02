import { UserMultiple02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  { id: '알림', label: '알림' },
  { id: '버전관리', label: '버전관리' }
]

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const connectedUsers = useHypervStore((state) => state.connectedUsers)

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 drag-region">
      <div className="flex items-center gap-3">
        <div className="w-12 h-6 bg-primary rounded-md flex items-center justify-center">
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

      {/* Right: Connected Users */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100">
            <HugeiconsIcon icon={UserMultiple02Icon} size={18} className="text-slate-600" />
            <Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1.5 tabular-nums">
              {connectedUsers.length}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="p-3 border-b border-slate-200">
              <h3 className="font-semibold text-sm text-slate-900">접속 중인 사용자</h3>
              <p className="text-xs text-slate-500 mt-0.5">총 {connectedUsers.length}명이 접속 중입니다</p>
            </div>
            <ScrollArea className="max-h-[300px]">
              <div className="p-2">
                {connectedUsers.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-500">접속 중인 사용자가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {connectedUsers.map((user) => (
                      <div
                        key={user.hostname}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-sm font-medium text-slate-900">{user.name}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(user.connectedAt), { addSuffix: true, locale: ko })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
