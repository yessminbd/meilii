import express from "express"
import adminAuth from "../middleware/adminAuth.js"
import { allOrders, placeOrder, placeOrderStrip, updateStatus, updateAdvance, userOrders, verifyStripe } from "../controllers/orderController.js"
import authUser from "../middleware/auth.js"


const orderRouter = express.Router()

//admin
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus)
orderRouter.post('/advance', adminAuth, updateAdvance)

//payment
orderRouter.post('/place-order', authUser, placeOrder)
orderRouter.post('/stripe', authUser, placeOrderStrip)

//user
orderRouter.post('/user-orders', authUser, userOrders)
//verifier paiement
orderRouter.post('/verifyStripe', authUser, verifyStripe)


export default orderRouter