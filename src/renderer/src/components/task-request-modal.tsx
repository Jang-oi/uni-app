import { useMemo, useState } from 'react'
import { Search01Icon, Tick02Icon, UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
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
  const [searchQuery, setSearchQuery] = useState<string>('')

  const memberTasks = useTaskStore((state) => state.memberTasks)
  const currentUser = useTaskStore((state) => state.currentUser)
  const socket = useNotificationStore((state) => state.socket)

  // 팀원 목록 (본인 제외)
  const teamMembers = useMemo(() => {
    return Object.keys(memberTasks).filter((member) => member !== currentUser)
  }, [memberTasks, currentUser])

  // 검색 필터링
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return teamMembers
    const query = searchQuery.toLowerCase()
    return teamMembers.filter((member) => member.toLowerCase().includes(query))
  }, [teamMembers, searchQuery])

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
        receiverName: selectedMember, // 이름으로 전송 (서버에서 hostname으로 변환)
        type: requestType
      })

      toast.success(`${selectedMember}님에게 요청을 전송했습니다.`)
      onClose()
      setSelectedMember('')
      setRequestType('task-check')
      setSearchQuery('')
    } catch (error) {
      console.error('[TaskRequest] 요청 전송 실패:', error)
      toast.error('요청 전송에 실패했습니다.')
    }
  }

  const handleClose = () => {
    setSelectedMember('')
    setSearchQuery('')
    setRequestType('task-check')
    onClose()
  }

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>업무 요청 보내기</DialogTitle>
          <DialogDescription className="line-clamp-2">{task.REQ_TITLE}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 요청 타입 */}
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

          {/* 받는 사람 */}
          <div className="space-y-2">
            <Label>받는 사람 ({teamMembers.length}명)</Label>

            {/* 검색 */}
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="팀원 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* 사용자 목록 */}
            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">검색 결과가 없습니다.</div>
                ) : (
                  filteredMembers.map((member) => (
                    <button
                      key={member}
                      onClick={() => setSelectedMember(member)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
                        selectedMember === member ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          selectedMember === member ? 'bg-white/20' : 'bg-slate-100'
                        )}
                      >
                        <HugeiconsIcon icon={UserIcon} size={16} className={selectedMember === member ? 'text-white' : 'text-slate-600'} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member}</p>
                        <p className={cn('text-xs', selectedMember === member ? 'text-white/70' : 'text-slate-500')}>
                          {memberTasks[member]?.length || 0}개 업무
                        </p>
                      </div>
                      {selectedMember === member && <HugeiconsIcon icon={Tick02Icon} size={16} className="text-white" />}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleSendRequest} disabled={!selectedMember}>
            전송
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
