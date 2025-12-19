import { motion } from "motion/react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { vacationData } from "@/data/vacation-mockdata"
import { HugeiconsIcon } from '@hugeicons/react'
import {Calendar03Icon, ArrowLeft01Icon, ArrowRight01Icon} from "@hugeicons/core-free-icons";

type VacationData = {
  useId: string
  usId: string
  empNo: string
  usName: string
  itemName: string
  useSdate: string
  useEdate: string
  useMin: string
  useDayCnt: string
  deptName: string
  useTimeType: string
  useTimeTypeName: string
  aprvDocStsName: string
  useDesc: string
  useStime: string | null
  useEtime: string | null
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)) // 2025년 12월

  const { weekRows, vacationBarsByDate } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const dates: (Date | null)[] = []

    // 월 첫날 이전의 빈 칸 (이전 달 날짜로 채움)
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -(startingDayOfWeek - i - 1))
      dates.push(prevMonthDate)
    }

    // 해당 월의 모든 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day))
    }

    // 마지막 주를 채우기 위한 다음 달 날짜
    const remainingDays = 7 - (dates.length % 7)
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        dates.push(new Date(year, month + 1, i))
      }
    }

    // 주 단위로 분할
    const weeks: (Date | null)[][] = []
    for (let i = 0; i < dates.length; i += 7) {
      weeks.push(dates.slice(i, i + 7))
    }

    const vacationBarsByDate: Record<
      string,
      Array<{
        vacation: VacationData
        displayText: string
        span: number // 이 날짜부터 몇 칸 연속인지
      }>
    > = {}

    const processedVacations = new Set<string>()

    vacationData.forEach((vacation) => {
      if (processedVacations.has(vacation.useId)) return

      // 날짜 문자열을 로컬 타임존으로 파싱 (YYYY-MM-DD 형식)
      const [startYear, startMonth, startDay] = vacation.useSdate.split('-').map(Number)
      const [endYear, endMonth, endDay] = vacation.useEdate.split('-').map(Number)
      const vacStartDate = new Date(startYear, startMonth - 1, startDay)
      const vacEndDate = new Date(endYear, endMonth - 1, endDay)

      // 시작 날짜의 문자열 키
      const startDateKey = vacation.useSdate

      // 며칠간의 휴가인지 계산
      const daysDiff = Math.floor((vacEndDate.getTime() - vacStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // 표시 텍스트 생성
      let displayText = vacation.usName

      // 시간 기반 휴가인 경우 (useStime, useEtime이 있는 경우)
      if (vacation.useStime && vacation.useEtime) {
        displayText += `(${vacation.useStime}~${vacation.useEtime})`
      }
      // 여러 날 휴가인 경우
      else if (daysDiff > 1) {
        displayText += `(${daysDiff}일)`
      }

      // 시작 날짜에 이 휴가 바를 등록
      if (!vacationBarsByDate[startDateKey]) {
        vacationBarsByDate[startDateKey] = []
      }

      // 이 주에서 몇 칸을 차지하는지 계산 (같은 주 내에서만)
      let span = 0
      const startWeekIndex = Math.floor(dates.findIndex((d) => d && d.toISOString().split("T")[0] === startDateKey) / 7)

      for (let d = new Date(vacStartDate); d <= vacEndDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split("T")[0]
        const dateIndex = dates.findIndex((dt) => dt && dt.toISOString().split("T")[0] === dateKey)
        if (dateIndex === -1) continue

        const weekIndex = Math.floor(dateIndex / 7)
        if (weekIndex === startWeekIndex) {
          span++
        } else {
          break // 다음 주로 넘어가면 중단
        }
      }

      vacationBarsByDate[startDateKey].push({
        vacation,
        displayText,
        span,
      })

      processedVacations.add(vacation.useId)
    })

    return { weekRows: weeks, vacationBarsByDate }
  }, [currentDate])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatYearMonth = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
  }

  const getVacationColor = (itemName: string) => {
    if (itemName.includes("연차")) return "bg-blue-500/90 text-white border-blue-600 shadow-sm"
    if (itemName.includes("대체")) return "bg-emerald-500/90 text-white border-emerald-600 shadow-sm"
    if (itemName.includes("반차") || itemName.includes("오후") || itemName.includes("오전"))
      return "bg-amber-400/90 text-amber-900 border-amber-500 shadow-sm"
    return "bg-slate-500/90 text-white border-slate-600 shadow-sm"
  }

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
          <HugeiconsIcon icon={Calendar03Icon}/>
          <h1 className="text-xl font-semibold text-slate-900">일정/휴가</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            오늘
          </Button>
          <div className="flex items-center border border-slate-200 rounded-md">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <HugeiconsIcon icon={ArrowLeft01Icon}/>
            </Button>
            <div className="px-3 text-sm font-medium min-w-[120px] text-center">{formatYearMonth(currentDate)}</div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <HugeiconsIcon icon={ArrowRight01Icon}/>
            </Button>
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 border-r border-slate-200 last:border-r-0 ${
                index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-slate-700"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 주 단위 행 */}
        <div className="flex-1 flex flex-col">
          {weekRows.map((week, weekIndex) => {
            const currentMonth = currentDate.getMonth()

            return (
              <div
                key={weekIndex}
                className="flex-1 grid grid-cols-7 border-b border-slate-200 last:border-b-0 relative min-h-[120px]"
              >
                {week.map((date, dayIndex) => {
                  if (!date) return <div key={dayIndex} className="border-r border-slate-200 last:border-r-0" />

                  const isCurrentMonth = date.getMonth() === currentMonth
                  const isToday = new Date().toDateString() === date.toDateString()
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  const dateKey = date.toISOString().split("T")[0]

                  const barsStartingToday = vacationBarsByDate[dateKey] || []

                  // 이 날짜에 있는 모든 휴가 (툴팁용)
                  const allVacationsToday = vacationData.filter((v) => {
                    const [sYear, sMonth, sDay] = v.useSdate.split('-').map(Number)
                    const [eYear, eMonth, eDay] = v.useEdate.split('-').map(Number)
                    const vStart = new Date(sYear, sMonth - 1, sDay)
                    const vEnd = new Date(eYear, eMonth - 1, eDay)

                    // 시간 요소를 제거한 날짜만 비교
                    const currentDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                    const vStartDateOnly = new Date(vStart.getFullYear(), vStart.getMonth(), vStart.getDate())
                    const vEndDateOnly = new Date(vEnd.getFullYear(), vEnd.getMonth(), vEnd.getDate())

                    return currentDateOnly >= vStartDateOnly && currentDateOnly <= vEndDateOnly
                  })

                  const MAX_VISIBLE = 2
                  const hiddenCount = Math.max(0, allVacationsToday.length - MAX_VISIBLE)

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-r border-slate-200 last:border-r-0 p-1.5 ${
                        !isCurrentMonth ? "bg-slate-50" : isWeekend ? "bg-slate-50/50" : ""
                      }`}
                    >
                      {/* 날짜 숫자 */}
                      <div className="flex items-start justify-between mb-1">
                        <div
                          className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                            isToday
                              ? "bg-blue-600 text-white ring-2 ring-blue-300"
                              : !isCurrentMonth
                                ? "text-slate-400"
                                : date.getDay() === 0
                                  ? "text-red-600"
                                  : date.getDay() === 6
                                    ? "text-blue-600"
                                    : "text-slate-700"
                          }`}
                        >
                          {date.getDate()}
                        </div>

                        {hiddenCount > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <button className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                                  +{hiddenCount}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-2">
                                  {allVacationsToday.slice(MAX_VISIBLE).map((vac) => (
                                    <div
                                      key={vac.useId}
                                      className="text-xs space-y-0.5 pb-2 border-b last:border-0 last:pb-0"
                                    >
                                      <div className="font-semibold">{vac.usName}</div>
                                      <div className="text-slate-600">
                                        {vac.deptName} - {vac.itemName}
                                      </div>
                                      <div className="text-slate-600">
                                        {vac.useSdate} ~ {vac.useEdate}
                                      </div>
                                      {vac.useStime && vac.useEtime && (
                                        <div className="text-slate-600">
                                          {vac.useStime}시 ~ {vac.useEtime}시
                                        </div>
                                      )}
                                      {vac.useDesc && <div className="text-slate-500">{vac.useDesc}</div>}
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {barsStartingToday.slice(0, MAX_VISIBLE).map((bar, barIndex) => {
                        const rowPosition = barIndex
                        const topOffset = 28 + rowPosition * 22

                        return (
                          <TooltipProvider key={bar.vacation.useId}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`absolute text-[10px] px-2 py-1 rounded font-semibold truncate border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${getVacationColor(bar.vacation.itemName)}`}
                                  style={{
                                    left: "4px",
                                    width: `calc(${bar.span * 100}% - 8px)`,
                                    top: `${topOffset}px`,
                                    zIndex: 10 - barIndex,
                                  }}
                                >
                                  {bar.displayText}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <div className="font-semibold text-sm">{bar.vacation.usName}</div>
                                  <div className="text-xs text-slate-600">{bar.vacation.deptName} - {bar.vacation.itemName}</div>
                                  <div className="text-xs text-slate-600">
                                    {bar.vacation.useSdate} ~ {bar.vacation.useEdate}
                                  </div>
                                  {bar.vacation.useStime && bar.vacation.useEtime && (
                                    <div className="text-xs text-slate-600">
                                      {bar.vacation.useStime}시 ~ {bar.vacation.useEtime}시
                                    </div>
                                  )}
                                  {bar.vacation.useDesc && (
                                    <div className="text-xs text-slate-500 mt-1 pt-1 border-t">{bar.vacation.useDesc}</div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
