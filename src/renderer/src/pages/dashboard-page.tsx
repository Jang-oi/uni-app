import { useMemo } from 'react'
import { Calendar03Icon, Task01Icon, UserIcon, VirtualRealityVr01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
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
      // 오늘 날짜가 startDate와 endDate 사이에 있는지 확인
      return event.startDate <= today && today <= event.endDate
    })
  }, [eventsByDate, today])

  // 미처리/고객사답변 업무 (status가 'a' 또는 'b')
  const filteredTasks = useMemo(() => {
    return teamTasks.filter((task) => task.STATUS_CODE === 'a' || task.STATUS_CODE === 'b')
  }, [teamTasks])

  // HyperV 사용 현황 (최대 5개)
  const topVms = vms.slice(0, 5)

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* 페이지 헤더 - 미니멀 디자인 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">대시보드</h1>
        <p className="text-sm text-slate-500">구독4팀 주요 정보</p>
      </div>

      {/* 요약 카드 - 깔끔한 화이트 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">오늘의 휴가자</p>
                <p className="text-3xl font-semibold text-slate-900">{todayVacations.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <HugeiconsIcon icon={Calendar03Icon} className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">확인 필요 업무</p>
                <p className="text-3xl font-semibold text-slate-900">{filteredTasks.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <HugeiconsIcon icon={Task01Icon} className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">가상머신 활성</p>
                <p className="text-3xl font-semibold text-slate-900">{vms.filter((vm) => vm.isConnected).length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <HugeiconsIcon icon={VirtualRealityVr01Icon} className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 대시보드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘의 휴가자 */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <HugeiconsIcon icon={Calendar03Icon} className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">오늘의 휴가자</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {today} • {todayVacations.length}명
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-[240px] pr-4">
              {todayVacations.length > 0 ? (
                <div className="space-y-3">
                  {todayVacations.map((vacation) => (
                    <div
                      key={vacation.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                          <HugeiconsIcon icon={UserIcon} className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{vacation.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{vacation.type}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {vacation.displayLabel}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <p className="text-sm text-slate-500">오늘 휴가자가 없습니다</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 확인 필요 업무 */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <HugeiconsIcon icon={Task01Icon} className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">확인 필요 업무</CardTitle>
                <CardDescription className="text-xs text-slate-500">미처리/고객사답변 • {filteredTasks.length}건</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-[240px]">
              {filteredTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-xs font-medium text-slate-500">고객사</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">상태</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">요청일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.SR_IDX} className="border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <TableCell className="text-sm font-medium text-slate-900">{task.CM_NAME}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              'text-xs font-normal',
                              task.STATUS_CODE === 'a'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                                : task.STATUS_CODE === 'b'
                                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                            )}
                          >
                            {task.STATUS}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{task.REQ_DATE}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <p className="text-sm text-slate-500">확인이 필요한 업무가 없습니다</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* HyperV 사용 현황 */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <HugeiconsIcon icon={VirtualRealityVr01Icon} className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">HyperV 사용 현황</CardTitle>
                <CardDescription className="text-xs text-slate-500">실시간 가상머신 상태</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {topVms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {topVms.map((vm) => (
                  <div
                    key={vm.vmName}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      vm.isConnected
                        ? 'border-green-200 bg-green-50 hover:border-green-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-slate-900 leading-tight">{vm.vmName}</p>
                        <div className={cn('w-2 h-2 rounded-full', vm.isConnected ? 'bg-green-500' : 'bg-slate-300')} />
                      </div>

                      {vm.currentUser ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <HugeiconsIcon icon={UserIcon} className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <span className="text-xs font-medium text-slate-700 truncate">{vm.currentUser}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">대기 중</div>
                      )}

                      <Badge
                        variant={vm.isConnected ? 'default' : 'secondary'}
                        className={cn(
                          'w-full justify-center text-xs font-normal',
                          vm.isConnected ? 'bg-green-600' : 'bg-slate-200 text-slate-600'
                        )}
                      >
                        {vm.isConnected ? '활성' : '대기'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-slate-500">가상머신 정보가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
