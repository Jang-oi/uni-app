import { useEffect, useMemo, useState } from 'react'
import { ArrowRight01Icon, DashboardSquare03Icon, DocumentValidationIcon, Search01Icon, TwitterIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VersionUpdateDialog } from '@/components/version-update-dialog'
import { VMRequestProgress } from '@/components/vm-request-progress'
import { useCalendarStore } from '@/stores/calendar'
import { useHypervStore } from '@/stores/hyperv'
import { useTaskStore } from '@/stores/task'
import { useVersionStore } from '@/stores/version'
import { openUniPost } from '@/util/util'

type TeamTab = '2팀' | '4팀' | '미지정'

export function DashboardPage() {
  const [srNumber, setSrNumber] = useState('')
  const [teamTab, setTeamTab] = useState<TeamTab>('4팀')
  const eventsByDate = useCalendarStore((state) => state.eventsByDate)
  const teamTasks = useTaskStore((state) => state.teamTasks)
  const activeRequest = useHypervStore((state) => state.activeRequest)
  const cancelVMRequest = useHypervStore((state) => state.cancelVMRequest)
  const initVersion = useVersionStore((state) => state.initVersion)

  const handleSearchSR = async () => {
    if (srNumber.trim()) {
      await openUniPost(srNumber.trim())
      setSrNumber('')
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      await handleSearchSR()
    }
  }

  useEffect(() => {
    const initialize = async () => {
      await initVersion()
    }
    initialize()
  }, [])

  // 오늘 날짜 (YYYY-MM-DD)
  const today = useMemo(() => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  const todayVacations = useMemo(() => {
    const allEvents = Object.values(eventsByDate).flat()
    return allEvents.filter((event) => {
      return event.start <= today && today <= event.end
    })
  }, [eventsByDate, today])

  const urgentTasks = useMemo(() => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const oneMonthAgoStr = `${oneMonthAgo.getFullYear()}-${String(oneMonthAgo.getMonth() + 1).padStart(2, '0')}-${String(oneMonthAgo.getDate()).padStart(2, '0')}`

    return teamTasks.filter((task) => {
      const isOldTask = task.PROCESS_DATE && task.PROCESS_DATE <= oneMonthAgoStr
      return task.STATUS_CODE === 'N' || task.REQ_TITLE.includes('긴급') || (task.STATUS_CODE === 'A' && !task.WRITER) || isOldTask
    })
  }, [teamTasks])

  const team2Tasks = useMemo(() => urgentTasks.filter((t) => t.UNIDOCU_PART === '2팀'), [urgentTasks])
  const team4Tasks = useMemo(() => urgentTasks.filter((t) => t.UNIDOCU_PART === '4팀'), [urgentTasks])
  const unassignedTasks = useMemo(() => urgentTasks.filter((t) => !t.UNIDOCU_PART), [urgentTasks])

  const getBadgeProps = (task) => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const oneMonthAgoStr = `${oneMonthAgo.getFullYear()}-${String(oneMonthAgo.getMonth() + 1).padStart(2, '0')}-${String(oneMonthAgo.getDate()).padStart(2, '0')}`
    const isOldTask = task.PROCESS_DATE && task.PROCESS_DATE <= oneMonthAgoStr

    if (task.STATUS_CODE === 'N') return { variant: 'destructive', label: task.STATUS }
    if (task.REQ_TITLE.includes('긴급')) return { variant: 'secondary', label: '제목에 긴급 포함 건' }
    if (task.STATUS_CODE === 'A' && !task.WRITER) return { variant: 'default', label: task.STATUS }
    if (isOldTask) return { variant: 'outline', label: '처리 1개월 이상' }

    return { variant: 'outline', label: task.STATUS } as any
  }

  const renderTaskList = (tasks: typeof urgentTasks) => (
    <ScrollArea className="h-[calc(74vh-120px)]">
      <div className="px-4 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">긴급 업무가 없습니다.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const { variant, label } = getBadgeProps(task)
            return (
              <div
                key={task.SR_IDX}
                onClick={() => openUniPost(task.SR_IDX)}
                className="group flex items-center justify-between p-3 border transition-all cursor-pointer hover:bg-slate-50"
              >
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-primary uppercase truncate">{task.CM_NAME}</span>
                  <span className="text-sm font-medium text-slate-900 truncate">{task.REQ_TITLE}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Badge variant={variant} className="h-4 text-[9px] px-1.5">
                      {label}
                    </Badge>
                    <span>•</span>
                    <span>{task.REQ_DATE}</span>
                  </div>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-slate-300 group-hover:text-red-500 ml-2" />
              </div>
            )
          })
        )}
      </div>
    </ScrollArea>
  )

  return (
    <div className="p-8 h-full flex flex-col bg-white">
      <PageHeader
        title="대시보드"
        description="최근 6개월 업무와 팀원 휴가 현황을 한눈에 확인하세요."
        icon={<HugeiconsIcon icon={DashboardSquare03Icon} size={20} />}
        action={
          activeRequest ? (
            <VMRequestProgress
              vmName={activeRequest.vmName}
              expiresAt={activeRequest.expiresAt}
              onCancel={() => cancelVMRequest(activeRequest.vmName)}
            />
          ) : undefined
        }
      />

      <div className="flex-1 grid grid-cols-3 gap-5 min-h-0">
        <div className="col-span-2">
          <Card className="h-full border-slate-200 shadow-none overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={DocumentValidationIcon} size={16} className="text-primary" />
                  <span className="text-sm font-bold text-slate-800">업무 현황</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="h-5 text-[10px]">
                    접수 건
                  </Badge>
                  <Badge variant="destructive" className="h-5 text-[10px]">
                    고객사답변 건
                  </Badge>
                  <Badge variant="secondary" className="h-5 text-[10px]">
                    긴급 포함 건
                  </Badge>
                  <Badge variant="outline" className="h-5 text-[10px]">
                    처리 1개월 이상
                  </Badge>
                </div>
              </div>
            </div>

            <Tabs value={teamTab} onValueChange={(v) => setTeamTab(v as TeamTab)} className="flex flex-col flex-1 min-h-0">
              <div className="px-5 pt-3">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="4팀">4팀 ({team4Tasks.length}건)</TabsTrigger>
                  <TabsTrigger value="2팀">2팀 ({team2Tasks.length}건)</TabsTrigger>
                  <TabsTrigger value="미지정">미지정 ({unassignedTasks.length}건)</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="2팀" className="flex-1 mt-2">
                {renderTaskList(team2Tasks)}
              </TabsContent>
              <TabsContent value="4팀" className="flex-1 mt-2">
                {renderTaskList(team4Tasks)}
              </TabsContent>
              <TabsContent value="미지정" className="flex-1 mt-2">
                {renderTaskList(unassignedTasks)}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="col-span-1 flex flex-col gap-5">
          <Card className="border-slate-200 shadow-none">
            <div className="px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Search01Icon} size={16} className="text-primary" />
                <span className="text-sm font-bold text-slate-800">접수번호 검색</span>
              </div>
            </div>
            <div className="p-4">
              <div className="relative flex gap-2">
                <Input
                  value={srNumber}
                  onChange={(e) => setSrNumber(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="접수번호를 입력하세요"
                  className="flex-1 text-sm"
                />
                <Button onClick={handleSearchSR} className="px-4">
                  <HugeiconsIcon icon={Search01Icon} size={18} />
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex-1">
            <Card className="h-full border-slate-200 shadow-none flex flex-col">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={TwitterIcon} size={16} className="text-primary" />
                  <span className="text-sm font-bold text-slate-800">오늘의 휴가</span>
                </div>
                <span className="text-xs text-slate-500">{todayVacations.length}명</span>
              </div>
              <ScrollArea className="h-[calc(56vh-80px)]">
                <div className="py-4 px-2 space-y-2">
                  {todayVacations.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-xs">오늘 휴가자가 없습니다.</p>
                    </div>
                  ) : (
                    todayVacations.map((vacation) => (
                      <div key={vacation.id} className="p-3 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">{vacation.title.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-800">{vacation.title}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
      <VersionUpdateDialog />
    </div>
  )
}
