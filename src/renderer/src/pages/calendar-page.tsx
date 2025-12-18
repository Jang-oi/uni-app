import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'

export function CalendarPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8 space-y-6"
    >
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">일정/휴가</h1>
        <p className="text-slate-600">팀원들의 일정과 휴가를 확인하세요</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="flex flex-col items-center justify-center py-20">
          <HugeiconsIcon icon={Calendar03Icon} className="h-16 w-16 text-slate-300 mb-4" />
          <p className="text-slate-500">캘린더 기능 준비 중입니다</p>
        </div>
      </div>
    </motion.div>
  )
}
