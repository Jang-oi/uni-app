import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { LoadingScreen } from '@/components/loading-screen' // 로딩 스크린 임포트
import { Toaster } from '@/components/ui/sonner'
import { DashboardPage } from '@/pages/dashboard-page'
import { ServerErrorPage } from '@/pages/server-error-page'
import { VirtualMachinesPage } from '@/pages/virtual-machines-page'
import { useCalendarStore } from '@/stores/calendar'
import { useHypervStore } from '@/stores/hyperv'
import { useTaskStore } from '@/stores/task'
import { useVersionStore } from '@/stores/version'
import { TasksPage } from './pages/tasks-page'
import { VersionPage } from './pages/version-page'

export default function App() {
  const [activeTab, setActiveTab] = useState('대시보드')
  const [isInitializing, setIsInitializing] = useState(true)
  const [serverError, setServerError] = useState(false)

  const initCalendarSocket = useCalendarStore((state) => state.initSocket)
  const initTaskSocket = useTaskStore((state) => state.initSocket)
  const initHypervSocket = useHypervStore((state) => state.initSocket)
  const initVersion = useVersionStore((state) => state.initVersion)

  // 앱 시작 시 모든 Socket 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const handleError = () => {
          console.error('[App] 소켓 연결 실패')
          setServerError(true)
          toast.error('서버 연결 실패', {
            description: '서버에 연결할 수 없습니다. 담당자에게 문의하세요.'
          })
        }

        initCalendarSocket(handleError)
        initTaskSocket(handleError)
        initHypervSocket(handleError)
        await initVersion()

        await new Promise((resolve) => setTimeout(resolve, 3000))
      } catch (error) {
        console.error('[App] 치명적 오류 발생:', error)
        setServerError(true)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeApp()
  }, [initCalendarSocket, initTaskSocket, initHypervSocket, initVersion])

  // 렌더링 로직 분기
  if (serverError) return <ServerErrorPage />

  // 초기화 중이면 로딩 스크린 표시
  if (isInitializing) return <LoadingScreen />
  const renderPage = () => {
    switch (activeTab) {
      case '대시보드':
        return <DashboardPage key="dashboard" />
      case '업무':
        return <TasksPage key="tasks" />
      case 'HYPER-V':
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
      <Toaster position="top-right" richColors />
    </div>
  )
}
