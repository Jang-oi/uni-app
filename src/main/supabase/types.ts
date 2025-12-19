/**
 * Supabase Database 타입 정의
 */
export interface Database {
  public: {
    Tables: {
      vacations: {
        Row: VacationRow
        Insert: VacationInsert
        Update: VacationUpdate
      }
      tasks: {
        Row: TaskRow
        Insert: TaskInsert
        Update: TaskUpdate
      }
    }
  }
}

/**
 * 휴가 데이터 타입 (DB Row)
 */
export interface VacationRow {
  use_id: string
  belong_year: string
  us_id: string
  emp_no: string
  us_name: string
  dept_name: string
  item_id: string
  item_name: string
  item_type: string
  use_sdate: string // DATE
  use_edate: string // DATE
  use_stime: string | null
  use_etime: string | null
  use_min: string | null
  use_day_cnt: string
  use_time_type: string | null
  use_time_type_name: string | null
  time_unit: string | null
  aprv_doc_sts: string
  proc_sts: string
  aprv_title: string | null
  last_aprv_us_name: string | null
  last_aprv_date: string | null
  use_desc: string | null
  created_at: string
  updated_at: string
}

/**
 * 휴가 데이터 삽입 타입
 */
export type VacationInsert = Omit<VacationRow, 'created_at' | 'updated_at'>

/**
 * 휴가 데이터 업데이트 타입
 */
export type VacationUpdate = Partial<VacationInsert>

/**
 * 크롤러에서 수집한 원본 휴가 데이터 타입
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
  useStime?: string
  useEtime?: string
  useMin?: string
  useDayCnt: string
  useTimeType?: string
  useTimeTypeName?: string
  timeUnit?: string
  aprvDocSts: string
  procSts: string
  aprvTitle?: string
  lastAprvUsName?: string
  lastAprvDate?: string
  useDesc?: string
}

/**
 * 업무 데이터 타입 (DB Row)
 */
export interface TaskRow {
  task_id: string
  us_id: string
  us_name: string
  dept_name: string
  title: string
  status: string
  priority: string | null
  due_date: string | null // DATE
  created_at: string
  updated_at: string
}

/**
 * 업무 데이터 삽입 타입
 */
export type TaskInsert = Omit<TaskRow, 'created_at' | 'updated_at'>

/**
 * 업무 데이터 업데이트 타입
 */
export type TaskUpdate = Partial<TaskInsert>

/**
 * 크롤러에서 수집한 원본 업무 데이터 타입
 */
export interface TaskRawData {
  taskId: string
  usId: string
  usName: string
  deptName: string
  title: string
  status: string
  priority?: string
  dueDate?: string
}
