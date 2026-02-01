import { Router } from 'express'
import alertsRouter from './alerts'

const router = Router()

// Mount alert routes
router.use('/alerts', alertsRouter)

export default router
