import express from "express"
import cors from "cors"
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import productRouter from "./routes/productRoute.js"
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import promoRouter from "./routes/promoRoute.js"
import categoryRouter from "./routes/categoryRoute.js"
import sizeTypeRouter from "./routes/sizeTypeRoute.js"
import colorRouter from "./routes/colorRoute.js"
// App config
const app = express()
const port = process.env.PORT || 4000


// Middleware
app.use(express.json()) // Pour lire le JSON dans les requêtes POST

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174']

app.use(cors({
  origin: (origin, callback) => {
    // Autorise les appels sans origine (ex: Postman, mobile)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('CORS: origin not allowed'))
  },
  credentials: true,
}))

// ← Garantit la connexion MongoDB avant CHAQUE requête (crucial pour Vercel serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB()
        next()
    } catch (err) {
        console.error("DB connection error:", err.message)
        res.status(503).json({ success: false, message: "Service temporairement indisponible, réessayez." })
    }
})

connectCloudinary()

// API route
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/promo', promoRouter)
app.use('/api/category', categoryRouter)
app.use('/api/sizeType', sizeTypeRouter)
app.use('/api/color', colorRouter)


app.get('/', (req, res) => {
    res.send("API is working")
})

// Démarrage du serveur
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => console.log("Server is running on port: " + port));
}

export default app;

