import { useEffect, useState } from 'react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { api, ApiResponse } from '@shared/api/client'
import { VacationRawData } from '@shared/types/data'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useVacationStore } from '@/stores/vacation'

// 날짜 유틸리티
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay()
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 휴가 아이템 컴포넌트
function VacationItem({ vacation, isStart }: { vacation: VacationRawData; isStart: boolean }) {
  const isMultiDay = vacation.useSdate !== vacation.useEdate

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              'text-[10px] px-2 py-0.5 mb-0.5 truncate cursor-pointer transition-all hover:opacity-80',
              isMultiDay ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800',
              isStart || !isMultiDay ? 'rounded-l' : '',
              isMultiDay ? 'rounded-r-none' : 'rounded'
            )}
          >
            {isStart || !isMultiDay ? vacation.usName : ''}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{vacation.usName}</p>
            <p className="text-xs text-slate-600">{vacation.itemName}</p>
            <p className="text-xs">
              {vacation.useSdate === vacation.useEdate ? vacation.useSdate : `${vacation.useSdate} ~ ${vacation.useEdate}`}
            </p>
            {vacation.useTimeTypeName && <p className="text-xs text-slate-500">{vacation.useTimeTypeName}</p>}
            {vacation.useDesc && <p className="text-xs text-slate-500">{vacation.useDesc}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// 날짜 셀 컴포넌트
function DayCell({ date, vacations }: { date: Date; vacations: VacationRawData[] }) {
  const dateStr = formatDate(date)
  const isToday = dateStr === formatDate(new Date())
  const maxVisible = 3
  const hiddenCount = Math.max(0, vacations.length - maxVisible)
  const visibleVacations = vacations.slice(0, maxVisible)
  const hiddenVacations = vacations.slice(maxVisible)

  return (
    <div
      className={cn(
        'min-h-[100px] border-r border-b border-slate-200 p-1 bg-white hover:bg-slate-50 transition-colors',
        isToday && 'bg-blue-50'
      )}
    >
      <div className={cn('text-sm font-medium mb-1 flex items-center justify-between', isToday && 'text-blue-600')}>
        <span>{date.getDate()}</span>
        {hiddenCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <button className="text-[10px] text-slate-600 hover:text-blue-600 px-1.5 py-0.5 bg-slate-100 rounded hover:bg-blue-100 transition-colors">
                  +{hiddenCount}개
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2">
                  {hiddenVacations.map((vacation) => (
                    <div key={vacation.useId} className="text-xs">
                      <p className="font-semibold">{vacation.usName}</p>
                      <p className="text-slate-600">{vacation.itemName}</p>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="space-y-0.5">
        {visibleVacations.map((vacation) => (
          <VacationItem key={vacation.useId} vacation={vacation} isStart={vacation.useSdate === dateStr} />
        ))}
      </div>
    </div>
  )
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const vacationsByDate = useVacationStore((state) => state.vacationsByDate)
  const setVacationsByDate = useVacationStore((state) => state.setVacationsByDate)

  // 서버에서 데이터 조회
  useEffect(() => {
    const fetchVacations = async () => {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const response = await api.get<ApiResponse>(`/api/vacations/calendar/${year}/${month}`)

      if (response.data.success && response.data.data) {
        const data = response.data.data as { vacationsByDate: Record<string, VacationRawData[]> }
        setVacationsByDate(data.vacationsByDate)
      }
    }
    fetchVacations()
  }, [currentDate, setVacationsByDate])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  // 이전 달
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  // 다음 달
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 달력 그리드 생성
  const calendarDays: (Date | null)[] = []

  // 이전 달의 빈 셀
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  // 현재 달의 날짜들
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8 space-y-6"
    >
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">
          {year}년 {monthNames[month]}
        </h1>
        <p className="text-slate-600">4팀 휴가 일정을 확인하세요.</p>
      </div>

      {/* 달력 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goToToday}>
            오늘
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 달력 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={cn(
                'py-3 text-center text-sm font-semibold border-r border-slate-200 last:border-r-0',
                i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-slate-700'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7" style={{ gridAutoRows: '1fr' }}>
          {calendarDays.map((date, i) => {
            if (!date) {
              return <div key={i} className="border-r border-b border-slate-200 bg-slate-50" />
            }

            const dateStr = formatDate(date)
            const dayVacations = vacationsByDate[dateStr] || []

            return <DayCell key={i} date={date} vacations={dayVacations} />
          })}
        </div>
      </div>
    </motion.div>
  )
}
