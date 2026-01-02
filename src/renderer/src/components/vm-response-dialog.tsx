/**
 * VM 응답 Dialog (요청자용)
 * 대기 중/승인됨/거부됨 3가지 상태 표시
 */
import { useEffect, useState } from 'react'
import { Cancel02Icon, CheckmarkCircle02Icon, Clock02Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useHypervStore } from '@/stores/hyperv'

const VM_REQUEST_TIMEOUT = 60 * 1000 // 1분

export function VMResponseDialog() {
  const dialogState = useHypervStore((state) => state.vmResponseDialog)
  const setDialogState = useHypervStore((state) => state.setVMResponseDialog)
  const cancelVMRequest = useHypervStore((state) => state.cancelVMRequest)
  const [isConnecting, setIsConnecting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(VM_REQUEST_TIMEOUT)

  // 대기 중일 때만 타이머 시작
  useEffect(() => {
    if (dialogState?.type !== 'waiting') {
      setTimeRemaining(VM_REQUEST_TIMEOUT)
      return
    }

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, VM_REQUEST_TIMEOUT - elapsed)
      setTimeRemaining(remaining)

      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 100) // 100ms마다 업데이트

    return () => clearInterval(interval)
  }, [dialogState?.type])

  if (!dialogState) return null

  const handleClose = () => {
    setDialogState(null)
  }

  const handleConnectVM = async () => {
    if (!dialogState.hostServer) return

    setIsConnecting(true)
    try {
      const result = await window.api.connectToVM({
        hostServer: dialogState.hostServer,
        vmName: dialogState.vmName
      })

      if (result.success) {
        toast.success(`${dialogState.vmName} 연결 완료!`)
        handleClose()
      } else {
        toast.error(`연결 실패: ${result.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('[VM Connect] 연결 실패:', error)
      toast.error('VM 연결에 실패했습니다.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCancel = () => {
    cancelVMRequest(dialogState.vmName)
    toast.info('요청을 취소했습니다.')
  }

  // 대기 중 상태
  if (dialogState.type === 'waiting') {
    const progressPercent = (timeRemaining / VM_REQUEST_TIMEOUT) * 100
    const secondsRemaining = Math.ceil(timeRemaining / 1000)

    return (
      <Dialog open={dialogState.isOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <HugeiconsIcon icon={Clock02Icon} size={24} className="text-amber-600" />
              </div>
              <div>
                <DialogTitle>요청 대기 중</DialogTitle>
                <DialogDescription>{dialogState.vmName}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-amber-900 mb-1">현재 {dialogState.totalWaiting}명이 대기 중입니다</p>
              <p className="text-xs text-amber-700">대기 순번: {dialogState.queuePosition}번</p>
            </div>

            {/* 타이머 Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">요청 유효 시간</span>
                <span className="font-medium text-amber-600">{secondsRemaining}초 남음</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <p className="text-xs text-slate-500 text-center">사용자가 승인할 때까지 대기합니다.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              요청 취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // 승인됨 상태
  if (dialogState.type === 'approved') {
    return (
      <Dialog open={dialogState.isOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} className="text-green-600" />
              </div>
              <div>
                <DialogTitle>승인되었습니다!</DialogTitle>
                <DialogDescription>{dialogState.vmName}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-green-900 mb-2">{dialogState.approverName}님이 요청을 승인했습니다</p>
              <p className="text-xs text-green-700">접속하시겠습니까?</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isConnecting}>
              나중에
            </Button>
            <Button onClick={handleConnectVM} className="bg-green-600 hover:bg-green-700" disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 mr-2 animate-spin" />
                  연결 중...
                </>
              ) : (
                '지금 접속하기'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // 거부됨 상태
  if (dialogState.type === 'rejected') {
    const isManualReject = dialogState.rejectionReason === 'manual'
    const message = isManualReject ? '사용자가 요청을 거부했습니다.' : `${dialogState.approvedUserName}님이 먼저 승인받아 사용 중입니다.`

    return (
      <Dialog open={dialogState.isOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <HugeiconsIcon icon={Cancel02Icon} size={24} className="text-red-600" />
              </div>
              <div>
                <DialogTitle>요청이 거부되었습니다</DialogTitle>
                <DialogDescription>{dialogState.vmName}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-red-900 mb-1">{message}</p>
              {!isManualReject && <p className="text-xs text-red-700">다시 요청하시려면 대기 후 시도해주세요.</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return null
}
