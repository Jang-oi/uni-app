import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { TaskTable } from '@/components/TaskTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTaskStore } from '@/stores/task'

export function TasksPage() {
  const [activeView, setActiveView] = useState<'team' | 'personal'>('team')

  const teamTasks = useTaskStore((state) => state.teamTasks)
  const memberTasks = useTaskStore((state) => state.memberTasks)
  const currentUser = useTaskStore((state) => state.currentUser)
  const setCurrentUser = useTaskStore((state) => state.setCurrentUser)

  // 사용자 정보 조회 (컴포넌트 마운트 시 1회만)
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userName = await window.api.getUserName()
        setCurrentUser(userName)
      } catch (error) {
        console.error('[Tasks] 사용자 정보 조회 실패:', error)
        setCurrentUser('알 수 없음')
      }
    }
    fetchUserName()
  }, [])

  // 표시할 데이터 결정
  const personalTasks = memberTasks[currentUser] || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8 space-y-6"
    >
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">업무</h1>
        <p className="text-slate-600">팀 업무와 개인 업무를 확인하세요.</p>
      </div>

      <Tabs className="gap-6" value={activeView} onValueChange={(value) => setActiveView(value as 'team' | 'personal')}>
        <TabsList>
          <TabsTrigger value="team">팀 전체</TabsTrigger>
          <TabsTrigger value="personal">{currentUser} 매니저</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6">
          <TaskTable data={teamTasks} />
        </TabsContent>

        <TabsContent value="personal" className="mt-6">
          <TaskTable data={personalTasks} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
