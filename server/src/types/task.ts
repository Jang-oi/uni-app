export interface TaskData {
    team: TaskDisplayData[]
    members: Record<string, TaskDisplayData[]>
    lastUpdated: string | null
}

/**
 * 화면 표시용 업무 데이터 (필요한 필드만)
 */
export interface TaskDisplayData {
    SR_IDX: string
    REQ_TITLE: string
    CM_NAME: string
    REQ_DATE: string
    PROCESS_DATE: string
    WRITER: string
    STATUS: string
    REQ_DATE_ALL: string
    STATUS_CODE: string
}
