import { useState } from 'react'
import { UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNotificationStore } from '@/stores/notification'
import type { TaskDisplayData } from '@/stores/task'
import { useTaskStore } from '@/stores/task'

interface TaskRequestModalProps {
  task: TaskDisplayData | null
  isOpen: boolean
  onClose: () => void
}

export function TaskRequestModal({ task, isOpen, onClose }: TaskRequestModalProps) {
  const [requestType, setRequestType] = useState<'task-check' | 'task-support'>('task-check')
  const [selectedMember, setSelectedMember] = useState<string>('')

  const memberTasks = useTaskStore((state) => state.memberTasks)
  const socket = useNotificationStore((state) => state.socket)

  // 팀원 목록 (본인 제외)
  const teamMembers = Object.keys(memberTasks)

  const handleSendRequest = async () => {
    if (!selectedMember) {
      toast.error('팀원을 선택해주세요.')
      return
    }

    if (!task) {
      toast.error('업무 정보가 없습니다.')
      return
    }

    if (!socket) {
      toast.error('서버에 연결되지 않았습니다.')
      return
    }

    try {
      const myHostname = await window.api.getHostname()

      // Socket으로 요청 전송 (서버에서 처리)
      socket.emit('task:request', {
        taskId: task.SR_IDX,
        taskTitle: task.REQ_TITLE,
        senderHostname: myHostname,
        receiverHostname: selectedMember, // 실제로는 이름 → 호스트네임 매핑 필요 (서버에서 처리)
        type: requestType
      })

      toast.success(`${selectedMember}님에게 요청을 전송했습니다.`)
      onClose()
      setSelectedMember('')
      setRequestType('task-check')
    } catch (error) {
      console.error('[TaskRequest] 요청 전송 실패:', error)
      toast.error('요청 전송에 실패했습니다.')
    }
  }

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>업무 요청 보내기</DialogTitle>
          <DialogDescription className="line-clamp-2">{task.REQ_TITLE}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>요청 타입</Label>
            <RadioGroup value={requestType} onValueChange={(v) => setRequestType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="task-check" id="check" />
                <Label htmlFor="check" className="font-normal cursor-pointer">
                  확인 요청
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="task-support" id="support" />
                <Label htmlFor="support" className="font-normal cursor-pointer">
                  지원 요청
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>받는 사람</Label>
            <Select value={selectedMember} onValueChange={(value) => setSelectedMember(value || '')}>
              <SelectTrigger>
                <SelectValue>{selectedMember || '팀원 선택'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member} value={member}>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={UserIcon} size={14} />
                      {member}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSendRequest}>전송</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
