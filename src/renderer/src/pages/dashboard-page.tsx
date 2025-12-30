import { useMemo } from 'react'
import { ArrowRight01Icon, Task01Icon, UserIcon, VirtualRealityVr01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useCalendarStore } from '@/stores/calendar'
import { useHypervStore } from '@/stores/hyperv'
import { useTaskStore } from '@/stores/task'
import { openUniPost } from '@/util/util'

export function DashboardPage() {
  const eventsByDate = useCalendarStore((state) => state.eventsByDate)
  const teamTasks = useTaskStore((state) => state.teamTasks)
  const vms = useHypervStore((state) => state.vms)

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

  const filteredTasks = useMemo(() => {
    return teamTasks.filter((task) => task.STATUS_CODE === 'N' || task.REQ_TITLE.includes('긴급'))
  }, [teamTasks])

  const requestVM = useHypervStore((state) => state.requestVM)

  return (
    <div className="p-8 h-full flex flex-col bg-white">
      <PageHeader
        title="대시보드"
        description="실시간 팀 현황 및 주요 지표를 요약하여 보여줍니다."
        icon={<HugeiconsIcon icon={Task01Icon} size={20} />}
      />

      <div className="flex-1 grid grid-cols-3 gap-5 min-h-0">
        <div className="col-span-2">
          <Card className="h-full border-slate-200 shadow-none overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">업무 현황</span>
                <Badge variant="destructive" className="h-5 text-[10px]">
                  고객사답변 건
                </Badge>
                <Badge variant="secondary" className="h-5 text-[10px]">
                  제목에 긴급 포함 건
                </Badge>
              </div>
              <span className="text-xs text-slate-500">{filteredTasks.length}건</span>
            </div>
            <ScrollArea className="h-[calc(78vh-80px)]">
              <div className="p-4 space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">긴급 업무가 없습니다.</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.SR_IDX}
                      onClick={() => openUniPost(task.SR_IDX)}
                      className="group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer"
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-primary uppercase truncate">{task.CM_NAME}</span>
                        <span className="text-sm font-medium text-slate-900 truncate">{task.REQ_TITLE}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>{task.WRITER}</span>
                          <span>•</span>
                          <span>{task.REQ_DATE}</span>
                          <span>•</span>
                          <Badge variant={task.STATUS_CODE === 'N' ? 'destructive' : 'secondary'} className="h-4 text-[9px] px-1.5">
                            {task.STATUS_CODE === 'N' ? task.STATUS : '제목에 긴급 포함 건'}
                          </Badge>
                        </div>
                      </div>
                      <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-slate-300 group-hover:text-red-500 ml-2" />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* 오른쪽: VM 및 휴가자 (수직 배치) */}
        <div className="col-span-1 flex flex-col gap-5">
          <div className="flex-1">
            <Card className="h-full border-slate-200 shadow-none flex flex-col">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <HugeiconsIcon icon={VirtualRealityVr01Icon} size={16} className="text-primary" />
                <span className="text-sm font-bold text-slate-800">VM 실시간 상태</span>
              </div>
              <ScrollArea className="h-[calc(48vh-80px)]">
                <div className="px-2 space-y-2">
                  {vms.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-xs">VM 정보가 없습니다.</p>
                    </div>
                  ) : (
                    vms.map((vm) => (
                      <div key={vm.vmName} className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', vm.isConnected ? 'bg-primary' : 'bg-slate-300')} />
                            <span className="text-sm font-semibold text-slate-800">{vm.vmName}</span>
                          </div>
                          <Badge variant={vm.isConnected ? 'default' : 'secondary'} className="h-5 text-[10px]">
                            {vm.isConnected ? '사용 중' : '대기'}
                          </Badge>
                        </div>
                        {vm.currentUser && (
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                            <span>사용자: {vm.currentUser}</span>
                          </div>
                        )}
                        {vm.isConnected && vm.currentHostname && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-7 text-[11px]"
                            onClick={async () => {
                              const myHostname = await window.api.getHostname()
                              if (vm.currentHostname === myHostname) {
                                toast.info('현재 사용 중인 VM입니다.')
                                return
                              }
                              if (!vm.currentHostname) return
                              requestVM(vm.vmName, vm.currentHostname)
                              toast.success(`${vm.currentUser}님에게 사용 요청을 전송했습니다.`)
                            }}
                          >
                            사용 요청
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          <div className="flex-1">
            <Card className="h-full border-slate-200 shadow-none flex flex-col">
              <div className="px-5 py-2 border-b border-slate-100 flex items-center gap-2">
                <HugeiconsIcon icon={UserIcon} size={16} className="text-primary" />
                <span className="text-sm font-bold text-slate-800">오늘의 휴가</span>
              </div>
              <ScrollArea className="h-[calc(24vh-80px)]">
                <div className="px-2 space-y-2">
                  {todayVacations.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-xs">오늘 휴가자가 없습니다.</p>
                    </div>
                  ) : (
                    todayVacations.map((vacation) => (
                      <div
                        key={vacation.id}
                        className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                      >
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
    </div>
  )
}
