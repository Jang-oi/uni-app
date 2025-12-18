import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Header } from '@/components/header'
import { AdminPage } from '@/pages/admin-page'
import { CalendarPage } from '@/pages/calendar-page'
import { TasksPage } from '@/pages/tasks-page'
import { VirtualMachinesPage } from '@/pages/virtual-machines-page'

export default function App() {
  const [activeTab, setActiveTab] = useState('홈')

  const renderPage = () => {
    switch (activeTab) {
      case '일정':
        return <CalendarPage key="calendar" />
      case '업무':
        return <TasksPage key="tasks" />
      case '가상머신':
        return <VirtualMachinesPage key="vm" />
      case '관리자':
        return <AdminPage key="admin" />
      default:
        return <TasksPage key="tasks" />
    }
  }

  return (
    <div className="h-screen flex flex-col select-none">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
      </main>
    </div>
  )
}
