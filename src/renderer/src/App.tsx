import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Header } from '@/components/header'
import { LoadingScreen } from '@/components/loading-screen' // 로딩 스크린 임포트
import { Toaster } from '@/components/ui/sonner'
import { VMResponseDialog } from '@/components/vm-response-dialog'
import { DashboardPage } from '@/pages/dashboard-page'
import { NotificationsPage } from '@/pages/notifications-page'
import { ServerErrorPage } from '@/pages/server-error-page'
import { VirtualMachinesPage } from '@/pages/virtual-machines-page'
import { useCalendarStore } from '@/stores/calendar'
import { useHypervStore } from '@/stores/hyperv'
import { useNotificationStore } from '@/stores/notification'
import { useSocketStore } from '@/stores/socket'
import { useTaskStore } from '@/stores/task'
import { useVersionStore } from '@/stores/version'
import { VMRequestReceiverDialog } from './components/vm-request-receiver-dialog'
import { TasksPage } from './pages/tasks-page'
import { VersionPage } from './pages/version-page'

export default function App() {
  const [activeTab, setActiveTab] = useState('대시보드')
  const [isInitializing, setIsInitializing] = useState(true)
  const [serverError, setServerError] = useState(false)

  const initSocket = useSocketStore((state) => state.initSocket)
  const initCalendarListeners = useCalendarStore((state) => state.initListeners)
  const initTaskListeners = useTaskStore((state) => state.initListeners)
  const initHypervListeners = useHypervStore((state) => state.initListeners)
  const initNotificationListeners = useNotificationStore((state) => state.initListeners)
  const initVersion = useVersionStore((state) => state.initVersion)
  const setVMRequestDialog = useHypervStore((state) => state.setVMRequestDialog) // 추가
  const setVMResponseDialog = useHypervStore((state) => state.setVMResponseDialog)

  // 앱 시작 시 공유 Socket 연결 및 각 스토어 리스너 등록
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const handleError = () => setServerError(true)
        // 1. 공유 소켓 연결 (가장 먼저!)
        initSocket(handleError)

        // 2. 각 스토어의 이벤트 리스너 등록
        initCalendarListeners()
        initTaskListeners()
        initHypervListeners()
        initNotificationListeners()

        // 3. 버전 정보 가져오기
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
  }, [initSocket, initCalendarListeners, initTaskListeners, initHypervListeners, initNotificationListeners, initVersion])

  // Native Notification 클릭 이벤트 처리
  useEffect(() => {
    // VM 요청 알림 클릭 시 (알림 페이지 이동 + 해당 알림 다이얼로그 오픈)
    const unsubscribeVMRequestClick = window.api.onVMRequestClicked((data) => {
      console.log('[App] VM 요청 알림 클릭:', data)
      setVMRequestDialog({
        isOpen: true,
        vmName: data.vmName,
        requesterName: data.senderName,
        timestamp: new Date().toISOString()
      })
    })

    // VM 결과 알림 클릭 시 (Dialog 열기)
    const unsubscribeResultClick = window.api.onVMResultClicked((data) => {
      console.log('[App] VM 결과 알림 클릭:', data)
      // Dialog가 이미 열려 있지 않으면 열기
      const currentDialog = useHypervStore.getState().vmResponseDialog
      if (!currentDialog || !currentDialog.isOpen) {
        setVMResponseDialog({
          type: data.type === 'vm-approved' ? 'approved' : 'rejected',
          vmName: data.vmName,
          isOpen: true
        })
      }
    })

    return () => {
      unsubscribeVMRequestClick()
      unsubscribeResultClick()
    }
  }, [])

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
