import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Header } from '@/components/header'
import { LoadingScreen } from '@/components/loading-screen'
import { Toaster } from '@/components/ui/sonner'
import { VMResponseDialog } from '@/components/vm-response-dialog'
import { DashboardPage } from '@/pages/dashboard-page'
import { DinnerSchedulePage } from '@/pages/dinner-schedule-page'
import { NotificationsPage } from '@/pages/notifications-page'
import { ServerErrorPage } from '@/pages/server-error-page'
import { TasksPage } from '@/pages/tasks-page'
import { VersionPage } from '@/pages/version-page'
import { VirtualMachinesPage } from '@/pages/virtual-machines-page'
import { useCalendarStore } from '@/stores/calendar'
import { useDinnerStore } from '@/stores/dinner'
import { useHypervStore } from '@/stores/hyperv'
import { useNotificationStore } from '@/stores/notification'
import { useSocketStore } from '@/stores/socket'
import { useTaskStore } from '@/stores/task'
import { useUserStore } from '@/stores/user'
import { useVersionStore } from '@/stores/version'
import { VMRequestReceiverDialog } from './components/vm-request-receiver-dialog'

export default function App() {
  const [activeTab, setActiveTab] = useState('대시보드')
  const [isInitializing, setIsInitializing] = useState(true)

  const initSocket = useSocketStore((state) => state.initSocket)
  const connectionStatus = useSocketStore((state) => state.connectionStatus)
  const initCalendarListeners = useCalendarStore((state) => state.initListeners)
  const initTaskListeners = useTaskStore((state) => state.initListeners)
  const initUserListeners = useUserStore((state) => state.initListeners)
  const initDinnerListeners = useDinnerStore((state) => state.initListeners)
  const initHypervListeners = useHypervStore((state) => state.initListeners)
  const initNotificationListeners = useNotificationStore((state) => state.initListeners)
  const initVersion = useVersionStore((state) => state.initVersion)

  // 앱 시작 시 공유 Socket 연결 및 각 스토어 리스너 등록
  useEffect(() => {
    const initializeApp = async () => {
      try {
        initUserListeners()
        initSocket()

        // 2. 각 스토어의 이벤트 리스너 등록
        initCalendarListeners()
        initTaskListeners()
        initDinnerListeners()
        initHypervListeners()
        initNotificationListeners()

        // 3. 버전 정보 가져오기
        await initVersion()

        await new Promise((resolve) => setTimeout(resolve, 3000))
      } catch (error) {
        console.error('[App] 치명적 오류 발생:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeApp()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') window.api.minimizeWindow()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (isInitializing) return <LoadingScreen />
  if (connectionStatus === 'error' || connectionStatus === 'disconnected') return <ServerErrorPage />

  const renderPage = () => {
    switch (activeTab) {
      case '대시보드':
        return <DashboardPage key="dashboard" />
      case '업무':
        return <TasksPage key="tasks" />
      case '회식일정':
        return <DinnerSchedulePage key="dinner" />
      case 'HYPER-V':
        return <VirtualMachinesPage key="vm" />
      case '알림':
        return <NotificationsPage key="notifications" />
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
      <Toaster position="top-right" richColors theme={'light'} />
      <VMResponseDialog />
      <VMRequestReceiverDialog />
    </div>
  )
}
