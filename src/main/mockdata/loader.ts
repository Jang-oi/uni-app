/**
 * Mock 데이터 로더
 * Express 서버 구현 전까지 로컬 JSON 파일에서 데이터를 읽어옴
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import type { TaskRawData, VacationRawData } from '../types/data'

/**
 * mockdata 디렉토리 경로
 */
const MOCKDATA_DIR = join(__dirname, '../../mockdata')

/**
 * 휴가 Mock 데이터 로드
 */
export function loadVacationsMockData(): VacationRawData[] {
  try {
    const filePath = join(MOCKDATA_DIR, 'vacations.json')
    const fileContent = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    console.log(`[MockData] 휴가 데이터 ${data.length}건 로드 완료`)
    return data
  } catch (error) {
    console.error('[MockData] 휴가 데이터 로드 실패:', error)
    return []
  }
}

/**
 * 업무 Mock 데이터 로드
 */
export function loadTasksMockData(): TaskRawData[] {
  try {
    const filePath = join(MOCKDATA_DIR, 'tasks.json')
    const fileContent = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    console.log(`[MockData] 업무 데이터 ${data.length}건 로드 완료`)
    return data
  } catch (error) {
    console.error('[MockData] 업무 데이터 로드 실패:', error)
    return []
  }
}

/**
 * 월별 휴가 데이터 필터링 (camelCase 변환 포함)
 */
export function filterVacationsByMonth(year: string, month: string): any[] {
  const allVacations = loadVacationsMockData()

  // 해당 월의 시작일과 종료일
  const startDate = `${year}-${month.padStart(2, '0')}-01`
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
  const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`

  // 날짜 범위 필터링
  const filtered = allVacations.filter((vacation) => {
    const useSdate = vacation.useSdate
    const useEdate = vacation.useEdate

    // 1) 시작일이 해당 월에 포함
    // 2) 종료일이 해당 월에 포함
    // 3) 시작일이 월 이전이고 종료일이 월 이후 (전체 기간 포함)
    return (
      (useSdate >= startDate && useSdate <= endDate) ||
      (useEdate >= startDate && useEdate <= endDate) ||
      (useSdate < startDate && useEdate > endDate)
    )
  })

  // snake_case를 camelCase로 변환 (기존 Supabase 응답 형식 유지)
  const transformed = filtered.map((item) => ({
    useId: item.useId,
    usName: item.usName,
    deptName: item.deptName,
    itemName: item.itemName,
    useSdate: item.useSdate,
    useEdate: item.useEdate,
    useStime: item.useStime,
    useEtime: item.useEtime,
    useDesc: item.useDesc,
    useTimeTypeName: item.useTimeTypeName,
    useDayCnt: item.useDayCnt
  }))

  console.log(`[MockData] ${year}년 ${month}월 휴가 ${transformed.length}건 필터링 완료`)
  return transformed
}

/**
 * 전체 업무 데이터 조회 (camelCase 변환 포함)
 */
export function getAllTasks(): any[] {
  const allTasks = loadTasksMockData()

  // snake_case를 camelCase로 변환 (기존 Supabase 응답 형식 유지)
  const transformed = allTasks.map((item) => ({
    taskId: item.taskId,
    usId: item.usId,
    usName: item.usName,
    deptName: item.deptName,
    title: item.title,
    status: item.status,
    priority: item.priority,
    dueDate: item.dueDate
  }))

  console.log(`[MockData] 전체 업무 ${transformed.length}건 조회 완료`)
  return transformed
}

/**
 * 특정 사용자의 업무 조회
 */
export function getTasksByUser(usId: string): any[] {
  const allTasks = getAllTasks()
  const filtered = allTasks.filter((task) => task.usId === usId)
  console.log(`[MockData] 사용자 ${usId} 업무 ${filtered.length}건 조회 완료`)
  return filtered
}
