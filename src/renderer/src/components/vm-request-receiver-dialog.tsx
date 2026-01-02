/**
 * VM 요청 수신 Dialog (수신자용)
 * Lock 시스템: 단일 요청자만 처리
 */
import { Notification02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface VMRequestReceiverDialogProps {
  vmName: string
  requesterName: string
  timestamp: string
  isOpen: boolean
  onApprove: () => void
  onReject: () => void
  onClose: () => void
}

export function VMRequestReceiverDialog({
  vmName,
  requesterName,
  timestamp,
  isOpen,
  onApprove,
  onReject,
  onClose
}: VMRequestReceiverDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
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
          {/* 요청자 정보 */}
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">요청자</p>
                <p className="text-lg font-semibold text-primary">{requesterName}</p>
              </div>
              <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ko })}</span>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              <strong>{requesterName}님</strong>이 <strong>{vmName}</strong> 사용을 요청했습니다.
            </p>
            <p className="text-xs text-amber-700 mt-1">승인 시 해당 VM에 즉시 연결됩니다.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onReject}>
            거부
          </Button>
          <Button onClick={onApprove}>승인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
