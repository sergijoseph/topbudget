import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
dotenv.config()

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import accountRoutes from './routes/account.js'
import categoryRoutes from './routes/categories.js'
import transactionRoutes from './routes/transactions.js'

const {
    BACKEND_PORT,
    NODE_ENV,
    ORIGIN
} = process.env
const IS_PROD = NODE_ENV === 'production';


// ---------- MIDDLEWARE ----------
const app = express()
app.use(helmet());


app.use(cors({
    origin: ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//USE ROUTES
app.use(authRoutes)
app.use(userRoutes)
app.use(accountRoutes)
app.use(categoryRoutes)
app.use(transactionRoutes)

app.listen(BACKEND_PORT, () => {
    console.log('Backend Server is running on port: ' + BACKEND_PORT)
})