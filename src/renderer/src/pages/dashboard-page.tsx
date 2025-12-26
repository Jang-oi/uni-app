import { useMemo } from 'react'
import { Calendar03Icon, Task01Icon, UserIcon, VirtualRealityVr01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useHypervStore } from '@/stores/hyperv'
import { useTaskStore } from '@/stores/task'
import { useVacationStore } from '@/stores/vacation'

export function DashboardPage() {
  // 스토어에서 데이터만 가져오기 (Socket은 App.tsx에서 이미 초기화됨)
  const vacationsByDate = useVacationStore((state) => state.vacationsByDate)
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

  // 오늘의 휴가자
  const todayVacations = vacationsByDate[today] || []

  // 미처리/고객사답변 업무 (status가 'a' 또는 'b')
  const filteredTasks = useMemo(() => {
    return teamTasks.filter((task) => task.STATUS_CODE === 'a' || task.STATUS_CODE === 'b')
  }, [teamTasks])

  // HyperV 사용 현황 (최대 5개)
  const topVms = vms.slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8 space-y-6"
    >
      {/* 페이지 헤더 - 개선된 디자인 */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl opacity-50" />
        <div className="relative p-6 rounded-2xl border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                👋 안녕하세요, <span className="text-blue-600">구독4팀</span>
              </h1>
              <p className="text-slate-600">오늘도 화이팅! 주요 정보를 한눈에 확인하세요.</p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-6xl"
            >
              🎯
            </motion.div>
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">오늘의 휴가자</p>
              <p className="text-3xl font-bold mt-2">{todayVacations.length}명</p>
            </div>
            <HugeiconsIcon icon={Calendar03Icon} className="w-12 h-12 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">확인 필요 업무</p>
              <p className="text-3xl font-bold mt-2">{filteredTasks.length}건</p>
            </div>
            <HugeiconsIcon icon={Task01Icon} className="w-12 h-12 text-orange-200" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">가상머신 활성</p>
              <p className="text-3xl font-bold mt-2">{vms.filter((vm) => vm.isConnected).length}대</p>
            </div>
            <HugeiconsIcon icon={VirtualRealityVr01Icon} className="w-12 h-12 text-purple-200" />
          </div>
        </motion.div>
      </div>

      {/* 대시보드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘의 휴가자 - 개선된 디자인 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-lg border-blue-100 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <HugeiconsIcon icon={Calendar03Icon} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">오늘의 휴가자</CardTitle>
                  <CardDescription className="text-blue-700">
                    {today} • {todayVacations.length}명
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-[200px]">
                {todayVacations.length > 0 ? (
                  <div className="space-y-2">
                    {todayVacations.map((vacation, index) => (
                      <motion.div
                        key={vacation.useId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <HugeiconsIcon icon={UserIcon} className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{vacation.usName}</p>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {vacation.itemName}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {vacation.useTimeTypeName ||
                            (vacation.useStime && vacation.useEtime ? `${vacation.useStime}~${vacation.useEtime}` : '종일')}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="text-sm font-medium text-slate-600">오늘 휴가자가 없습니다.</p>
                    <p className="text-xs text-slate-400 mt-1">모두 출근했어요!</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* 미처리/고객사답변 업무 - 개선된 디자인 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-lg border-orange-100 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <HugeiconsIcon icon={Task01Icon} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-orange-900">확인 필요 업무</CardTitle>
                  <CardDescription className="text-orange-700">미처리/고객사답변 • {filteredTasks.length}건</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-[200px]">
                {filteredTasks.length > 0 ? (
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="text-xs font-semibold">고객사</TableHead>
                        <TableHead className="text-xs font-semibold">상태</TableHead>
                        <TableHead className="text-xs font-semibold">요청일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task, index) => (
                        <motion.tr
                          key={task.SR_IDX}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-orange-50 cursor-pointer transition-colors"
                        >
                          <TableCell className="font-medium text-xs">{task.CM_NAME}</TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                'text-xs',
                                task.STATUS_CODE === 'a'
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : task.STATUS_CODE === 'b'
                                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                    : 'bg-slate-100 text-slate-800'
                              )}
                            >
                              {task.STATUS}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">{task.REQ_DATE}</TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-sm font-medium text-slate-600">확인이 필요한 업무가 없습니다.</p>
                    <p className="text-xs text-slate-400 mt-1">모든 업무가 처리되었어요!</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* HyperV 사용 현황 - 개선된 디자인 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card className="shadow-lg border-purple-100 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <HugeiconsIcon icon={VirtualRealityVr01Icon} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-purple-900">HyperV 사용 현황</CardTitle>
                  <CardDescription className="text-purple-700">실시간 가상머신 상태 • 상위 5개</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {topVms.length > 0 ? (
                  topVms.map((vm, index) => (
                    <motion.div
                      key={vm.vmName}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden',
                        vm.isConnected
                          ? 'border-green-300 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg'
                          : 'border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-md'
                      )}
                    >
                      {/* 활성 상태 펄스 효과 */}
                      {vm.isConnected && (
                        <motion.div
                          className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <p className="font-bold text-sm text-slate-900 pr-4">{vm.vmName}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {vm.currentUser ? (
                            <>
                              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                                <HugeiconsIcon icon={UserIcon} className="w-4 h-4 text-purple-700" />
                              </div>
                              <span className="text-xs font-semibold text-slate-900">{vm.currentUser}</span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">대기 중...</span>
                          )}
                        </div>

                        <Badge
                          className={cn(
                            'w-full justify-center text-xs font-medium',
                            vm.isConnected ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
                          )}
                        >
                          {vm.isConnected ? '🟢 활성' : '⚪ 대기'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-4">💻</div>
                    <p className="text-sm font-medium text-slate-600">가상머신 정보가 없습니다.</p>
                    <p className="text-xs text-slate-400 mt-1">서버와 연결을 확인해주세요.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
