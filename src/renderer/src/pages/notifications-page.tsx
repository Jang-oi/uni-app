import { useMemo, useState } from 'react'
import { Message02Icon, Notification02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Notification } from '@/stores/notification'
import { useNotificationStore } from '@/stores/notification'
import { openUniPost } from '@/util/util'

export function NotificationsPage() {
  const notifications = useNotificationStore((state) => state.notifications)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((n) => !n.isRead)
    }
    return notifications
  }, [notifications, filter])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length
  }, [notifications])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    // 업무 관련 알림이면 해당 업무로 이동
    if (notification.taskId) {
      openUniPost(notification.taskId)
    }
  }

  const getTypeIcon = (type: string) => {
    if (type === 'task-check') return Tick02Icon
    if (type === 'task-support') return Message02Icon
    return Notification02Icon
  }

  const getTypeBadge = (type: string) => {
    if (type === 'task-check') return '확인 요청'
    if (type === 'task-support') return '지원 요청'
    if (type === 'vm-request') return 'VM 요청'
    return '알림'
  }

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50/30">
      <PageHeader
        title="알림 센터"
        description="받은 알림을 확인하고 관리하세요."
        icon={<HugeiconsIcon icon={Notification02Icon} size={20} />}
      />

      <div className="flex items-center justify-between mb-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="unread">미읽음 ({unreadCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
          전체 읽음 처리
        </Button>
      </div>

      <Card className="flex-1 border-slate-200 shadow-none overflow-hidden flex flex-col">
        <ScrollArea className="h-[calc(86vh-80px)]">
          <div className="p-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <HugeiconsIcon icon={Notification02Icon} size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">{filter === 'unread' ? '미읽은 알림이 없습니다.' : '알림이 없습니다.'}</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer',
                    notification.isRead
                      ? 'bg-white border-slate-200 hover:bg-slate-50'
                      : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                      notification.isRead ? 'bg-slate-100' : 'bg-primary/10'
                    )}
                  >
                    <HugeiconsIcon
                      icon={getTypeIcon(notification.type)}
                      size={20}
                      className={notification.isRead ? 'text-slate-500' : 'text-primary'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={notification.type === 'task-check' ? 'default' : 'secondary'} className="text-[10px]">
                        {getTypeBadge(notification.type)}
                      </Badge>
                      <span className="text-xs text-slate-500">{new Date(notification.timestamp).toLocaleString('ko-KR')}</span>
                    </div>

                    <p className="text-sm font-medium text-slate-900 mb-1">{notification.message}</p>

                    {notification.taskTitle && <p className="text-xs text-slate-500 truncate">업무: {notification.taskTitle}</p>}
                    {notification.vmName && <p className="text-xs text-slate-500 truncate">VM: {notification.vmName}</p>}
                  </div>

                  {!notification.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}
