import { useEffect, useState } from 'react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { api, ApiResponse } from '@shared/api/client'
import { ProcessedEvent } from '@shared/types/calendar'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useCalendarStore } from '@/stores/calendar'

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

// 휴가 기간 계산 (일 수)
const getVacationDays = (vacation: ProcessedEvent) => {
  const start = new Date(vacation.startDate)
  const end = new Date(vacation.endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

// 휴가 타입별 색상 설정
const getVacationColor = (type: string, displayLabel: string) => {
  // 반차/반반차
  if (type.includes('반차') || displayLabel.includes('반차')) {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300'
    }
  }
  // 연차 (종일)
  if (type.includes('연차')) {
    return {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-300'
    }
  }
  // 기타 (경조사, 공가 등)
  return {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300'
  }
}

// 휴가 아이템 컴포넌트 (Bar 형태)
function VacationItem({ vacation, dateStr }: { vacation: ProcessedEvent; dateStr: string }) {
  const isStart = vacation.startDate === dateStr
  const isEnd = vacation.endDate === dateStr
  const isMultiDay = vacation.startDate !== vacation.endDate
  const days = getVacationDays(vacation)
  const colors = getVacationColor(vacation.type, vacation.displayLabel)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              'text-[11px] px-2 py-1 mb-1 cursor-pointer transition-all hover:opacity-80 border',
              colors.bg,
              colors.text,
              colors.border,
              // Bar 모양 처리
              isMultiDay ? (isStart ? 'rounded-l rounded-r-none' : isEnd ? 'rounded-r rounded-l-none' : 'rounded-none') : 'rounded',
              // 내용 표시
              'truncate font-medium'
            )}
          >
            {/* 시작일에만 이름 + 기간 표시 */}
            {isStart || !isMultiDay ? (
              <span className="flex items-center gap-1">
                <span>{vacation.name}</span>
                {isMultiDay && <span className="text-[10px] opacity-70">({days}일)</span>}
              </span>
            ) : (
              // 중간/끝일은 빈 공간
              <span className="opacity-0">.</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-sm">{vacation.name}</p>
              <span className={cn('text-xs px-2 py-0.5 rounded', colors.bg, colors.text)}>{vacation.type}</span>
            </div>
            <div className="text-xs text-slate-600 space-y-0.5">
              <p>📅 {vacation.startDate === vacation.endDate ? vacation.startDate : `${vacation.startDate} ~ ${vacation.endDate}`}</p>
              <p>⏰ {vacation.displayLabel}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// 날짜 셀 컴포넌트
function DayCell({ date, vacations }: { date: Date; vacations: ProcessedEvent[] }) {
  const dateStr = formatDate(date)
  const today = formatDate(new Date())
  const isToday = dateStr === today
  const dayOfWeek = date.getDay()
  const isSunday = dayOfWeek === 0
  const isSaturday = dayOfWeek === 6

  // 휴가가 3개 이상일 때 처리
  const maxVisible = 4
  const visibleVacations = vacations.slice(0, maxVisible)
  const hiddenCount = Math.max(0, vacations.length - maxVisible)

  return (
    <div
      className={cn(
        'min-h-[110px] border-r border-b border-slate-200 p-2 transition-colors',
        isToday ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'
      )}
    >
      {/* 날짜 표시 */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            'text-sm font-semibold',
            isToday && 'text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full',
            !isToday && isSunday && 'text-red-600',
            !isToday && isSaturday && 'text-blue-600',
            !isToday && !isSunday && !isSaturday && 'text-slate-700'
          )}
        >
          {date.getDate()}
        </span>
        {hiddenCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <button className="text-[10px] text-slate-600 hover:text-blue-600 px-1.5 py-0.5 bg-slate-100 rounded hover:bg-blue-100 transition-colors">
                  +{hiddenCount}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1.5">
                  <p className="font-semibold text-xs">추가 휴가 ({hiddenCount}건)</p>
                  {vacations.slice(maxVisible).map((vacation) => (
                    <div key={vacation.id} className="text-xs">
                      <span className="font-medium">{vacation.name}</span> - {vacation.type}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* 휴가 목록 */}
      <div className="space-y-1">
        {visibleVacations.map((vacation) => (
          <VacationItem key={`${vacation.id}-${dateStr}`} vacation={vacation} dateStr={dateStr} />
        ))}
      </div>
    </div>
  )
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  // 스토어에서 데이터만 가져오기 (Socket은 App.tsx에서 이미 초기화됨)
  const eventsByDate = useCalendarStore((state) => state.eventsByDate)
  const setEventsByDate = useCalendarStore((state) => state.setEventsByDate)

  // 서버에서 데이터 조회 (초기 로딩)
  useEffect(() => {
    const fetchVacations = async () => {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const response = await api.get<ApiResponse>(`/api/vacations/calendar/${year}/${month}`)

      if (response.data.success && response.data.data) {
        const data = response.data.data as { eventsDate: Record<string, ProcessedEvent[]> }
        setEventsByDate(data.eventsDate)
      }
    }
    fetchVacations()
  }, [currentDate, setEventsByDate])

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8 space-y-6"
    >
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">휴가 일정</h1>
        <p className="text-slate-600">4팀 휴가 일정을 확인하세요.</p>
      </div>

      {/* 달력 네비게이션 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">
            {year}년 {month + 1}월
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
            오늘
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <HugeiconsIcon icon={ArrowRight01Icon} className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 달력 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={cn(
                'py-3 text-center text-sm font-bold border-r border-slate-200 last:border-r-0',
                i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-slate-700'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => {
            if (!date) {
              return <div key={i} className="min-h-[110px] border-r border-b border-slate-200 bg-slate-50/30" />
            }

            const dateStr = formatDate(date)
            const dayVacations = eventsByDate[dateStr] || []

            return <DayCell key={i} date={date} vacations={dayVacations} />
          })}
        </div>
      </div>
    </motion.div>
  )
}
