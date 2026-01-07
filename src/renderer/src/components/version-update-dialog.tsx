import { useEffect, useState } from 'react'
import { ArrowDown01Icon, ArrowRight01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useVersionStore } from '../stores/version'

const SKIP_VERSION_KEY = 'skip-update-version'

interface VersionUpdateDialogProps {
  setActiveTab: (tab: string) => void
}

export function VersionUpdateDialog({ setActiveTab }: VersionUpdateDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [skipThisVersion, setSkipThisVersion] = useState(false)

  const updateAvailable = useVersionStore((state) => state.updateAvailable)
  const currentVersion = useVersionStore((state) => state.currentVersion)
  const availableVersion = useVersionStore((state) => state.availableVersion)
  const history = useVersionStore((state) => state.history)

  // 업데이트 다이얼로그 표시 여부 결정
  useEffect(() => {
    if (!updateAvailable || !availableVersion) {
      setIsOpen(false)
      return
    }

    // 로컬스토리지에서 스킵한 버전 확인
    const skippedVersion = localStorage.getItem(SKIP_VERSION_KEY)
    if (skippedVersion === availableVersion) {
      setIsOpen(false)
      return
    }

    setIsOpen(true)
  }, [updateAvailable, availableVersion])

  // "나중에" 버튼 핸들러
  const handleLater = () => {
    if (skipThisVersion) localStorage.setItem(SKIP_VERSION_KEY, availableVersion)
    setIsOpen(false)
  }

  const handleGoToVersionPage = () => {
    setIsOpen(false)
    setActiveTab('버전관리')
  }

  // 최신 릴리즈 정보 (최대 3개)
  const latestReleases = history.slice(0, 3)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <HugeiconsIcon icon={ArrowDown01Icon} size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">새로운 버전이 있습니다!</DialogTitle>
              <DialogDescription className="text-sm mt-1">업데이트를 권장합니다</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 버전 비교 */}
        <div className="py-4 space-y-3">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <span className="text-xs text-slate-500 block mb-1">현재 버전</span>
                <span className="text-lg font-bold text-slate-700">v{currentVersion}</span>
              </div>
              <HugeiconsIcon icon={ArrowRight01Icon} className="text-slate-400 mx-2" size={20} />
              <div className="flex-1 text-right">
                <span className="text-xs text-slate-500 block mb-1">최신 버전</span>
                <span className="text-lg font-bold text-primary">v{availableVersion}</span>
              </div>
            </div>
          </div>

          {/* 주요 변경사항 */}
          {latestReleases.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-primary">📝</span>
                주요 변경사항
              </h4>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-3">
                  {latestReleases.map((release, index) => (
                    <motion.div
                      key={release.version}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-l-2 border-primary/30 pl-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary">v{release.version}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{release.date}</span>
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        {release.changes.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {release.changes.slice(0, 3).map((change, idx) => (
                              <li key={idx} className="line-clamp-1">
                                {change}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>업데이트 내역이 없습니다.</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* 추가 안내 메시지 */}
          <p className="text-xs text-slate-500 text-center px-4">
            새로운 기능과 개선 사항이 포함되어 있습니다. 더 나은 경험을 위해 업데이트해주세요.
          </p>
        </div>

        {/* 다시 보지 않기 옵션 */}
        <div className="flex items-center gap-2 px-1">
          <Checkbox id="skip-version" checked={skipThisVersion} onCheckedChange={(checked) => setSkipThisVersion(checked === true)} />
          <label htmlFor="skip-version" className="text-xs text-slate-600 cursor-pointer select-none">
            이 버전에서 다시 보지 않기
          </label>
        </div>

        {/* 액션 버튼 */}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleLater} className="flex-1 gap-2">
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
            나중에
          </Button>
          <Button onClick={handleGoToVersionPage} className="flex-1 gap-2">
            버전관리 페이지로 이동
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
