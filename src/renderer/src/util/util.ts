const SUPPORT_URL = 'https://114.unipost.co.kr/home.uni'

export async function openUniPost(srIdx: string) {
  try {
    const url = `${SUPPORT_URL}?access=list&srIdx=${srIdx}`
    await window.api.openExternal(url)
  } catch (error) {
    console.error('[TaskTable] 외부 URL 열기 실패:', error)
  }
}
