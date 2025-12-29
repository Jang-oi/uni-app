import { useMemo } from 'react'
import { Calendar03Icon, Task01Icon, UserIcon, VirtualRealityVr01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useCalendarStore } from '@/stores/calendar'
import { useHypervStore } from '@/stores/hyperv'
import { useTaskStore } from '@/stores/task'

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

  // 오늘의 휴가자 - startDate와 endDate 범위로 필터링
  const todayVacations = useMemo(() => {
    const allEvents = Object.values(eventsByDate).flat()
    return allEvents.filter((event) => {
      return event.startDate <= today && today <= event.endDate
    })
  }, [eventsByDate, today])

  // 미처리/고객사답변 업무
  const filteredTasks = useMemo(() => {
    return teamTasks
  }, [teamTasks])

  // HyperV 사용 현황 (최대 5개)
  const topVms = vms.filter((vm) => vm.isConnected)

  console.log(todayVacations)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8 space-y-6"
    >
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">대시보드</h1>
        <p className="text-slate-600">구독4팀 주요 정보</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Tasks Card */}
        <Card className="col-span-2 border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <HugeiconsIcon icon={Task01Icon} className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">확인 필요 업무</CardTitle>
                <CardDescription className="text-sm text-slate-600">미처리/고객사답변 · {filteredTasks.length}건</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[180px]">
              {filteredTasks.length > 0 ? (
                <Table className="w-full border border-slate-200">
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="text-xs font-semibold text-slate-700 uppercase tracking-wide">고객사</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 uppercase tracking-wide">상태</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 uppercase tracking-wide">요청일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.SR_IDX} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                        <TableCell className="py-3 text-[11px] font-medium text-slate-900">{task.CM_NAME}</TableCell>
                        <TableCell className="py-3">
                          <Badge
                            className={cn(
                              'text-xs',
                              task.STATUS_CODE === 'N' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            )}
                          >
                            {task.STATUS}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-[11px] text-slate-500">{task.REQ_DATE}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-500">확인이 필요한 업무가 없습니다</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        {/* Today's Vacations Card */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <HugeiconsIcon icon={Calendar03Icon} className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">오늘의 휴가자</CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  {today} · {todayVacations.length}명
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[240px]">
              {todayVacations.length > 0 ? (
                <div className="space-y-2">
                  {todayVacations.map((vacation) => (
                    <div
                      key={vacation.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <HugeiconsIcon icon={UserIcon} className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{vacation.name}</p>
                          <p className="text-xs text-slate-500">{vacation.type}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                        {vacation.displayLabel}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-500">오늘 휴가자가 없습니다</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* HyperV Status Card */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <HugeiconsIcon icon={VirtualRealityVr01Icon} className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">HyperV 사용 현황</CardTitle>
                <CardDescription className="text-sm text-slate-600">실시간 가상머신 상태</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[240px]">
              {topVms.length > 0 ? (
                <div className="space-y-2">
                  {topVms.map((vm) => (
                    <div
                      key={vm.vmName}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('w-2.5 h-2.5 rounded-full', vm.isConnected ? 'bg-emerald-500' : 'bg-slate-300')} />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{vm.vmName}</p>
                          <p className="text-xs text-slate-500">{vm.currentUser || '대기 중'}</p>
                        </div>
                      </div>
                      <Badge
                        variant={vm.isConnected ? 'default' : 'secondary'}
                        className={cn('text-xs', vm.isConnected ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-200 text-slate-600')}
                      >
                        {vm.isConnected ? '활성' : '대기'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-500">가상머신 정보가 없습니다</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
