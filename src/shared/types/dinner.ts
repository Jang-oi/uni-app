// 회식 후보 날짜
export interface DinnerCandidate {
  date: string // YYYY-MM-DD
  dayOfWeek: string // 월, 화, 수, 목, 금
  holidayName?: string
  availableVotes: string[] // 되는 날짜로 선택한 팀원 hostname 목록
  unavailableVotes: string[] // 안되는 날짜로 선택한 팀원 hostname 목록
}

// 회식 일정 (월별)
export interface DinnerSchedule {
  id: string // YYYYMM 형식
  month: string // YYYY-MM
  status: 'voting' | 'confirmed' | 'completed' | 'archived'
  candidates: DinnerCandidate[] // 후보 날짜 목록 (전체)
  confirmedDate: string | null // 확정된 날짜
  createdAt: string // ISO 8601 형식
  votingDeadline: string // 투표 마감일 (ISO 8601)
  totalMembers: number // 전체 팀원 수
  votedMembers: string[] // 투표 완료한 팀원 hostname 목록
  availableCandidateCount: number // 총 투표 가능한 일자 수
}
