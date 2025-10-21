import { Router } from 'express'
import DB from '../db/database.js'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { verifyAccessToken } from '../utils.js'

const userRoutes = Router();

const validateNames = [
    body('firstName', 'First Name Empty').notEmpty(),
    body('lastName', 'Last Name Empty').notEmpty()
]

//UPDATE USER FIRST NAME & LAST NAME
userRoutes.put('/user', validateNames, verifyAccessToken, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) { return res.status(400).json({ error: 'validation error' }) }

    const userDetails = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userId: req.user.userId
    }

    const response = await DB.users.updateUser(userDetails);
    if (!response.status) { return res.status(500).json({ error: 'update user names failed' }) }

    res.sendStatus(200)

})

// Password Validation Rules
const validatePassword = [
    body('newPassword')
        .notEmpty()
        .isLength({ min: 8, max: 30 }).withMessage('Password Must Be at Least 8 Characters')
        .matches('[0-9]').withMessage('Password Must Contain a Number')
        .matches('[A-Z]').withMessage('Password Must Contain an Uppercase Letter')
];

//UPDATE USER PASSWORD
userRoutes.put('/user/password', validatePassword, verifyAccessToken, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) { return res.status(400).json({ error: 'validation error' }) }

    const { email, oldPassword, newPassword } = req.body
    const userPassDetails = { email }

    const getUserPassResponse = await DB.users.getUserPassword(userPassDetails);
    if (!getUserPassResponse.status) { return res.status(400).json({ error: 'incorrect user' }) }

    const passwordMatch = await bcrypt.compare(oldPassword, getUserPassResponse.data.password)
    if (!passwordMatch) { return res.status(400).json({ error: 'incorrect password' }) }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const userDetails = {
        password: hashedPassword,
        userId: req.user.userId
    }

    const response = await DB.users.updateUserPassword(userDetails);
    if (!response.status) { return res.status(500).json({ error: 'update user password failed' }) }

    res.sendStatus(200)
})

//UPDATE USER STARTED STATUS
userRoutes.put('/user/started', verifyAccessToken, async (req, res) => {
    const userDetails = { userId: req.user.userId }

    const response = await DB.users.updateUserStarted(userDetails);
    if (!response.status) { return res.status(500).json({ error: 'update user started failed' }) }

    res.sendStatus(200)
})

//UPDATE USER VERIFIED STATUS
userRoutes.put('/user/verify', verifyAccessToken, async (req, res) => {
    const userDetails = { userId: req.user.userId }

    const response = await DB.users.updateUserVerified(userDetails);
    if (!response.status) { return res.status(500).json({ error: 'update user verified failed' }) }

    res.sendStatus(200)
})

//GET USER DETAILS
userRoutes.get('/user', verifyAccessToken, async (req, res) => {
    const userDetails = { userId: req.user.userId }

    const response = await DB.users.getUser(userDetails);
    if (!response.status) { return res.status(500).json({ error: 'get user failed' }) }

    const returnedValue = {
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        email: response.data.email,
        started: response.data.started,
        verified: response.data.verified
    }

    res.status(200).json(returnedValue)
})

//GET USER BALANCE
userRoutes.get('/user/balance', verifyAccessToken, async (req, res) => {
    const userDetails = { userId: req.user.userId }
    
    const response = await DB.users.getUserBalance(userDetails);
    if (!response.status) { return res.status(500).json({ error: 'get user balance failed' }) }

    res.status(200).json({ balance: response.data })
})

export default userRoutes;