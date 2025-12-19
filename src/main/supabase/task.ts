import { getSupabaseClient } from './client'
import type { TaskInsert, TaskRawData } from './types'

/**
 * 크롤러 원본 데이터를 DB Insert 형식으로 변환
 */
function transformTaskData(raw: TaskRawData): TaskInsert {
  return {
    task_id: raw.taskId,
    us_id: raw.usId,
    us_name: raw.usName,
    dept_name: raw.deptName,
    title: raw.title,
    status: raw.status,
    priority: raw.priority ?? null,
    due_date: raw.dueDate ?? null
  }
}

/**
 * 크롤러에서 수집한 업무 데이터를 Supabase에 저장 (UPSERT)
 */
export async function syncTasksToSupabase(rawData: TaskRawData[]): Promise<{ inserted: number; updated: number; total: number }> {
  try {
    const client = getSupabaseClient()
    const operations = { inserted: 0, updated: 0 }

    console.log(`[Supabase:Task] ${rawData.length}개 데이터 동기화 시작...`)

    // 변환된 데이터 준비
    const transformedData = rawData.map(transformTaskData)

    // UPSERT 실행 (task_id 기준)
    const { error, count } = await client
      .from('tasks')
      .upsert(transformedData as any, {
        onConflict: 'task_id',
        ignoreDuplicates: false // 중복 시 UPDATE
      })
      .select('task_id')

    if (error) {
      console.error('[Supabase:Task] 동기화 실패:', error.message)
      throw error
    }

    // 정확한 inserted/updated 구분은 어렵지만, 총 처리 건수는 확인 가능
    operations.updated = count ?? 0
    operations.inserted = (count ?? 0) - operations.updated

    console.log(`[Supabase:Task] 동기화 완료 - 삽입: ${operations.inserted}, 업데이트: ${operations.updated}, 총: ${rawData.length}`)

    return {
      inserted: operations.inserted,
      updated: operations.updated,
      total: rawData.length
    }
  } catch (error) {
    console.error('[Supabase:Task] 저장 중 오류:', error)
    throw error
  }
}

/**
 * 모든 업무 데이터 조회
 */
export async function getAllTasks() {
  try {
    const client = getSupabaseClient()

    console.log('[Supabase:Task] 전체 업무 데이터 조회...')

    const { data, error } = await client
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('[Supabase:Task] 조회 실패:', error.message)
      throw error
    }

    console.log(`[Supabase:Task] ${data?.length ?? 0}건 조회 완료`)
    return data ?? []
  } catch (error) {
    console.error('[Supabase:Task] 조회 중 오류:', error)
    return []
  }
}

/**
 * 특정 사용자의 업무 조회
 */
export async function getTasksByUser(usId: string) {
  try {
    const client = getSupabaseClient()

    console.log(`[Supabase:Task] 사용자 ${usId} 업무 조회...`)

    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('us_id', usId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('[Supabase:Task] 조회 실패:', error.message)
      throw error
    }

    console.log(`[Supabase:Task] ${data?.length ?? 0}건 조회 완료`)
    return data ?? []
  } catch (error) {
    console.error('[Supabase:Task] 조회 중 오류:', error)
    return []
  }
}

/**
 * 상태별 업무 조회
 */
export async function getTasksByStatus(status: string) {
  try {
    const client = getSupabaseClient()

    console.log(`[Supabase:Task] 상태 ${status} 업무 조회...`)

    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) {
      console.error('[Supabase:Task] 조회 실패:', error.message)
      throw error
    }

    console.log(`[Supabase:Task] ${data?.length ?? 0}건 조회 완료`)
    return data ?? []
  } catch (error) {
    console.error('[Supabase:Task] 조회 중 오류:', error)
    return []
  }
}

/**
 * 전체 업무 데이터 개수 조회
 */
export async function getTasksCount(): Promise<number> {
  try {
    const client = getSupabaseClient()
    const { count, error } = await client.from('tasks').select('*', { count: 'exact', head: true })

    if (error) {
      console.error('[Supabase:Task] 카운트 조회 실패:', error.message)
      return 0
    }

    return count ?? 0
  } catch (error) {
    console.error('[Supabase:Task] 카운트 조회 중 오류:', error)
    return 0
  }
}
