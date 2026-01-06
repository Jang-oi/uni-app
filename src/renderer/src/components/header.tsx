import { ArrowDown01Icon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useHypervStore } from '@/stores/hyperv'
import { useNotificationStore } from '@/stores/notification'
import { useVersionStore } from '@/stores/version'

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
  const updateAvailable = useVersionStore((state) => state.updateAvailable)
  const availableVersion = useVersionStore((state) => state.availableVersion)

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
        {/* 업데이트 알림 아이콘 */}
        {updateAvailable && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="relative cursor-pointer">
                  {/* 아이콘 색상을 Primary(Indigo) 계열로 변경 */}
                  <HugeiconsIcon icon={ArrowDown01Icon} size={20} className="text-primary" />

                  {/* 알림 점: Primary 색상과 일치시키고 생동감을 위해 animate-ping 추가 */}
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                className="bg-white border-2 shadow-lg px-0 py-0 max-w-[280px] cursor-pointer"
                onClick={() => setActiveTab('버전관리')}
              >
                <div className="flex items-start gap-3 p-3">
                  {/* 로봇 아바타 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg">🤖</span>
                  </div>
                  {/* 말풍선 내용 */}
                  <div className="flex-1 space-y-1 pt-0.5">
                    <p className="text-sm font-semibold text-slate-900">새로운 버전이 있어요!</p>
                    <p className="text-xs text-slate-600 leading-relaxed">v{availableVersion}로 업데이트할 수 있습니다</p>
                    <p className="text-xs text-blue-600 font-medium pt-1">클릭하여 업데이트 하러가기→</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* 접속 중인 사용자 */}
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
