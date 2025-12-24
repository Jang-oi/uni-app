import { useEffect, useState } from 'react'
import {
  ActivityIcon,
  Clock01Icon,
  GlobeIcon,
  Key01Icon,
  LockPasswordIcon,
  PlayCircleIcon,
  StopCircleIcon,
  UserMultiple02Icon,
  ViewIcon,
  ViewOffIcon
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminPage() {
  // ==================== 인증 상태 ====================
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  const [taskSiteUrl, setTaskSiteUrl] = useState('')
  const [taskSiteId, setTaskSiteId] = useState('')
  const [taskSitePassword, setTaskSitePassword] = useState('')
  const [teamMembers, setTeamMembers] = useState('')
  const [showTaskPassword, setShowTaskPassword] = useState(false)

  // ==================== 크롤러 상태 ====================
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false)
  const [isSavingCredentials, setIsSavingCredentials] = useState(false)
  const [isManualRunning, setIsManualRunning] = useState({
    vacation: false,
    task: false
  })

  // ==================== 초기 데이터 로드 ====================
  useEffect(() => {
    if (isAuthenticated) {
      loadStoredCredentials()
      checkCrawlerStatus()
    }
  }, [isAuthenticated])

  // ==================== 관리자 인증 ====================
  const handleAdminLogin = async () => {
    setAuthError('')

    try {
      const result = await window.api.verifyAdminPassword(adminPassword)

      if (result.success) {
        setIsAuthenticated(true)
        setAdminPassword('')
      } else {
        setAuthError('비밀번호가 올바르지 않습니다')
      }
    } catch (error) {
      console.error('[AdminPage] 인증 오류:', error)
      setAuthError('인증 중 오류가 발생했습니다')
    }
  }

  // ==================== 자격증명 로드 ====================
  const loadStoredCredentials = async () => {
    try {
      const result = await window.api.loadCredentials()

      if (result.success && result.data) {
        const { taskSite, teamMembers: members } = result.data

        setTaskSiteUrl(taskSite.url || '')
        setTaskSiteId(taskSite.id || '')
        setTaskSitePassword(taskSite.password || '')
        setTeamMembers(members?.join(', ') || '')
      }
    } catch (error) {
      console.error('[AdminPage] 자격증명 로드 오류:', error)
    }
  }

  // ==================== 자격증명 저장 ====================
  const handleSaveCredentials = async () => {
    setIsSavingCredentials(true)

    try {
      const credentials = {
        taskSite: {
          url: taskSiteUrl,
          id: taskSiteId,
          password: taskSitePassword
        },
        teamMembers: teamMembers
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
      }

      const result = await window.api.saveCredentials(credentials)

      if (result.success) {
        toast.success('자격증명이 저장되었습니다')
      }
    } catch (error) {
      console.error('[AdminPage] 자격증명 저장 오류:', error)
      toast.error('자격증명 저장 중 오류가 발생했습니다')
    } finally {
      setIsSavingCredentials(false)
    }
  }

  // ==================== 크롤러 상태 확인 ====================
  const checkCrawlerStatus = async () => {
    try {
      const result = await window.api.getCrawlerStatus()

      if (result.success) {
        setIsSchedulerRunning(result.isRunning)
      }
    } catch (error) {
      console.error('[AdminPage] 크롤러 상태 확인 오류:', error)
    }
  }

  // ==================== 스케줄러 시작 ====================
  const handleStartScheduler = async () => {
    try {
      const result = await window.api.startCrawlerScheduler()

      if (result.success) {
        setIsSchedulerRunning(true)
        toast.success('크롤러 스케줄러가 시작되었습니다')
      } else {
        toast.error(result.message || '스케줄러 시작에 실패했습니다')
      }
    } catch (error) {
      console.error('[AdminPage] 스케줄러 시작 오류:', error)
      toast.error('스케줄러 시작 중 오류가 발생했습니다')
    }
  }

  // ==================== 스케줄러 정지 ====================
  const handleStopScheduler = async () => {
    try {
      const result = await window.api.stopCrawlerScheduler()

      if (result.success) {
        setIsSchedulerRunning(false)
        toast.success('크롤러 스케줄러가 정지되었습니다')
      } else {
        toast.error(result.message || '스케줄러 정지에 실패했습니다')
      }
    } catch (error) {
      console.error('[AdminPage] 스케줄러 정지 오류:', error)
      toast.error('스케줄러 정지 중 오류가 발생했습니다')
    }
  }

  // ==================== 업무 크롤러 수동 실행 ====================
  const handleRunTaskCrawler = async () => {
    setIsManualRunning((prev) => ({ ...prev, task: true }))

    try {
      const result = await window.api.runTaskCrawler()

      if (result.success) {
        toast.success('업무 크롤러가 실행되었습니다')
      } else {
        toast.error(result.message || '업무 크롤러 실행에 실패했습니다')
      }
    } catch (error) {
      console.error('[AdminPage] 업무 크롤러 실행 오류:', error)
      toast.error('업무 크롤러 실행 중 오류가 발생했습니다')
    } finally {
      setIsManualRunning((prev) => ({ ...prev, task: false }))
    }
  }

  // ==================== 인증되지 않은 경우: 비밀번호 입력 화면 ====================
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center mt-20"
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <HugeiconsIcon icon={LockPasswordIcon} className="w-8 h-8 text-slate-700" />
              </div>
              <div className="text-center">
                <CardTitle className="text-2xl">관리자 인증</CardTitle>
                <CardDescription>관리자 메뉴에 접근하려면 비밀번호를 입력하세요</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">관리자 비밀번호</Label>
              <div className="relative">
                <HugeiconsIcon icon={Key01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="admin-password"
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  placeholder="비밀번호 입력"
                  className="pl-10 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                >
                  {showAdminPassword ? (
                    <HugeiconsIcon icon={ViewOffIcon} className="w-4 h-4" />
                  ) : (
                    <HugeiconsIcon icon={ViewIcon} className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {authError && <p className="text-sm text-red-600">{authError}</p>}
            </div>

            <Button onClick={handleAdminLogin} className="w-full">
              로그인
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ==================== 인증된 경우: 관리자 메뉴 ====================
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
        <p className="text-slate-600">크롤러 자격증명 설정 및 스케줄러 제어</p>
      </div>

      {/* ==================== 자격증명 설정 섹션 ==================== */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">크롤링 자격증명</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* 업무 사이트 자격증명 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <HugeiconsIcon icon={GlobeIcon} className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>업무 사이트</CardTitle>
                    <CardDescription>업무 조회 시스템</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-url">사이트 URL</Label>
                  <Input
                    id="task-url"
                    type="text"
                    value={taskSiteUrl}
                    onChange={(e) => setTaskSiteUrl(e.target.value)}
                    placeholder="https://task.company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-id">아이디</Label>
                  <Input
                    id="task-id"
                    type="text"
                    value={taskSiteId}
                    onChange={(e) => setTaskSiteId(e.target.value)}
                    placeholder="사용자 아이디"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-password">패스워드</Label>
                  <div className="relative">
                    <Input
                      id="task-password"
                      type={showTaskPassword ? 'text' : 'password'}
                      value={taskSitePassword}
                      onChange={(e) => setTaskSitePassword(e.target.value)}
                      placeholder="패스워드"
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowTaskPassword(!showTaskPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    >
                      {showTaskPassword ? (
                        <HugeiconsIcon icon={ViewOffIcon} className="w-4 h-4" />
                      ) : (
                        <HugeiconsIcon icon={ViewIcon} className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 팀 멤버 입력 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <HugeiconsIcon icon={UserMultiple02Icon} className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>팀 멤버</CardTitle>
                  <CardDescription>업무 크롤링 대상 팀원 목록</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-members">팀원 이름 (쉼표로 구분)</Label>
                <Input
                  id="team-members"
                  type="text"
                  value={teamMembers}
                  onChange={(e) => setTeamMembers(e.target.value)}
                  placeholder="홍길동, 김철수, 이영희"
                />
                <p className="text-xs text-slate-500">예: 홍길동, 김철수, 이영희</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 저장 버튼 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button onClick={handleSaveCredentials} disabled={isSavingCredentials} className="w-full bg-slate-900 hover:bg-slate-800">
            {isSavingCredentials ? '저장 중...' : '자격증명 저장'}
          </Button>
        </motion.div>
      </div>

      {/* ==================== 스케줄러 제어 섹션 ==================== */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">크롤러 스케줄러</h2>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <HugeiconsIcon icon={Clock01Icon} className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle>정기 배치 스케줄러</CardTitle>
                    <CardDescription>휴가: 09:00, 12:00, 18:00 / 업무: 매 1분마다</CardDescription>
                  </div>
                </div>
                {isSchedulerRunning ? (
                  <Badge variant="default" className="bg-green-600">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                    실행 중 (Master)
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mr-2" />
                    정지됨
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isSchedulerRunning ? (
                <Button onClick={handleStopScheduler} variant="destructive" className="w-full">
                  <HugeiconsIcon icon={StopCircleIcon} className="w-4 h-4 mr-2" />
                  스케줄러 정지
                </Button>
              ) : (
                <Button onClick={handleStartScheduler} className="w-full bg-green-600 hover:bg-green-700">
                  <HugeiconsIcon icon={PlayCircleIcon} className="w-4 h-4 mr-2" />
                  스케줄러 시작
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ==================== 수동 실행 섹션 ==================== */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">수동 크롤러 실행</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* 업무 크롤러 수동 실행 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <HugeiconsIcon icon={ActivityIcon} className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>업무 크롤러</CardTitle>
                    <CardDescription>즉시 업무 데이터 수집</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRunTaskCrawler} disabled={isManualRunning.task} className="w-full bg-purple-600 hover:bg-purple-700">
                  {isManualRunning.task ? (
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
      </div>
    </motion.div>
  )
}
