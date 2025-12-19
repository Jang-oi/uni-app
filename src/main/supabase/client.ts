import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Supabase 클라이언트 싱글톤 인스턴스
 */
let supabaseClient: SupabaseClient<Database> | null = null

/**
 * Supabase 클라이언트 초기화 및 반환
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL과 ANON KEY가 환경 변수에 설정되지 않았습니다.')
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey)
    console.log('[Supabase] 클라이언트 초기화 완료')
  }

  return supabaseClient
}

/**
 * Supabase 연결 테스트
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient()
    const { error } = await client.from('vacations').select('count').limit(1)

    if (error) {
      console.error('[Supabase] 연결 테스트 실패:', error.message)
      return false
    }

    console.log('[Supabase] 연결 테스트 성공')
    return true
  } catch (error) {
    console.error('[Supabase] 연결 중 오류:', error)
    return false
  }
}
