export interface VacationRawData {
  useId: string
  usName: string
  useSdate: string
  useEdate: string
  timeUnitName: string
  useTimeTypeName?: string
  useSTimeHour?: string | null
  useSTimeMin?: string | null
  aprvDocStsName: string
}

export interface ProcessedEvent {
  id: string
  name: string
  startDate: string
  endDate: string
  isMultiDay: boolean
  startTimeWeight: number // 정렬용: HH * 60 + MM
  displayLabel: string
  type: string
}
