import { useState } from 'react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ProcessedEvent } from '@shared/types/calendar'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
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

// 사용자별 색상 매핑 (HTML 샘플과 동일)
const USER_COLORS: Record<string, string> = {
  정홍희: '#8AB4F8',
  이루리: '#81C995',
  김동혁: '#FDD663',
  최지은: '#F28B82',
  장정호: '#78D9EC',
  조현영: '#FCAD70',
  박중현: '#E8EAED'
}

const DEFAULT_COLORS = ['#8AB4F8', '#81C995', '#FDD663', '#F28B82', '#78D9EC', '#FCAD70']
let colorIndex = 0

function getUserColor(userName: string): string {
  if (USER_COLORS[userName]) {
    return USER_COLORS[userName]
  }
  const color = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length]
  colorIndex++
  return color
}

// 휴가 아이템 컴포넌트 (Bar 형태 - 연속된 날짜)
function VacationItem({ vacation, dateStr }: { vacation: ProcessedEvent; dateStr: string }) {
  const isStart = vacation.startDate === dateStr
  const isEnd = vacation.endDate === dateStr
  const isMultiDay = vacation.startDate !== vacation.endDate
  const color = getUserColor(vacation.name)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              'text-[11px] px-2 py-1 cursor-pointer transition-all hover:opacity-80 font-medium truncate',
              // Bar 형태 처리
              isMultiDay ? (isStart ? 'rounded-l-md rounded-r-none' : isEnd ? 'rounded-r-md rounded-l-none' : 'rounded-none') : 'rounded-md'
            )}
            style={{
              backgroundColor: color,
              color: '#333'
            }}
          >
            {/* 시작일에만 이름 표시, 중간/끝은 빈 공간 */}
            {isStart || !isMultiDay ? <span>{vacation.displayLabel}</span> : <span className="opacity-0">.</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1.5">
            <p className="font-semibold text-sm">{vacation.name}</p>
            <div className="text-xs text-slate-600 space-y-0.5">
              <p>📅 {vacation.startDate === vacation.endDate ? vacation.startDate : `${vacation.startDate} ~ ${vacation.endDate}`}</p>
              <p>⏰ {vacation.displayLabel}</p>
              <p>🏷️ {vacation.type}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// 날짜 셀 컴포넌트
function DayCell({ date, vacations, isCurrentMonth }: { date: Date; vacations: ProcessedEvent[]; isCurrentMonth: boolean }) {
  const dateStr = formatDate(date)
  const today = formatDate(new Date())
  const isToday = dateStr === today
  const dayOfWeek = date.getDay()
  const isSunday = dayOfWeek === 0
  const isSaturday = dayOfWeek === 6

  // 휴가가 1개만 보이도록 제한 (요구사항 3)
  const maxVisible = 1
  const visibleVacations = vacations.slice(0, maxVisible)
  const hiddenCount = Math.max(0, vacations.length - maxVisible)

  return (
    <div
      className={cn(
        'min-h-[110px] border-r border-b border-slate-200 p-2 transition-colors',
        isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/30',
        isToday && 'bg-blue-50/50 ring-2 ring-blue-300 ring-inset'
      )}
    >
      {/* 날짜 표시 */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            'text-sm font-semibold',
            isToday && 'text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full',
            !isToday && !isCurrentMonth && 'text-slate-400',
            !isToday && isCurrentMonth && isSunday && 'text-red-600',
            !isToday && isCurrentMonth && isSaturday && 'text-blue-600',
            !isToday && isCurrentMonth && !isSunday && !isSaturday && 'text-slate-700'
          )}
        >
          {date.getDate()}
        </span>

        {/* +n개 더보기 (요구사항 2) */}
        {hiddenCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <button className="text-[10px] text-slate-600 hover:text-blue-600 px-1.5 py-0.5 bg-slate-100 rounded hover:bg-blue-100 transition-colors font-medium">
                  +{hiddenCount}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1.5">
                  <p className="font-semibold text-xs">추가 휴가 ({hiddenCount}건)</p>
                  {vacations.slice(maxVisible).map((vacation) => (
                    <div key={vacation.id} className="text-xs">
                      <span className="font-medium">{vacation.name}</span> - {vacation.displayLabel}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* 휴가 목록 (최대 1개만 표시) */}
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
  const eventsByDate = useCalendarStore((state) => state.eventsByDate)
  const connectionStatus = useCalendarStore((state) => state.connectionStatus)

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

  // 달력 그리드 생성 (요구사항 4: 6주 고정)
  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = []
  const totalCells = 6 * 7 // 6주 × 7일 = 42칸

  // 이전 달의 마지막 날짜들
  const prevMonthDays = firstDay
  const prevMonthLastDate = new Date(year, month, 0).getDate()
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, prevMonthLastDate - i),
      isCurrentMonth: false
    })
  }

  // 현재 달의 날짜들
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      date: new Date(year, month, day),
      isCurrentMonth: true
    })
  }

  // 다음 달의 날짜들로 나머지 채우기
  const remainingCells = totalCells - calendarDays.length
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false
    })
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  // 디버깅 정보 계산
  const eventDates = Object.keys(eventsByDate)
  const totalEvents = Object.values(eventsByDate).flat().length

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
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-semibold text-slate-900">휴가 일정</h1>
          {connectionStatus === 'connected' && <Badge variant="default">✅ 연결됨</Badge>}
          {connectionStatus === 'connecting' && <Badge variant="outline">🔄 연결 중...</Badge>}
          {connectionStatus === 'error' && <Badge variant="destructive">❌ 연결 실패</Badge>}
          {connectionStatus === 'disconnected' && <Badge variant="secondary">⚠️ 연결 끊김</Badge>}
        </div>
        <p className="text-slate-600">4팀 휴가 일정을 확인하세요.</p>
      </div>

      {/* 달력 네비게이션 */}
      <div className="gap-6 flex items-center justify-between">
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

      {/* 디버깅 정보 (개발 환경) */}
      {import.meta.env.DEV && (
        <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 text-xs text-slate-700 space-y-1">
          <div className="font-semibold text-sm mb-2">📊 디버그 정보</div>
          <div>• 데이터가 있는 날짜: {eventDates.length}일</div>
          <div>• 전체 이벤트 수: {totalEvents}개</div>
          {eventDates.length > 0 && (
            <div>
              • 날짜 예시: {eventDates.slice(0, 5).join(', ')}
              {eventDates.length > 5 ? '...' : ''}
            </div>
          )}
          <div>• 연결 상태: {connectionStatus}</div>
        </div>
      )}

      {/* 빈 데이터 안내 */}
      {eventDates.length === 0 && (
        <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-lg text-slate-700 font-semibold mb-2">휴가 데이터가 없습니다</p>
          <p className="text-sm text-slate-500">서버 연결 상태를 확인하세요</p>
        </div>
      )}

      {/* 달력 */}
      {eventDates.length > 0 && (
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

          {/* 날짜 그리드 (6주 고정) */}
          <div className="grid grid-cols-7">
            {calendarDays.map((item, i) => {
              const dateStr = formatDate(item.date)
              const dayVacations = eventsByDate[dateStr] || []

              return <DayCell key={i} date={item.date} vacations={dayVacations} isCurrentMonth={item.isCurrentMonth} />
            })}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(USER_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
            <span className="text-sm text-slate-700">{name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
