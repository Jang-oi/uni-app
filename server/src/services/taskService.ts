import type {TaskDisplayData, TaskData} from "@/types/task";


/**
 * TaskRawData를 TaskDisplayData로 변환 (필요한 필드만 추출)
 */
const toDisplayData = (data: TaskDisplayData[]): TaskDisplayData[] => {
  return data.map(task => ({
    SR_IDX: task.SR_IDX,
    REQ_TITLE: task.REQ_TITLE,
    CM_NAME: task.CM_NAME,
    REQ_DATE: task.REQ_DATE,
    PROCESS_DATE: task.PROCESS_DATE,
    WRITER: task.WRITER,
    STATUS: task.STATUS,
    REQ_DATE_ALL: task.REQ_DATE_ALL,
    STATUS_CODE: task.STATUS_CODE
  }))
}

/**
 * 전체 업무 데이터 조회 (표시 형식)
 */
export const processTaskData = (taskData : TaskData) => {
  return {
    team: toDisplayData(taskData.team),
    members: Object.entries(taskData.members).reduce(
      (acc, [name, data]) => {
        acc[name] = toDisplayData(data)
        return acc
      },
      {} as Record<string, TaskDisplayData[]>
    ),
    lastUpdated: taskData.lastUpdated
  }
}
