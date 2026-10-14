import orderModel from "../models/orderModel.js"
import userModel from "../models/userModel.js"
import Stripe from "stripe"
// import { sendOrderConfirmationEmail } from "../services/emailService.js" // [À activer ultérieurement]


// variables for payment
const currency = 'USD'
const delivery_charges = 7


// stripe initials
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


// place order (cash)
const placeOrder = async (req, res) => {

    try {
        const { userId, items, amount, address } = req.body
        const orderData = {
            userId,
            items, 
            amount, 
            paymentMethod: 'COD', 
            address,
            payment: false,
            status: 'Order Placed',
            advanceAmount: 0,
            advancePaid: false,
            remainingAmount: amount,
            date: Date.now()
        }
        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        /* ── [À ACTIVER ULTÉRIEUREMENT] Envoi de confirmation par email (COD) ──
        const user = await userModel.findById(userId).catch(() => null)
        const userEmail = user?.email || address?.email
        const userName = user?.name || `${address?.firstName || ''} ${address?.lastName || ''}`.trim()

        sendOrderConfirmationEmail({
            order: newOrder,
            userEmail,
            userName
        }).catch(err => console.error("[OrderController] Erreur envoi email:", err))
        ────────────────────────────────────────────────────────────────────────── */

        res.json({ success: true, message: 'Commande passée avec succès' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }
}


// add order strip
const placeOrderStrip = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body
        const { origin } = req.headers

        const orderData = {
            userId,
            items, amount, paymentMethod: 'STRIPE', address,
            payment: false,
            date: Date.now()

        }
        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => (
            {
                price_data: {
                    currency: currency,
                    product_data: {
                        name: item.name
                    },
                    unit_amount: item.price * 100 * 277
                },
                quantity: item.quantity
            }))
        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Prix de livraison"
                },
                unit_amount: delivery_charges * 100 * 277
            },
            quantity: 1
        })
        const session = await stripe.checkout.sessions.create({
            line_items: line_items,
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            mode: 'payment'
        })
        res.json({ success: true, session_url: session.url })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }
}

//verifier stripe methode
const verifyStripe = async (req, res) => {
    const { orderId, success, userId } = req.body
    try {
        if (success === 'true') {
            const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { payment: true }, { new: true })
            await userModel.findByIdAndUpdate(userId, { cartData: {} })

            /* ── [À ACTIVER ULTÉRIEUREMENT] Envoi de confirmation par email (STRIPE) ──
            if (updatedOrder) {
                const user = await userModel.findById(userId).catch(() => null)
                const userEmail = user?.email || updatedOrder.address?.email
                const userName = user?.name || `${updatedOrder.address?.firstName || ''} ${updatedOrder.address?.lastName || ''}`.trim()

                sendOrderConfirmationEmail({
                    order: updatedOrder,
                    userEmail,
                    userName
                }).catch(err => console.error("[OrderController] Erreur envoi email Stripe:", err))
            }
            ────────────────────────────────────────────────────────────────────────── */

            res.json({ success: true })
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: true })

        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// all orders admin
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({ success: true, orders })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// all order user
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body
        if (!userId) {
            return res.json({ success: true, orders: [] })
        }
        const orders = await orderModel.find({ userId }).sort({ date: -1 })
        res.json({ success: true, orders })
    } catch (error) {
        console.error("[userOrders] Error:", error)
        res.json({ success: false, message: error.message, orders: [] })
    }
}

// update Status admin
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body

        // Si la commande est marquée comme Delivered → paiement automatiquement validé
        const updateData = { status }
        if (status === 'Delivered') {
            updateData.payment = true
        }

        await orderModel.findByIdAndUpdate(orderId, updateData)
        res.json({ success: true, message: "Statut mis à jour" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// update Advance & validate order (admin)
const updateAdvance = async (req, res) => {
    try {
        const { orderId, advanceAmount, advancePaid, status } = req.body

        const order = await orderModel.findById(orderId)
        if (!order) {
            return res.json({ success: false, message: "Commande introuvable" })
        }

        const advanceNum = Number(advanceAmount) || 0
        const isPaid = advancePaid === true || advancePaid === 'true'
        const remaining = Math.max(0, (order.amount || 0) - advanceNum)

        const updateData = {
            advanceAmount: advanceNum,
            advancePaid: isPaid,
            remainingAmount: remaining,
        }

        // Si un nouveau statut est fourni ou si l'avance est validée, faire progresser la commande
        if (status) {
            updateData.status = status
        } else if (isPaid && order.status === 'Order Placed') {
            updateData.status = 'Packing'
        }

        const updated = await orderModel.findByIdAndUpdate(orderId, updateData, { new: true })
        res.json({ success: true, message: "Avance mise à jour avec succès", order: updated })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { placeOrder, placeOrderStrip, allOrders, userOrders, updateStatus, updateAdvance, verifyStripe }