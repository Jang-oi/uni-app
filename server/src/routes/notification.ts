import { Router } from 'express'
import { notificationData } from '../index.js'

export default function notificationRouter() {
    const router = Router()

    // 특정 사용자의 알림 조회
    router.get('/:hostname', (req, res) => {
        const { hostname } = req.params

        const userNotifications = notificationData.notifications.filter((n) => n.receiverHostname === hostname)

        res.json({
            success: true,
            notifications: userNotifications
        })
    })

    return router
}
