import { getSupabaseClient } from './client'
import type { VacationInsert, VacationRawData } from './types'

/**
 * 크롤러 원본 데이터를 DB Insert 형식으로 변환
 */
function transformVacationData(raw: VacationRawData): VacationInsert {
  return {
    use_id: raw.useId,
    belong_year: raw.belongYear,
    us_id: raw.usId,
    emp_no: raw.empNo,
    us_name: raw.usName,
    dept_name: raw.deptName,
    item_id: raw.itemId,
    item_name: raw.itemName,
    item_type: raw.itemType,
    use_sdate: raw.useSdate,
    use_edate: raw.useEdate,
    use_stime: raw.useStime ?? null,
    use_etime: raw.useEtime ?? null,
    use_min: raw.useMin ?? null,
    use_day_cnt: raw.useDayCnt,
    use_time_type: raw.useTimeType ?? null,
    use_time_type_name: raw.useTimeTypeName ?? null,
    time_unit: raw.timeUnit ?? null,
    aprv_doc_sts: raw.aprvDocSts,
    proc_sts: raw.procSts,
    aprv_title: raw.aprvTitle ?? null,
    last_aprv_us_name: raw.lastAprvUsName ?? null,
    last_aprv_date: raw.lastAprvDate ?? null,
    use_desc: raw.useDesc ?? null
  }
}

/**
 * 크롤러에서 수집한 휴가 데이터를 Supabase에 저장 (UPSERT)
 */
export async function syncVacationsToSupabase(rawData: VacationRawData[]): Promise<{ inserted: number; updated: number; total: number }> {
  try {
    const client = getSupabaseClient()
    const operations = { inserted: 0, updated: 0 }

    console.log(`[Supabase:Vacation] ${rawData.length}개 데이터 동기화 시작...`)

    // 변환된 데이터 준비
    const transformedData = rawData.map(transformVacationData)

    // UPSERT 실행 (use_id 기준)
    const { error, count } = await client
      .from('vacations')
      .upsert(transformedData as any, {
        onConflict: 'use_id',
        ignoreDuplicates: false // 중복 시 UPDATE
      })
      .select('use_id')

    if (error) {
      console.error('[Supabase:Vacation] 동기화 실패:', error.message)
      throw error
    }

    // 정확한 inserted/updated 구분은 어렵지만, 총 처리 건수는 확인 가능
    operations.updated = count ?? 0
    operations.inserted = (count ?? 0) - operations.updated

    console.log(`[Supabase:Vacation] 동기화 완료 - 삽입: ${operations.inserted}, 업데이트: ${operations.updated}, 총: ${rawData.length}`)

    return {
      inserted: operations.inserted,
      updated: operations.updated,
      total: rawData.length
    }
  } catch (error) {
    console.error('[Supabase:Vacation] 저장 중 오류:', error)
    throw error
  }
}

/**
 * 월별 휴가 데이터 조회
 */
export async function getVacationsByMonth(year: string, month: string) {
  try {
    const client = getSupabaseClient()

    // 해당 월의 시작일과 종료일
    const startDate = `${year}-${month.padStart(2, '0')}-01`
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`

    console.log(`[Supabase:Vacation] ${year}년 ${month}월 데이터 조회...`)

    const { data, error } = await client
      .from('vacations')
      .select('use_id, us_name, dept_name, item_name, use_sdate, use_edate, use_stime, use_etime, use_desc, use_time_type_name')
      .or(
        `and(use_sdate.gte.${startDate},use_sdate.lte.${endDate}),and(use_edate.gte.${startDate},use_edate.lte.${endDate}),and(use_sdate.lt.${startDate},use_edate.gt.${endDate})`
      )
      .order('use_sdate', { ascending: true })
      .order('us_name', { ascending: true })

    if (error) {
      console.error('[Supabase:Vacation] 조회 실패:', error.message)
      throw error
    }

    console.log(`[Supabase:Vacation] ${data?.length ?? 0}건 조회 완료`)
    return data ?? []
  } catch (error) {
    console.error('[Supabase:Vacation] 조회 중 오류:', error)
    return []
  }
}

/**
 * 전체 휴가 데이터 개수 조회
 */
export async function getVacationsCount(): Promise<number> {
  try {
    const client = getSupabaseClient()
    const { count, error } = await client.from('vacations').select('*', { count: 'exact', head: true })

    if (error) {
      console.error('[Supabase:Vacation] 카운트 조회 실패:', error.message)
      return 0
    }

    return count ?? 0
  } catch (error) {
    console.error('[Supabase:Vacation] 카운트 조회 중 오류:', error)
    return 0
  }
}
