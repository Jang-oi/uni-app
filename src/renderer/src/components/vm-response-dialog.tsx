/**
 * VM 응답 Dialog (요청자용)
 * 승인됨/거부됨 2가지 상태 표시
 */
import { useState } from 'react'
import { Cancel02Icon, CheckmarkCircle02Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useHypervStore } from '@/stores/hyperv'

export function VMResponseDialog() {
  const dialogState = useHypervStore((state) => state.vmResponseDialog)
  const setDialogState = useHypervStore((state) => state.setVMResponseDialog)
  const [isConnecting, setIsConnecting] = useState(false)

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
        await new Promise((resolve) => setTimeout(resolve, 800))
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
              <p className="text-sm font-medium text-red-900 mb-1">사용자가 요청을 거부했습니다.</p>
              <p className="text-xs text-red-700">나중에 다시 시도해주세요.</p>
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
