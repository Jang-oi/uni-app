import { useState } from 'react'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

export function VersionPage() {
  const [isChecking, setIsChecking] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(true)

  const currentVersion = '1.2.3'
  const latestVersion = '1.3.0'

  const changelogs = [
    {
      version: '1.3.0',
      date: '2024-01-20',
      type: 'major',
      changes: ['새로운 대시보드 위젯 추가', '가상머신 관리 UI 개선', '크롤러 성능 최적화 (30% 향상)', '다크모드 지원 추가']
    },
    {
      version: '1.2.3',
      date: '2024-01-15',
      type: 'patch',
      changes: ['업무 테이블 필터링 버그 수정', '일정 페이지 로딩 속도 개선', '보안 패치 적용']
    },
    {
      version: '1.2.2',
      date: '2024-01-10',
      type: 'patch',
      changes: ['가상머신 상태 표시 오류 수정', '관리자 메뉴 권한 체크 강화']
    },
    {
      version: '1.2.0',
      date: '2024-01-05',
      type: 'minor',
      changes: ['업무 사이트 크롤러 추가', '휴가 사이트 크롤러 추가', '관리자 메뉴 신규 추가', '자동 크롤링 스케줄러 구현']
    },
    {
      version: '1.1.5',
      date: '2023-12-28',
      type: 'patch',
      changes: ['데이터 테이블 정렬 기능 개선', '메모리 누수 문제 해결']
    },
    {
      version: '1.1.0',
      date: '2023-12-20',
      type: 'minor',
      changes: ['가상머신 페이지 추가', '업무 관리 기능 강화', '알림 시스템 구현']
    },
    {
      version: '1.0.5',
      date: '2023-12-15',
      type: 'patch',
      changes: ['UI 반응성 개선', '일정 동기화 버그 수정']
    },
    {
      version: '1.0.0',
      date: '2023-12-01',
      type: 'major',
      changes: ['구독4팀 대시보드 시스템 최초 릴리즈', '기본 대시보드 기능', '일정 관리 기능', '설정 페이지']
    }
  ]

  const handleCheckUpdate = () => {
    setIsChecking(true)
    // TODO: 실제 버전 확인 로직
    setTimeout(() => {
      setIsChecking(false)
      setUpdateAvailable(true)
    }, 1500)
  }

  const handleUpdate = () => {
    setIsUpdating(true)
    // TODO: 실제 업데이트 로직
    setTimeout(() => {
      setIsUpdating(false)
      setUpdateAvailable(false)
    }, 3000)
  }

  const getVersionBadgeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'minor':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'patch':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getVersionLabel = (type: string) => {
    switch (type) {
      case 'major':
        return 'Major'
      case 'minor':
        return 'Minor'
      case 'patch':
        return 'Patch'
      default:
        return 'Release'
    }
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
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">버전 관리</h1>
        <p className="text-slate-600">애플리케이션 버전 및 업데이트를 관리합니다</p>
      </div>
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Current Version Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-blue-600"
                  >
                    <path d="M12 2v20M2 12h20" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-base">현재 버전</CardTitle>
                  <CardDescription className="text-xs">설치된 버전</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{currentVersion}</div>
              <Badge variant="secondary" className="mt-2">
                안정화 버전
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* Latest Version Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-green-600"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-base">최신 버전</CardTitle>
                  <CardDescription className="text-xs">사용 가능한 버전</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{latestVersion}</div>
              {updateAvailable && (
                <Badge variant="default" className="mt-2 bg-green-600">
                  업데이트 가능
                </Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-purple-600"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    <polyline points="21 12 12 12 15 9" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-base">업데이트 관리</CardTitle>
                  <CardDescription className="text-xs">버전 확인 및 업데이트</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleCheckUpdate} disabled={isChecking} variant="outline" className="w-full bg-transparent">
                {isChecking ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 mr-2 animate-spin"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    확인 중...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 mr-2"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    업데이트 확인
                  </>
                )}
              </Button>
              <Button onClick={handleUpdate} disabled={!updateAvailable || isUpdating} className="w-full bg-purple-600 hover:bg-purple-700">
                {isUpdating ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 mr-2 animate-spin"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    업데이트 중...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 mr-2"
                    >
                      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    버전 업데이트
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Changelog Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-slate-600"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="18" x2="13" y2="18" />
                </svg>
              </div>
              <div>
                <CardTitle>변경 로그</CardTitle>
                <CardDescription>모든 버전의 변경 사항을 확인하세요</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(46vh-50px)]">
              <div className="space-y-6">
                {changelogs.map((log, index) => (
                  <motion.div
                    key={log.version}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="relative pl-8 pb-6 border-l-2 border-slate-200 last:border-l-0 last:pb-0"
                  >
                    {/* Content */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">v{log.version}</h3>
                        <Badge className={`text-xs ${getVersionBadgeColor(log.type)}`}>{getVersionLabel(log.type)}</Badge>
                        <span className="text-sm text-slate-500">{log.date}</span>
                      </div>

                      <ul className="space-y-2">
                        {log.changes.map((change, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0"
                            >
                              <polyline points="9 11 12 14 22 4" />
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
