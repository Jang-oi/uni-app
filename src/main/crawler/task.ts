/**
 * 업무 크롤러
 * 업무 관리 사이트에서 팀원별 업무 정보 조회
 */

import { config } from '../config'
import { loadCredentials } from '../store'
import { crawlerBrowser } from './browser'

interface TaskData {
  taskId: string
  title: string
  assignee: string
  status: string
  priority: string
  dueDate: string
  description: string
}

class TaskCrawler {
  /**
   * 업무 데이터 크롤링 (모든 팀원)
   */
  async crawl(): Promise<TaskData[]> {
    console.log('[TaskCrawler] 크롤링 시작')

    try {
      // 브라우저 초기화
      await crawlerBrowser.init()

      // 자격증명 로드
      const credentials = loadCredentials()
      const siteUrl = credentials.taskSite.url
      if (!siteUrl) {
        throw new Error('업무 사이트 URL이 설정되지 않았습니다')
      }

      await crawlerBrowser.navigateTo(siteUrl)

      // 로그인 확인
      const isLoggedIn = await crawlerBrowser.checkLogin()
      if (!isLoggedIn) {
        console.warn('[TaskCrawler] 로그인 필요 - 크롤링 중단')
        return []
      }

      // 팀원 목록
      const teamMembers = credentials.teamMembers
      if (teamMembers.length === 0) {
        console.warn('[TaskCrawler] 팀 멤버가 설정되지 않았습니다')
        return []
      }

      // 각 팀원의 업무 크롤링
      const allTasks: TaskData[] = []
      for (const member of teamMembers) {
        const tasks = await this.crawlMemberTasks(member)
        allTasks.push(...tasks)
      }

      console.log(`[TaskCrawler] 크롤링 완료: ${allTasks.length}개 업무`)

      // 서버로 전송
      await this.syncToServer(allTasks)

      return allTasks
    } catch (error) {
      console.error('[TaskCrawler] 크롤링 오류:', error)
      return []
    }
  }

  /**
   * 특정 팀원의 업무 크롤링
   */
  private async crawlMemberTasks(memberName: string): Promise<TaskData[]> {
    console.log(`[TaskCrawler] ${memberName} 업무 조회 중...`)

    try {
      // 담당자 필터 적용 (실제 사이트 구조에 맞게 수정 필요)
      await crawlerBrowser.executeScript(`
        (function() {
          const assigneeFilter = document.querySelector('#assignee-filter');
          if (assigneeFilter) {
            assigneeFilter.value = '${memberName}';
            assigneeFilter.dispatchEvent(new Event('change'));
          }
        })()
      `)

      // 업무 목록 로드 대기
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 업무 데이터 파싱
      const tasks = await this.parseTasks(memberName)

      console.log(`[TaskCrawler] ${memberName}: ${tasks.length}개 업무 발견`)

      return tasks
    } catch (error) {
      console.error(`[TaskCrawler] ${memberName} 크롤링 오류:`, error)
      return []
    }
  }

  /**
   * 업무 데이터 파싱
   */
  private async parseTasks(assignee: string): Promise<TaskData[]> {
    const tasks = await crawlerBrowser.executeScript<TaskData[]>(`
      (function() {
        // 실제 사이트 구조에 맞게 수정 필요
        const items = Array.from(document.querySelectorAll('.task-item'));

        return items.map(item => {
          const taskIdElement = item.querySelector('.task-id');
          const titleElement = item.querySelector('.task-title');
          const statusElement = item.querySelector('.task-status');
          const priorityElement = item.querySelector('.task-priority');
          const dueDateElement = item.querySelector('.due-date');
          const descElement = item.querySelector('.task-description');

          return {
            taskId: taskIdElement?.textContent?.trim() || '',
            title: titleElement?.textContent?.trim() || '',
            assignee: '${assignee}',
            status: statusElement?.textContent?.trim() || '',
            priority: priorityElement?.textContent?.trim() || 'medium',
            dueDate: dueDateElement?.textContent?.trim() || '',
            description: descElement?.textContent?.trim() || ''
          };
        }).filter(t => t.taskId); // 빈 항목 제외
      })()
    `)

    return tasks
  }

  /**
   * 서버로 데이터 동기화
   */
  private async syncToServer(tasks: TaskData[]): Promise<void> {
    try {
      const response = await fetch(`${config.serverUrl}/api/tasks/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tasks })
      })

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`)
      }

      console.log('[TaskCrawler] 서버 동기화 완료')
    } catch (error) {
      console.error('[TaskCrawler] 서버 동기화 오류:', error)
    }
  }
}

/**
 * 싱글톤 인스턴스
 */
export const taskCrawler = new TaskCrawler()
