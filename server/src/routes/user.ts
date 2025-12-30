import { Router } from 'express'
import {USER_NAME_MAP} from "@/config/users";


export default () => {
    const router = Router()

    router.post('/info', (req, res) => {
        try {
            const { hostname } = req.body

            if (!hostname) {
                return res.status(400).json({
                    success: false,
                    error: 'hostname이 필요합니다.'
                })
            }

            const userName = USER_NAME_MAP[hostname]

            if (!userName) {
                // 미등록 사용자
                console.warn(`[User] 미등록 hostname: ${hostname}`)
                return res.json({
                    success: true,
                    data: {
                        hostname,
                        userName: null,
                        isRegistered: false
                    }
                })
            }

            // 등록된 사용자
            return res.json({
                success: true,
                data: {
                    hostname,
                    userName,
                    isRegistered: true
                }
            })
        } catch (error) {
            console.error('[User API] Error:', error)
            return res.status(500).json({
                success: false,
                error: '서버 오류가 발생했습니다.'
            })
        }
    })

    return router
}
