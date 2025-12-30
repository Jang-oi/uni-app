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
  start: string
  end: string
  title: string
  allDay: boolean
  name: string
}
