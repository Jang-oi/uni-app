/**
 * VM 요청 수신 Dialog (수신자용)
 * 여러 요청자 목록 표시, FIFO 첫 번째 강조
 */
import { Notification02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface VMRequestReceiverDialogProps {
  vmName: string
  requesters: Array<{
    notificationId: string
    name: string
    hostname: string
    timestamp: string
    isFirst: boolean
  }>
  isOpen: boolean
  onApprove: () => void
  onReject: () => void
  onClose: () => void
}

export function VMRequestReceiverDialog({ vmName, requesters, isOpen, onApprove, onReject, onClose }: VMRequestReceiverDialogProps) {
  if (requesters.length === 0) {
    return null
  }

  const firstRequester = requesters.find((r) => r.isFirst)

  const handleApprove = () => {
    onApprove()
    toast.success(`${firstRequester?.name}님에게 승인했습니다`)
    onClose()
  }

  const handleReject = () => {
    onReject()
    toast.info('모든 요청을 거부했습니다')
    onClose()
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <HugeiconsIcon icon={Notification02Icon} size={24} className="text-primary" />
            </div>
            <div>
              <DialogTitle>VM 사용 요청</DialogTitle>
              <DialogDescription>{vmName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 요청자 목록 */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">다음 분들이 사용을 요청했습니다:</p>

            <ScrollArea className={cn('rounded-lg border', requesters.length > 3 ? 'h-[200px]' : '')}>
              <div className="p-2 space-y-2">
                {requesters.map((requester) => (
                  <div
                    key={requester.notificationId}
                    className={cn(
                      'p-3 rounded-md border transition-colors',
                      requester.isFirst ? 'bg-yellow-50 border-yellow-400 border-2' : 'bg-white border-slate-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {requester.isFirst && <span className="text-lg">⭐</span>}
                        <p className={cn('text-sm font-medium', requester.isFirst ? 'text-yellow-900' : 'text-slate-900')}>
                          {requester.name}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(requester.timestamp), { addSuffix: true, locale: ko })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 승인 안내 메시지 */}
          {firstRequester && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-900">
                ⚠️ 승인 시 가장 먼저 요청한 <strong>{firstRequester.name}님</strong>에게 우선 승인됩니다.
              </p>
              {requesters.length > 1 && (
                <p className="text-xs text-amber-700 mt-1">나머지 {requesters.length - 1}명은 자동으로 거부됩니다.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReject}>
            전체 거부
          </Button>
          <Button onClick={handleApprove}>승인 ({firstRequester?.name})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
