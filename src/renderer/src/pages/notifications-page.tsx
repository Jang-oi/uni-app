import { useEffect, useMemo, useState } from 'react'
import { Message02Icon, Notification02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VMRequestReceiverDialog } from '@/components/vm-request-receiver-dialog'
import { cn } from '@/lib/utils'
import type { Notification } from '@/stores/notification'
import { useNotificationStore } from '@/stores/notification'
import { useSocketStore } from '@/stores/socket'
import { openUniPost } from '@/util/util'

export function NotificationsPage() {
  const notifications = useNotificationStore((state) => state.notifications)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)

  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [vmRequestDialog, setVmRequestDialog] = useState<Notification | null>(null)

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((n) => !n.isRead)
    }
    return notifications
  }, [notifications, filter])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length
  }, [notifications])

  const isVMRequestExpired = (notification: Notification): boolean => {
    if (notification.type !== 'vm-request' || !notification.expiresAt) return false
    return new Date(notification.expiresAt) < new Date()
  }

  const isVMRequestClickable = (notification: Notification): boolean => {
    if (notification.type !== 'vm-request') return true

    // VM 요청이 취소되었거나, 만료되었거나, 이미 처리된 경우 클릭 불가
    if (notification.isCancelled || notification.isProcessed || isVMRequestExpired(notification)) {
      return false
    }

    return true
  }

  // Windows 알림 클릭 시 VM 요청 다이얼로그 자동 오픈
  useEffect(() => {
    const unsubscribe = window.api.onVMRequestClicked((data) => {
      console.log('[NotificationsPage] VM 요청 알림 클릭:', data)
      // 해당 vmName의 알림을 찾아서 다이얼로그 오픈
      const targetNotification = notifications.find((n) => n.type === 'vm-request' && n.vmName === data.vmName && !n.isRead)
      if (targetNotification && isVMRequestClickable(targetNotification)) {
        setVmRequestDialog(targetNotification)
        markAsRead(targetNotification.id)
      }
    })

    return () => unsubscribe()
  }, [notifications, markAsRead])

  const handleNotificationClick = (notification: Notification) => {
    // 클릭 불가능한 상태면 return
    if (!isVMRequestClickable(notification)) {
      if (notification.type === 'vm-request') {
        if (notification.isCancelled) {
          toast.info('취소된 요청입니다')
        } else if (isVMRequestExpired(notification)) {
          toast.info('만료된 요청입니다 (60초 초과)')
        } else if (notification.isProcessed) {
          toast.info('이미 처리된 요청입니다')
        }
      }
      return
    }

    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    // VM 요청 알림이면 VMRequestReceiverDialog 오픈
    if (notification.type === 'vm-request' && notification.vmName) {
      setVmRequestDialog(notification)
      return
    }

    // 업무 관련 알림이면 해당 업무로 이동
    if (notification.taskId) {
      openUniPost(notification.taskId)
    }
  }

  const handleApproveVM = async () => {
    if (!vmRequestDialog || !vmRequestDialog.vmName) return

    const approverHostname = await window.api.getHostname()
    const socket = useSocketStore.getState().getSocket()

    if (socket) {
      socket.emit('vm:approve-request', {
        vmName: vmRequestDialog.vmName,
        approverHostname
      })
      toast.success(`${vmRequestDialog.senderName}님에게 승인했습니다`)
    }

    setVmRequestDialog(null)
  }

  const handleRejectVM = async () => {
    if (!vmRequestDialog || !vmRequestDialog.vmName) return

    const rejectorHostname = await window.api.getHostname()
    const socket = useSocketStore.getState().getSocket()

    if (socket) {
      socket.emit('vm:reject-request', {
        vmName: vmRequestDialog.vmName,
        rejectorHostname
      })
      toast.info('요청을 거부했습니다')
    }

    setVmRequestDialog(null)
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
    <div className="p-8 h-full flex flex-col bg-white">
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
        <ScrollArea className="h-[calc(86vh-120px)]">
          <div className="p-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <HugeiconsIcon icon={Notification02Icon} size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">{filter === 'unread' ? '미읽은 알림이 없습니다.' : '알림이 없습니다.'}</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const clickable = isVMRequestClickable(notification)
                const expired = notification.type === 'vm-request' && isVMRequestExpired(notification)
                const cancelled = notification.type === 'vm-request' && notification.isCancelled
                const processed = notification.type === 'vm-request' && notification.isProcessed

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'group flex items-start gap-4 p-4 rounded-xl border transition-all',
                      clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                      notification.isRead
                        ? 'bg-white border-slate-200 hover:bg-slate-50'
                        : 'bg-primary/5 border-primary/20 hover:bg-primary/10',
                      !clickable && 'hover:bg-slate-100'
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
                      {notification.vmName && (
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 truncate">VM: {notification.vmName}</p>
                          {expired && <p className="text-xs text-amber-600 font-medium">⏱️ 만료됨 (60초 초과)</p>}
                          {cancelled && <p className="text-xs text-slate-400 font-medium">❌ 취소됨</p>}
                          {processed && <p className="text-xs text-green-600 font-medium">✅ 처리 완료</p>}
                        </div>
                      )}
                    </div>

                    {!notification.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </Card>

      {vmRequestDialog && vmRequestDialog.vmName && (
        <VMRequestReceiverDialog
          vmName={vmRequestDialog.vmName}
          requesterName={vmRequestDialog.senderName}
          timestamp={vmRequestDialog.timestamp}
          isOpen={true}
          onApprove={handleApproveVM}
          onReject={handleRejectVM}
          onClose={() => setVmRequestDialog(null)}
        />
      )}
    </div>
  )
}
