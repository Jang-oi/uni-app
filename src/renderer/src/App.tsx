import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'
import { CalendarPage } from '@/pages/calendar-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { ServerErrorPage } from '@/pages/server-error-page'
import { VirtualMachinesPage } from '@/pages/virtual-machines-page'
import { useHypervStore } from '@/stores/hyperv'
import { useTaskStore } from '@/stores/task'
import { useVacationStore } from '@/stores/vacation'
import { TasksPage } from './pages/tasks-page'
import { VersionPage } from './pages/version-page'

export default function App() {
  const [activeTab, setActiveTab] = useState('대시보드')
  const [serverError, setServerError] = useState(false)

  // 스토어에서 초기화 함수만 가져오기
  const initVacationSocket = useVacationStore((state) => state.initSocket)
  const initTaskSocket = useTaskStore((state) => state.initSocket)
  const initHypervSocket = useHypervStore((state) => state.initSocket)

  // 앱 시작 시 모든 Socket 초기화
  useEffect(() => {
    let errorCount = 0
    const maxErrors = 3 // 3개 모두 실패하면 에러 페이지로

    const handleError = () => {
      errorCount++
      console.error(`[App] Socket 연결 오류 (${errorCount}/${maxErrors})`)

      if (errorCount >= maxErrors) {
        console.error('[App] 모든 Socket 연결 실패 - 에러 페이지로 전환')
        setServerError(true)
        toast.error('서버 연결 실패', {
          description: '서버에 연결할 수 없습니다. 담당자에게 문의하세요.'
        })
      }
    }

    // 모든 Socket 초기화 (에러 콜백 전달)
    console.log('[App] Socket 초기화 시작')
    initVacationSocket(handleError)
    initTaskSocket(handleError)
    initHypervSocket(handleError)

    // 5초 후에도 연결이 안 되면 에러로 간주 (타임아웃)
    const timeout = setTimeout(() => {
      const vacationStatus = useVacationStore.getState().connectionStatus
      const taskStatus = useTaskStore.getState().connectionStatus
      const hypervStatus = useHypervStore.getState().connectionStatus

      const allConnected = vacationStatus === 'connected' && taskStatus === 'connected' && hypervStatus === 'connected'

      if (!allConnected) {
        console.error('[App] Socket 연결 타임아웃')
        setServerError(true)
        toast.error('서버 연결 시간 초과', {
          description: '서버 응답이 없습니다. 담당자에게 문의하세요.'
        })
      } else {
        console.log('[App] 모든 Socket 연결 성공')
        toast.success('서버 연결 완료', {
          description: '모든 데이터 스트림이 정상적으로 연결되었습니다.'
        })
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [initVacationSocket, initTaskSocket, initHypervSocket])

  // 서버 연결 안 되면 에러 페이지 표시
  if (serverError) {
    return <ServerErrorPage />
  }

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
