import { useState } from 'react'
import { Calendar03Icon, Cancel01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { DinnerCandidate } from '@shared/types/dinner'
import { PageHeader } from '@/components/page-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useDinnerStore } from '@/stores/dinner'
import { useUserStore } from '@/stores/user'

export function DinnerSchedulePage() {
  const { currentSchedule, MyAvailableDates, myUnavailableVotes, vote, confirmDate } = useDinnerStore()
  const userHostName = useUserStore((state) => state.userHostName)
  const [isConfirming, setIsConfirming] = useState(false)
  const [dateToConfirm, setDateToConfirm] = useState<string | null>(null)

  if (!currentSchedule) {
    return (
      <div className="p-8 h-full flex flex-col bg-white">
        <PageHeader
          title="회식 일정 투표"
          description="진행 중인 투표가 없습니다."
          icon={<HugeiconsIcon icon={Calendar03Icon} size={20} />}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm">현재 진행 중인 회식 일정 투표가 없습니다.</p>
        </div>
      </div>
    )
  }

  const votingProgress = (currentSchedule.votedMembers.length / currentSchedule.totalMembers) * 100
  const isVotingClosed = currentSchedule.status === 'confirmed'
  const canConfirm = userHostName === 'pc-lovestar1124'

  const handleToggleDate = async (date: string, type: 'available' | 'unavailable') => {
    if (isVotingClosed) return
    // 현재 스토어에 저장된 최신 값을 가져옵니다.
    let nextAvailable = [...MyAvailableDates]
    let nextUnavailable = [...myUnavailableVotes]

    if (type === 'available') {
      if (nextAvailable.includes(date)) {
        nextAvailable = nextAvailable.filter((d) => d !== date)
      } else {
        nextAvailable = [...nextAvailable, date]
        nextUnavailable = nextUnavailable.filter((d) => d !== date)
      }
    } else {
      if (nextUnavailable.includes(date)) {
        nextUnavailable = nextUnavailable.filter((d) => d !== date)
      } else {
        nextUnavailable = [...nextUnavailable, date]
        nextAvailable = nextAvailable.filter((d) => d !== date)
      }
    }

    await vote(userHostName, nextAvailable, nextUnavailable)
  }

  // 실제 확정 요청 함수
  const handleConfirm = async () => {
    if (!dateToConfirm) return
    setIsConfirming(true)
    try {
      await confirmDate(userHostName, dateToConfirm)
    } finally {
      setIsConfirming(false)
      setDateToConfirm(null) // 처리 후 초기화
    }
  }

  return (
    <div className="p-8 h-full flex flex-col bg-white">
      <PageHeader
        title="회식 일정 투표"
        description={`${currentSchedule.month} 회식 일정 투표`}
        icon={<HugeiconsIcon icon={Calendar03Icon} size={20} />}
        action={
          currentSchedule.status === 'confirmed' ? (
            <Badge className="bg-green-500 text-white">확정: {currentSchedule.confirmedDate}</Badge>
          ) : (
            <Badge variant="outline">투표 마감: {new Date(currentSchedule.votingDeadline).toLocaleDateString()}</Badge>
          )
        }
      />

      <div className="flex-1 grid grid-cols-3 gap-5 min-h-0">
        <div className="col-span-2">
          <Card className="h-full border-slate-200 shadow-none overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">후보 날짜</span>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="h-5 text-[10px]">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="mr-1" />
                  가능
                </Badge>
                <Badge variant="destructive" className="h-5 text-[10px]">
                  <HugeiconsIcon icon={Cancel01Icon} size={12} className="mr-1" />
                  불가
                </Badge>
              </div>
            </div>
            <ScrollArea className="h-[calc(65vh)]">
              <div className="p-4 space-y-3">
                {currentSchedule.candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.date}
                    candidate={candidate}
                    isAvailable={MyAvailableDates.includes(candidate.date)}
                    isUnavailable={myUnavailableVotes.includes(candidate.date)}
                    onToggleAvailable={() => handleToggleDate(candidate.date, 'available')}
                    onToggleUnavailable={() => handleToggleDate(candidate.date, 'unavailable')}
                    isVotingClosed={isVotingClosed}
                    isConfirmed={currentSchedule.confirmedDate === candidate.date}
                    canConfirm={canConfirm && currentSchedule.status !== 'confirmed'}
                    onConfirm={() => setDateToConfirm(candidate.date)}
                    isConfirming={isConfirming}
                  />
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        <div className="col-span-1">
          {/* 투표 현황 UI (변동 없음) */}
          <Card className="h-full border-slate-200 shadow-none flex flex-col">
            <div className="px-5 py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">투표 현황</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span>투표율</span>
                  <span className="font-bold">{votingProgress.toFixed(0)}%</span>
                </div>
                <Progress value={votingProgress} />
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <p>
                  {currentSchedule.votedMembers.length} / {currentSchedule.totalMembers}명 투표 완료
                </p>
                <p>전체 후보: {currentSchedule.availableCandidateCount}개</p>
                {currentSchedule.status === 'voting' && <p className="text-orange-600">투표 진행 중</p>}
                {currentSchedule.status === 'confirmed' && (
                  <p className="text-green-600 font-bold">일정 확정: {currentSchedule.confirmedDate}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 일정 확정 확인 다이얼로그 */}
      <AlertDialog open={!!dateToConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회식 일정 확정</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-bold text-slate-900">{dateToConfirm}</span> 날짜로 회식 일정을 최종 확정하시겠습니까?
              <br /> 확정 후에는 투표를 수정할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDateToConfirm(null)
              }}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>확정하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// CandidateCard 컴포넌트는 기존과 거의 동일하나 가독성을 위해 생략하지 않고 유지합니다.
function CandidateCard({
  candidate,
  isAvailable,
  isUnavailable,
  onToggleAvailable,
  onToggleUnavailable,
  isVotingClosed,
  isConfirmed,
  canConfirm,
  onConfirm,
  isConfirming
}: {
  candidate: DinnerCandidate
  isAvailable: boolean
  isUnavailable: boolean
  onToggleAvailable: () => void
  onToggleUnavailable: () => void
  isVotingClosed: boolean
  isConfirmed: boolean
  canConfirm: boolean
  onConfirm: () => void
  isConfirming: boolean
}) {
  const isHoliday = !!candidate.holidayName

  return (
    <div
      className={cn(
        'p-4 border-2 transition-all relative overflow-hidden',
        isConfirmed
          ? 'border-green-500 bg-green-50'
          : isHoliday || isUnavailable
            ? 'border-red-500 bg-red-50'
            : isAvailable
              ? 'border-primary bg-primary/5'
              : 'border-slate-200'
      )}
    >
      {isHoliday && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
          <div className="flex flex-col items-center p-4 text-center">
            <span className="text-sm font-black text-red-600 mb-1">{candidate.holidayName}</span>
            <p className="text-[11px] font-bold text-slate-600 leading-tight">공휴일은 회식 투표가 불가능합니다.</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('text-base font-bold')}>
              {candidate.date} ({candidate.dayOfWeek})
            </span>
            {isConfirmed && <Badge className="bg-green-500 text-white text-[10px]">확정</Badge>}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-primary font-medium">가능: {candidate.availableVotes.length}명</span>
            <span>/</span>
            <span className="text-destructive font-medium">불가능: {candidate.unavailableVotes.length}명</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {!isVotingClosed && !isConfirmed && (
            <div className="flex gap-2">
              <Button size="sm" variant={isAvailable ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={onToggleAvailable}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="mr-1" />
                가능
              </Button>
              <Button
                size="sm"
                variant={isUnavailable ? 'destructive' : 'outline'}
                className="h-7 text-[11px]"
                onClick={onToggleUnavailable}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} className="mr-1" />
                불가
              </Button>
            </div>
          )}

          {(isVotingClosed || isConfirmed) && isUnavailable && (
            <Badge variant="destructive" className="text-[10px] justify-center">
              <HugeiconsIcon icon={Cancel01Icon} size={12} className="mr-1" />내 불가 투표
            </Badge>
          )}

          {canConfirm && !isConfirmed && (
            <Button size="sm" variant="default" className="h-7 text-[11px] bg-green-600" onClick={onConfirm} disabled={isConfirming}>
              {isConfirming ? '처리 중...' : '확정'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
