/**
 * Mock 데이터 Writer
 * 크롤링한 데이터를 mockdata JSON 파일로 저장
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import type { TaskRawData, VacationRawData } from '../types/data'

/**
 * mockdata 디렉토리 경로
 */
const MOCKDATA_DIR = join(__dirname, '../../mockdata')

/**
 * 휴가 데이터를 mockdata/vacations.json에 저장
 */
export function saveVacationsMockData(data: VacationRawData[]): void {
  try {
    const filePath = join(MOCKDATA_DIR, 'vacations.json')
    const jsonContent = JSON.stringify(data, null, 2)
    writeFileSync(filePath, jsonContent, 'utf-8')
    console.log(`[MockData] 휴가 데이터 ${data.length}건을 ${filePath}에 저장 완료`)
  } catch (error) {
    console.error('[MockData] 휴가 데이터 저장 실패:', error)
  }
}

/**
 * 업무 데이터를 mockdata/tasks.json에 저장
 */
export function saveTasksMockData(data: TaskRawData[]): void {
  try {
    const filePath = join(MOCKDATA_DIR, 'tasks.json')
    const jsonContent = JSON.stringify(data, null, 2)
    writeFileSync(filePath, jsonContent, 'utf-8')
    console.log(`[MockData] 업무 데이터 ${data.length}건을 ${filePath}에 저장 완료`)
  } catch (error) {
    console.error('[MockData] 업무 데이터 저장 실패:', error)
  }
}
