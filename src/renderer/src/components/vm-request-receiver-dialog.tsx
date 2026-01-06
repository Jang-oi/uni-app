/**
 * VM 요청 수신 Dialog (수신자용)
 * 전역 Store 기반으로 작동
 */
import { Notification02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useHypervStore } from '@/stores/hyperv'
import { useSocketStore } from '@/stores/socket'

export function VMRequestReceiverDialog() {
  const dialogState = useHypervStore((state) => state.vmRequestDialog)
  const setDialogState = useHypervStore((state) => state.setVMRequestDialog)
  const socket = useSocketStore((state) => state.getSocket())

  if (!dialogState) return null

  const handleClose = () => {
    setDialogState(null)
  }

  const handleApprove = async () => {
    const approverHostname = await window.api.getHostname()

    // VM 프로세스 종료 시도
    try {
      await window.api.killVMProcess({ vmName: dialogState.vmName })
      console.log(`[VM] ${dialogState.vmName} 프로세스 종료 완료`)
    } catch (error) {
      console.warn(`[VM] ${dialogState.vmName} 프로세스 종료 실패 (이미 종료되었을 수 있음):`, error)
    }

    // 서버에 승인 이벤트 전송
    if (socket) {
      socket.emit('vm:approve-request', {
        vmName: dialogState.vmName,
        approverHostname
      })
      toast.success(`${dialogState.requesterName}님에게 승인했습니다`)
    }
    handleClose()
  }

  const handleReject = async () => {
    const rejectorHostname = await window.api.getHostname()
    if (socket) {
      socket.emit('vm:reject-request', {
        vmName: dialogState.vmName,
        rejectorHostname
      })
      toast.info('요청을 거부했습니다')
    }
    handleClose()
  }

  return (
    <Dialog open={dialogState.isOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <HugeiconsIcon icon={Notification02Icon} size={24} className="text-primary" />
            </div>
            <div>
              <DialogTitle>VM 사용 요청</DialogTitle>
              <DialogDescription>{dialogState.vmName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">요청자</p>
                <p className="text-lg font-semibold text-primary">{dialogState.requesterName}</p>
              </div>
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(dialogState.timestamp), { addSuffix: true, locale: ko })}
              </span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900 mb-2">
              <strong>{dialogState.requesterName}님</strong>이 <strong>{dialogState.vmName}</strong> 사용을 요청했습니다.
            </p>
            <p className="text-xs text-red-700">
              ⚠️ 승인 시 현재 실행 중인 <strong>{dialogState.vmName}</strong> 자동으로 종료됩니다.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReject}>
            거부
          </Button>
          <Button onClick={handleApprove}>승인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
