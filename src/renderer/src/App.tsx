import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'
import { CalendarPage } from '@/pages/calendar-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { ServerErrorPage } from '@/pages/server-error-page'
import { VirtualMachinesPage } from '@/pages/virtual-machines-page'
import { useCalendarStore } from '@/stores/calendar'
import { useHypervStore } from '@/stores/hyperv'
import { useTaskStore } from '@/stores/task'
import { TasksPage } from './pages/tasks-page'
import { VersionPage } from './pages/version-page'

export default function App() {
  const [activeTab, setActiveTab] = useState('대시보드')
  const [serverError, setServerError] = useState(false)

  // 스토어에서 초기화 함수만 가져오기
  const initCalendarSocket = useCalendarStore((state) => state.initSocket)
  const initTaskSocket = useTaskStore((state) => state.initSocket)
  const initHypervSocket = useHypervStore((state) => state.initSocket)

  // 앱 시작 시 모든 Socket 초기화
  useEffect(() => {
    const handleError = () => {
      console.error('[App] 모든 Socket 연결 실패 - 에러 페이지로 전환')
      setServerError(true)
      toast.error('서버 연결 실패', {
        description: '서버에 연결할 수 없습니다. 담당자에게 문의하세요.'
      })
    }

    initCalendarSocket(handleError)
    initTaskSocket(handleError)
    initHypervSocket(handleError)
  }, [initCalendarSocket, initTaskSocket, initHypervSocket])

  if (serverError) return <ServerErrorPage />

  const renderPage = () => {
    switch (activeTab) {
      case '대시보드':
        return <DashboardPage key="dashboard" />
      case '일정':
        return <CalendarPage key="calendar" />
      case '업무':
        return <TasksPage key="tasks" />
      case '가상머신':
        return <VirtualMachinesPage key="vm" />
      case '버전관리':
        return <VersionPage key="version" />
      default:
        return <DashboardPage key="dashboard" />
    }
  }

  return (
    <div className="h-screen flex flex-col select-none">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  )
}
