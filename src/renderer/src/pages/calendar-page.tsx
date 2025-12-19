import { motion } from 'motion/react'
import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useVacationStore } from '@/stores/vacationStore'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, ArrowLeft01Icon, ArrowRight01Icon, Loading03Icon } from '@hugeicons/core-free-icons'

type VacationData = {
  useId: string
  usName: string
  itemName: string
  useSdate: string
  useEdate: string
  deptName: string
  useDesc: string
  useStime: string | null
  useEtime: string | null
  useTimeTypeName?: string
}

type VacationEvent = {
  vacation: VacationData
  startDate: Date
  endDate: Date
  displayText: string
  isMultiDay: boolean
  daySpan: number
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showMoreDialog, setShowMoreDialog] = useState(false)

  // Zustand 스토어
  const { vacations, isLoading, error, fetchVacations, clearError } = useVacationStore()

  // 컴포넌트 마운트 시 및 월 변경 시 데이터 가져오기
  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    fetchVacations(year, month)
  }, [currentDate, fetchVacations])

  const { weekRows, vacationsByDate } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const dates: Date[] = []

    // 이전 달 날짜
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      dates.push(new Date(year, month, -i))
    }

    // 현재 달 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day))
    }

    // 다음 달 날짜
    const remainingDays = 7 - (dates.length % 7)
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        dates.push(new Date(year, month + 1, i))
      }
    }

    // 주 단위로 분할
    const weeks: Date[][] = []
    for (let i = 0; i < dates.length; i += 7) {
      weeks.push(dates.slice(i, i + 7))
    }

    // 날짜별 휴가 이벤트 정리
    const vacationsByDate: Record<string, VacationEvent[]> = {}

    vacations.forEach((vacation) => {
      // YYYY-MM-DD 형식을 정확하게 로컬 날짜로 파싱
      const [startYear, startMonth, startDay] = vacation.useSdate.split('-').map(Number)
      const [endYear, endMonth, endDay] = vacation.useEdate.split('-').map(Number)

      const startDate = new Date(startYear, startMonth - 1, startDay)
      const endDate = new Date(endYear, endMonth - 1, endDay)

      // 휴가 기간의 각 날짜에 이벤트 추가
      const currentLoopDate = new Date(startDate)
      while (currentLoopDate <= endDate) {
        const dateKey = `${currentLoopDate.getFullYear()}-${String(currentLoopDate.getMonth() + 1).padStart(2, '0')}-${String(currentLoopDate.getDate()).padStart(2, '0')}`

        if (!vacationsByDate[dateKey]) {
          vacationsByDate[dateKey] = []
        }

        // 표시 텍스트 생성
        let displayText = vacation.usName

        // 시간 기반 휴가
        if (vacation.useStime && vacation.useEtime) {
          displayText += ` (${vacation.useStime}~${vacation.useEtime})`
        }
        // 여러 날 휴가
        else {
          const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          if (totalDays > 1) {
            displayText += ` (${totalDays}일)`
          }
        }

        const event: VacationEvent = {
          vacation,
          startDate,
          endDate,
          displayText,
          isMultiDay: startDate.getTime() !== endDate.getTime(),
          daySpan: Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        }

        vacationsByDate[dateKey].push(event)

        currentLoopDate.setDate(currentLoopDate.getDate() + 1)
      }
    })

    return { weekRows: weeks, vacationsByDate }
  }, [currentDate, vacations])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  const formatYearMonth = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
  }

  const getVacationColor = (itemName: string) => {
    if (itemName.includes('연차')) return 'bg-blue-100 text-blue-800 border-blue-300'
    if (itemName.includes('대체')) return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    if (itemName.includes('반차') || itemName.includes('오후') || itemName.includes('오전'))
      return 'bg-amber-100 text-amber-800 border-amber-300'
    return 'bg-slate-100 text-slate-800 border-slate-300'
  }

  const handleMoreClick = (date: Date) => {
    setSelectedDate(date)
    setShowMoreDialog(true)
  }

  const MAX_EVENTS_PER_DAY = 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-4 h-full flex flex-col"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={Calendar03Icon} className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-900">일정/휴가</h1>
          {isLoading && (
            <HugeiconsIcon icon={Loading03Icon} className="w-5 h-5 text-blue-600 animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToToday} className="font-medium" disabled={isLoading}>
            오늘
          </Button>
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToPreviousMonth}
              disabled={isLoading}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
            </Button>
            <div className="px-4 text-base font-semibold min-w-[140px] text-center text-slate-800">
              {formatYearMonth(currentDate)}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth} disabled={isLoading}>
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 에러 알림 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              닫기
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 캘린더 */}
      <div className="flex-1 bg-white border border-slate-300 rounded-xl overflow-hidden flex flex-col shadow-sm">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-50">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-semibold py-3 border-r border-slate-200 last:border-r-0 ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-slate-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 주 단위 행 */}
        <div className="flex flex-col">
          {weekRows.map((week, weekIndex) => {
            const currentMonth = currentDate.getMonth()

            return (
              <div key={weekIndex} className="h-[140px] grid grid-cols-7 border-b border-slate-200 last:border-b-0">
                {week.map((date, dayIndex) => {
                  const isCurrentMonth = date.getMonth() === currentMonth
                  const today = new Date()
                  const isToday =
                    today.getFullYear() === date.getFullYear() &&
                    today.getMonth() === date.getMonth() &&
                    today.getDate() === date.getDate()
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

                  const events = vacationsByDate[dateKey] || []
                  const visibleEvents = events.slice(0, MAX_EVENTS_PER_DAY)
                  const hiddenCount = Math.max(0, events.length - MAX_EVENTS_PER_DAY)

                  return (
                    <div
                      key={dayIndex}
                      className={`border-r border-slate-200 last:border-r-0 p-2 flex flex-col ${
                        !isCurrentMonth ? 'bg-slate-50/50' : isWeekend ? 'bg-blue-50/30' : 'bg-white'
                      }`}
                    >
                      {/* 날짜 숫자 */}
                      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
                        <div
                          className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-blue-600 text-white'
                              : !isCurrentMonth
                                ? 'text-slate-400'
                                : date.getDay() === 0
                                  ? 'text-red-600'
                                  : date.getDay() === 6
                                    ? 'text-blue-600'
                                    : 'text-slate-800'
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      </div>

                      {/* 휴가 이벤트 - 스크롤 가능 */}
                      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                        {visibleEvents.map((event, index) => (
                          <div
                            key={event.vacation.useId + '-' + index}
                            className={`text-[10px] px-1.5 py-0.5 rounded border font-medium truncate ${getVacationColor(event.vacation.itemName)}`}
                            title={`${event.vacation.usName} - ${event.vacation.itemName}`}
                          >
                            {event.displayText}
                          </div>
                        ))}

                        {hiddenCount > 0 && (
                          <button
                            onClick={() => handleMoreClick(date)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold hover:underline w-full text-left px-1.5"
                          >
                            +{hiddenCount}개 더보기
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* 더보기 다이얼로그 */}
      <Dialog open={showMoreDialog} onOpenChange={setShowMoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && (
                <>
                  {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            {selectedDate && (() => {
              const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
              const events = vacationsByDate[dateKey] || []

              return (
                <div className="space-y-3">
                  {events.map((event, index) => (
                    <div
                      key={event.vacation.useId + '-' + index}
                      className="p-3 border border-slate-200 rounded-lg space-y-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-semibold text-slate-900">{event.vacation.usName}</div>
                        <div
                          className={`text-xs px-2 py-0.5 rounded border font-medium ${getVacationColor(event.vacation.itemName)}`}
                        >
                          {event.vacation.itemName}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">{event.vacation.deptName}</div>
                      <div className="text-sm text-slate-600">
                        {event.vacation.useSdate} ~ {event.vacation.useEdate}
                      </div>
                      {event.vacation.useStime && event.vacation.useEtime && (
                        <div className="text-sm text-slate-600">
                          {event.vacation.useStime}시 ~ {event.vacation.useEtime}시
                        </div>
                      )}
                      {event.vacation.useDesc && (
                        <div className="text-sm text-slate-500 pt-1.5 border-t">{event.vacation.useDesc}</div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
