import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'
import { CalendarPage } from '@/pages/calendar-page'
import { VirtualMachinesPage } from '@/pages/virtual-machines-page'
import { PersonalTasksPage } from './pages/personal-tasks-page'
import { TeamTasksPage } from './pages/team-tasks-page'
import { VersionPage } from './pages/version-page'

export default function App() {
  const [activeTab, setActiveTab] = useState('가상머신')

  const renderPage = () => {
    switch (activeTab) {
      case '일정':
        return <CalendarPage key="calendar" />
      case '팀업무':
        return <TeamTasksPage key="team-tasks" />
      case '개인업무':
        return <PersonalTasksPage key="personal-tasks" />
      case '가상머신':
        return <VirtualMachinesPage key="vm" />
      case '버전관리':
        return <VersionPage key="version" />
      default:
        return <VirtualMachinesPage key="vm" />
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
