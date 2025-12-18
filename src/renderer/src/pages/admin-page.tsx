import { useState } from 'react'
import {
  ActivityIcon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  GlobeIcon,
  Key01Icon,
  PlayCircleIcon,
  StopCircleIcon,
  ViewIcon,
  ViewOffIcon
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminPage() {
  const [workSiteId, setWorkSiteId] = useState('')
  const [workSitePassword, setWorkSitePassword] = useState('')
  const [vacationSiteId, setVacationSiteId] = useState('')
  const [vacationSitePassword, setVacationSitePassword] = useState('')
  const [showWorkPassword, setShowWorkPassword] = useState(false)
  const [showVacationPassword, setShowVacationPassword] = useState(false)

  const [crawlerStatus, setCrawlerStatus] = useState({
    work: { running: false, lastRun: '2024-01-15 14:30:25', status: 'success' },
    vacation: { running: false, lastRun: '2024-01-15 09:00:12', status: 'success' }
  })

  const handleStartWorkCrawler = async () => {
    setCrawlerStatus((prev) => ({
      ...prev,
      work: { ...prev.work, running: true }
    }))

    try {
      await window.api.runTaskCrawler()
      setCrawlerStatus((prev) => ({
        ...prev,
        work: { running: false, lastRun: new Date().toLocaleString('ko-KR'), status: 'success' }
      }))
    } catch (error) {
      console.error('[AdminPage] 업무 크롤러 실행 오류:', error)
      setCrawlerStatus((prev) => ({
        ...prev,
        work: { running: false, lastRun: new Date().toLocaleString('ko-KR'), status: 'error' }
      }))
    }
  }

  const handleStartVacationCrawler = async () => {
    setCrawlerStatus((prev) => ({
      ...prev,
      vacation: { ...prev.vacation, running: true }
    }))

    try {
      await window.api.runVacationCrawler()
      setCrawlerStatus((prev) => ({
        ...prev,
        vacation: { running: false, lastRun: new Date().toLocaleString('ko-KR'), status: 'success' }
      }))
    } catch (error) {
      console.error('[AdminPage] 휴가 크롤러 실행 오류:', error)
      setCrawlerStatus((prev) => ({
        ...prev,
        vacation: { running: false, lastRun: new Date().toLocaleString('ko-KR'), status: 'error' }
      }))
    }
  }

  const handleSaveCredentials = () => {
    // TODO: 자격 증명 저장 로직
    console.log('Saving credentials...')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8 space-y-6"
    >
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">관리자</h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Work Site Credentials */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <HugeiconsIcon icon={GlobeIcon} className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>업무 사이트</CardTitle>
                  <CardDescription>업무 조회 시스템 자격 증명</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="work-id">아이디</Label>
                <div className="relative">
                  <HugeiconsIcon icon={Key01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="work-id"
                    type="text"
                    value={workSiteId}
                    onChange={(e) => setWorkSiteId(e.target.value)}
                    placeholder="업무 사이트 아이디"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-password">패스워드</Label>
                <div className="relative">
                  <HugeiconsIcon icon={Key01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="work-password"
                    type={showWorkPassword ? 'text' : 'password'}
                    value={workSitePassword}
                    onChange={(e) => setWorkSitePassword(e.target.value)}
                    placeholder="업무 사이트 패스워드"
                    className="pl-10 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowWorkPassword(!showWorkPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  >
                    {showWorkPassword ? (
                      <HugeiconsIcon icon={ViewOffIcon} className="w-4 h-4" />
                    ) : (
                      <HugeiconsIcon icon={ViewIcon} className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveCredentials} className="w-full">
                저장
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vacation Site Credentials */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <HugeiconsIcon icon={GlobeIcon} className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>휴가 사이트</CardTitle>
                  <CardDescription>휴가 조회 시스템 자격 증명</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vacation-id">아이디</Label>
                <div className="relative">
                  <HugeiconsIcon icon={Key01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="vacation-id"
                    type="text"
                    value={vacationSiteId}
                    onChange={(e) => setVacationSiteId(e.target.value)}
                    placeholder="휴가 사이트 아이디"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vacation-password">패스워드</Label>
                <div className="relative">
                  <HugeiconsIcon icon={Key01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="vacation-password"
                    type={showVacationPassword ? 'text' : 'password'}
                    value={vacationSitePassword}
                    onChange={(e) => setVacationSitePassword(e.target.value)}
                    placeholder="휴가 사이트 패스워드"
                    className="pl-10 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowVacationPassword(!showVacationPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  >
                    {showVacationPassword ? (
                      <HugeiconsIcon icon={ViewOffIcon} className="w-4 h-4" />
                    ) : (
                      <HugeiconsIcon icon={ViewIcon} className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveCredentials} variant="default" className="w-full bg-green-600 hover:bg-green-700">
                저장
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Work Crawler Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <HugeiconsIcon icon={ActivityIcon} className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>업무 크롤러</CardTitle>
                    <CardDescription>실시간 업무 데이터 수집</CardDescription>
                  </div>
                </div>
                {crawlerStatus.work.running ? (
                  <Badge variant="default" className="bg-blue-600">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                    실행 중
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mr-2" />
                    대기 중
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <HugeiconsIcon icon={Clock01Icon} className="w-4 h-4" />
                  <span>마지막 실행</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{crawlerStatus.work.lastRun}</span>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {crawlerStatus.work.status === 'success' ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-green-600" />
                      <span>상태</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CancelCircleIcon} className="w-4 h-4 text-red-600" />
                      <span>상태</span>
                    </>
                  )}
                </div>
                <Badge
                  variant={crawlerStatus.work.status === 'success' ? 'default' : 'destructive'}
                  className={crawlerStatus.work.status === 'success' ? 'bg-green-600' : ''}
                >
                  {crawlerStatus.work.status === 'success' ? '성공' : '실패'}
                </Badge>
              </div>

              <Button
                onClick={handleStartWorkCrawler}
                disabled={crawlerStatus.work.running}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {crawlerStatus.work.running ? (
                  <>
                    <HugeiconsIcon icon={StopCircleIcon} className="w-4 h-4 mr-2" />
                    실행 중...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={PlayCircleIcon} className="w-4 h-4 mr-2" />
                    수동 실행
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vacation Crawler Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <HugeiconsIcon icon={ActivityIcon} className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>휴가 크롤러</CardTitle>
                    <CardDescription>일정 휴가 데이터 수집</CardDescription>
                  </div>
                </div>
                {crawlerStatus.vacation.running ? (
                  <Badge variant="default" className="bg-blue-600">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                    실행 중
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mr-2" />
                    대기 중
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <HugeiconsIcon icon={Clock01Icon} className="w-4 h-4" />
                  <span>마지막 실행</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{crawlerStatus.vacation.lastRun}</span>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {crawlerStatus.vacation.status === 'success' ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-green-600" />
                      <span>상태</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CancelCircleIcon} className="w-4 h-4 text-red-600" />
                      <span>상태</span>
                    </>
                  )}
                </div>
                <Badge
                  variant={crawlerStatus.vacation.status === 'success' ? 'default' : 'destructive'}
                  className={crawlerStatus.vacation.status === 'success' ? 'bg-green-600' : ''}
                >
                  {crawlerStatus.vacation.status === 'success' ? '성공' : '실패'}
                </Badge>
              </div>

              <Button
                onClick={handleStartVacationCrawler}
                disabled={crawlerStatus.vacation.running}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {crawlerStatus.vacation.running ? (
                  <>
                    <HugeiconsIcon icon={StopCircleIcon} className="w-4 h-4 mr-2" />
                    실행 중...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={PlayCircleIcon} className="w-4 h-4 mr-2" />
                    수동 실행
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
