import { useState } from 'react'
import { Task01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { PageHeader } from '@/components/page-header'
import { TaskRequestModal } from '@/components/task-request-modal'
import { TaskTable } from '@/components/TaskTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TaskDisplayData } from '@/stores/task'
import { useTaskStore } from '@/stores/task'
import { useUserStore } from '@/stores/user'

export function TasksPage() {
  const [activeView, setActiveView] = useState<'team' | 'personal'>('team')
  const [selectedTask, setSelectedTask] = useState<TaskDisplayData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const teamTasks = useTaskStore((state) => state.teamTasks)
  const memberTasks = useTaskStore((state) => state.memberTasks)
  const userName = useUserStore((state) => state.userName)
  const personalTasks = memberTasks[userName] || []

  const handleRequestClick = (task: TaskDisplayData) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  return (
    <div className="p-8 h-full flex flex-col bg-white">
      <PageHeader
        title="업무 관리"
        description="고객사 요청 사항(SR) 및 팀 내부 태스크를 실시간으로 확인합니다."
        icon={<HugeiconsIcon icon={Task01Icon} size={20} />}
      />

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'team' | 'personal')}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="w-[400px] grid grid-cols-2">
            <TabsTrigger value="team">팀 전체 ({teamTasks.length}건)</TabsTrigger>
            <TabsTrigger value="personal">
              {userName} 매니저 ({personalTasks.length}건)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="team">
          <TaskTable data={teamTasks} onRequestClick={handleRequestClick} />
        </TabsContent>

        <TabsContent value="personal">
          <TaskTable data={personalTasks} onRequestClick={handleRequestClick} />
        </TabsContent>
      </Tabs>

      <TaskRequestModal task={selectedTask} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
