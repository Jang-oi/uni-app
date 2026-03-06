import { useMemo, useState } from 'react'
import { Task01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { PageHeader } from '@/components/page-header'
import { TaskRequestModal } from '@/components/task-request-modal'
import { TaskTable } from '@/components/TaskTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TaskDisplayData } from '@/stores/task'
import { useTaskStore } from '@/stores/task'

type TeamTab = '2팀' | '4팀' | '미지정'

export function TasksPage() {
  const [activeView, setActiveView] = useState<TeamTab>('4팀')
  const [selectedTask, setSelectedTask] = useState<TaskDisplayData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const teamTasks = useTaskStore((state) => state.teamTasks)
  const team2Tasks = useMemo(() => teamTasks.filter((t) => t.UNIDOCU_PART === '2팀'), [teamTasks])
  const team4Tasks = useMemo(() => teamTasks.filter((t) => t.UNIDOCU_PART === '4팀'), [teamTasks])
  const unassignedTasks = useMemo(() => teamTasks.filter((t) => !t.UNIDOCU_PART), [teamTasks])

  const handleRequestClick = (task: TaskDisplayData) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  return (
    <div className="p-8 h-full flex flex-col bg-white">
      <PageHeader
        title="업무 관리"
        description="최근 6개월 고객사 요청 사항을 실시간으로 확인합니다."
        icon={<HugeiconsIcon icon={Task01Icon} size={20} />}
      />

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as TeamTab)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-3 w-120">
            <TabsTrigger value="4팀">4팀 전체 ({team4Tasks.length}건)</TabsTrigger>
            <TabsTrigger value="2팀">2팀 전체 ({team2Tasks.length}건)</TabsTrigger>
            <TabsTrigger value="미지정">미지정 ({unassignedTasks.length}건)</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="4팀">
          <TaskTable data={team4Tasks} onRequestClick={handleRequestClick} />
        </TabsContent>

        <TabsContent value="2팀">
          <TaskTable data={team2Tasks} onRequestClick={handleRequestClick} />
        </TabsContent>

        <TabsContent value="미지정">
          <TaskTable data={unassignedTasks} onRequestClick={handleRequestClick} />
        </TabsContent>
      </Tabs>

      <TaskRequestModal task={selectedTask} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
