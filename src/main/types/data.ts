/**
 * 데이터 타입 정의
 * (이전 Supabase types.ts 대체)
 */

/**
 * 휴가 원본 데이터 (크롤링 결과)
 */
export interface VacationRawData {
  useId: string
  belongYear: string
  usId: string
  empNo: string
  usName: string
  deptName: string
  itemId: string
  itemName: string
  itemType: string
  useSdate: string
  useEdate: string
  useStime?: string | null
  useEtime?: string | null
  useMin?: string | null
  useDayCnt: string
  useTimeType?: string | null
  useTimeTypeName?: string | null
  timeUnit?: string | null
  aprvDocSts: string
  procSts: string
  aprvTitle?: string | null
  lastAprvUsName?: string | null
  lastAprvDate?: string | null
  useDesc?: string | null
}

/**
 * 업무 원본 데이터 (크롤링 결과)
 */
export interface TaskRawData {
  taskId: string
  usId: string
  usName: string
  deptName: string
  title: string
  status: string
  priority?: string | null
  dueDate?: string | null
}
