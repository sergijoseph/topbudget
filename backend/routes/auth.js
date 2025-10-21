import { Router } from 'express'
import DB from '../db/database.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import ms from 'ms'
import { signAccessToken, signRefreshToken, setRefreshCookie, clearRefreshCookie, verifyAccessToken, sendEmail } from '../utils.js'

const authRoutes = Router();

const {
    REFRESH_TOKEN_TTL,
    JWT_REFRESH_SECRET,
    ORIGIN,
    APP_NAME
} = process.env

// Sign Up Validation Rules
const signupValidate = [
    body('email', 'Please enter a valid email address').notEmpty().isEmail().toLowerCase(),
    body('firstName')
        .notEmpty().withMessage('Your first name is missing')
        .isLength({ max: 30 }).withMessage('Your first name should not be more than 30 characters'),
    body('lastName')
        .notEmpty().withMessage('Your last name is missing')
        .isLength({ max: 30 }).withMessage('Your last name should not be more than 30 characters'),
    body('password')
        .notEmpty()
        .isLength({ min: 8, max: 30 }).withMessage('Password must contain at least 8 Characters')
        .matches('[0-9]').withMessage('Password must contain a number')
        .matches('[A-Z]').withMessage('Password must contain an uppercase letter')
];

// Login Validation Rules
const loginValidate = [
    body('email', 'Must Be an Email Address').notEmpty().isEmail().toLowerCase(),
    body('password', 'Invalid password')
        .notEmpty().isLength({ min: 8, max: 30 }).withMessage('Password Must Be at Least 8 Characters')
];

//CREATE NEW USER
authRoutes.post('/auth/signup', signupValidate, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        const errorMessage = errors.array().map(err => err.msg);
        return res.status(400).json({ error: 'validation error', errorMessage })
    }

    const userDetails = { ...req.body };
    const userEmailDetails = { email: userDetails.email } //To ensure only email is sent to checkUserExist function in json format

    const userExist = await DB.users.checkUserExist(userEmailDetails)
    if (userExist.data) { return res.status(500).json({ error: 'duplicate user' }) }
    if (!userExist.status) { return res.status(500).json({ error: 'email check failed' }) }

    const hashedPassword = await bcrypt.hash(userDetails.password, 10)
    userDetails.password = hashedPassword

    const createUserResponse = await DB.users.createUser(userDetails)
    if (!createUserResponse.status) { return res.status(500).json({ error: 'create user failed' }) }

    // Create refresh token "family" and jti for rotation & sign refresh token
    const familyId = uuidv4();
    const jti = uuidv4();
    const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');
    const refreshPayload = { userId: createUserResponse.data.userId, jti, fam: familyId, type: 'refresh' };
    const refreshToken = signRefreshToken(refreshPayload);

    //Store refresh token in DB
    const createTokenResponse = await DB.tokens.createRefreshToken({
        hashedJti,
        userId: createUserResponse.data.userId,
        familyId,
        expiresAt: Date.now() + ms(REFRESH_TOKEN_TTL)
    });

    if (!createTokenResponse.status) { return res.status(500).json({ error: 'create refresh token failed' }) }

    //Get user details from DB
    const getUserResponse = await DB.users.getUser({ userId: createUserResponse.data.userId });
    if (!getUserResponse.status) { return res.status(500).json({ error: 'user not found' }); }

    const createAccountDetails = {
        name: 'Main Account',
        userId: createUserResponse.data.userId
    }

    const createAccountResponse = await DB.accounts.createAccount(createAccountDetails);
    if (!createAccountResponse.status) { return res.status(500).json({ error: 'create main account failed' }) }

    // Sign Access token
    const accessTokenPayload = {
        userId: createUserResponse.data.userId,
        email: userDetails.email,
        started: getUserResponse.data.started,
        verified: getUserResponse.data.verified
    }
    const accessToken = signAccessToken(accessTokenPayload);

    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user: { userId: accessTokenPayload.userId, email: accessTokenPayload.email } });
})

//LOGIN USER
authRoutes.post('/auth/login', loginValidate, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) { return res.status(400).json({ error: 'validation error' }) }

    const { email, password } = req.body
    const userEmailDetails = { email } //To ensure only email is sent to getUserPassword function in json format

    const getUserPassResponse = await DB.users.getUserPassword(userEmailDetails);
    if (!getUserPassResponse.status) { return res.status(400).json({ error: 'incorrect user' }) }

    const passwordMatch = await bcrypt.compare(password, getUserPassResponse.data.password)
    if (!passwordMatch) { return res.status(400).json({ error: 'incorrect password' }) }

    //Get user details from DB
    const userDetails = { userId: getUserPassResponse.data.user_id }
    const getUserResponse = await DB.users.getUser(userDetails);
    if (!getUserResponse.status) { return res.status(401).json({ error: 'user not found' }); }

    // Create refresh token "family" and jti for rotation & sign refresh token
    const familyId = uuidv4();
    const jti = uuidv4();
    const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');

    const refreshPayload = { userId: getUserPassResponse.data.user_id, jti, fam: familyId, type: 'refresh' };
    const refreshToken = signRefreshToken(refreshPayload);

    //Store refresh token in DB
    const createTokenResponse = await DB.tokens.createRefreshToken({
        hashedJti,
        userId: getUserPassResponse.data.user_id,
        familyId,
        expiresAt: Date.now() + ms(REFRESH_TOKEN_TTL)
    });

    if (!createTokenResponse.status) { return res.status(500).json({ error: 'create refresh token failed' }) }

    // Sign Access token
    const accessTokenPayload = {
        userId: getUserPassResponse.data.user_id,
        email: getUserResponse.data.email,
        started: getUserResponse.data.started,
        verified: getUserResponse.data.verified
    }
    const accessToken = signAccessToken(accessTokenPayload);

    setRefreshCookie(res, refreshToken);
    res.status(200).json({ accessToken, user: accessTokenPayload });
})

//REFRESH TOKENS
authRoutes.post('/auth/token/refresh', async (req, res) => {
    const token = req.cookies.refresh_token;
    if (!token) return res.status(401).json({ error: 'no refresh token' });


    const payload = jwt.verify(token, JWT_REFRESH_SECRET);
    const hashedJti = crypto.createHash('sha256').update(payload.jti).digest('hex');

    const getTokenResponse = await DB.tokens.getRefreshToken(hashedJti);
    if (!getTokenResponse.status) { return res.status(401).json({ error: 'Unknown token' }); }

    if (!getTokenResponse.data || getTokenResponse.data.status !== "valid" || getTokenResponse.data.user_id !== payload.userId) {
        // Reuse or revoked -> revoke entire family
        const revokeTokenResponse = await DB.tokens.revokeRefreshToken(getTokenResponse.data.family_id);
        if (!revokeTokenResponse.status) { return res.status(401).json({ error: 'revoke token failed' }) }

        clearRefreshCookie(res);
        return res.status(401).json({ error: 'refresh reuse detected' });
    }

    // Rotate Token: set old jti to rotated and issue a new one
    const rotateTokenResponse = await DB.tokens.rotateRefreshToken(hashedJti);
    if (!rotateTokenResponse.status) { return res.status(401).json({ error: 'rotate token failed' }); }

    const newJti = uuidv4();
    const newHashedJti = crypto.createHash('sha256').update(newJti).digest('hex');
    const newRefreshPayload = { userId: getTokenResponse.data.user_id, jti: newJti, fam: getTokenResponse.data.family_id, type: 'refresh' };
    const newRefreshToken = signRefreshToken(newRefreshPayload);

    //Store refresh token in DB
    const createTokenResponse = await DB.tokens.createRefreshToken({
        hashedJti: newHashedJti,
        userId: getTokenResponse.data.user_id,
        familyId: getTokenResponse.data.family_id,
        expiresAt: Date.now() + ms(REFRESH_TOKEN_TTL)
    });

    if (!createTokenResponse.status) { return res.status(500).json({ error: 'create refresh token failed' }) }

    const getUserResponse = await DB.users.getUser({ userId: getTokenResponse.data.user_id });
    if (!getUserResponse.status) { return res.status(401).json({ error: 'user not found' }); }

    // Sign Access token
    const accessTokenPayload = {
        userId: getTokenResponse.data.user_id,
        email: getUserResponse.data.email,
        started: getUserResponse.data.started,
        verified: getUserResponse.data.verified
    }
    const accessToken = signAccessToken(accessTokenPayload);

    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken, user: accessTokenPayload });
})

//Logout User
authRoutes.post('/auth/logout', async (req, res) => {
    const token = req.cookies.refresh_token;
    if (token) {
        try {
            const payload = jwt.verify(token, JWT_REFRESH_SECRET);
            const hashedJti = crypto.createHash('sha256').update(payload.jti).digest('hex');

            const getTokenResponse = await DB.tokens.getRefreshToken(hashedJti);
            if (!getTokenResponse.status) { return res.status(401).json({ error: 'unknown token' }) }

            // Rotate Token Family: set old jti family to rotated
            const rotateTokenResponse = await DB.tokens.rotateRefreshTokenFam(getTokenResponse.data.family_id);
            if (!rotateTokenResponse.status) { return res.status(401).json({ error: 'rotate refresh token failed' }) }
        } catch {
            return res.status(500).json({ error: 'rotate refresh token failed' })
        }
    }

    clearRefreshCookie(res);
    res.sendStatus(200)
})

// Generate verification link
authRoutes.post('/auth/verification-link', verifyAccessToken, async (req, res) => {
    const userId = req.user.userId

    const getUserResponse = await DB.users.getUser({ userId });
    if (!getUserResponse.status) { return res.status(200).json({ error: 'user not found' }) }

    const userFirstName = getUserResponse.data.first_name
    const toEmail = getUserResponse.data.email
    const verificationCode = uuidv4()

    const createCodeResponse = await DB.users.updateVerificationCode({ userId, verificationCode });
    if (!createCodeResponse.status) { return res.status(400).json({ error: 'create verification code failed' }) }

    const emailDetails = {
        toEmail,
        subject: 'Account Verification Link',
        htmlBody:
            `
        <h1>${APP_NAME}</h1>
        <h2>Verify your email address</h2><br/>
        <p>Hi ${userFirstName},</p>
        <p>Welcome to ${APP_NAME}!</p>
        <p>Please click the button below to verify your email address.</p>
        <p><a href='${ORIGIN}/verify-account/${verificationCode}' 
        style='padding: 10px; background-color: orange; color: #FFF; border-radius: 5px;'>Click here</a></p>
        <p>If you did not sign up to ${APP_NAME}, please ignore this email or contact us at support@jabril.dev</p>
        `,
        textBody:
            `
        ${APP_NAME}

        Verify your email address

        Hi ${userFirstName}, 

        Welcome to ${APP_NAME}!

        Please click the link below to verify your email address.
        ${ORIGIN}/verify-account/${verificationCode}

        If you did not sign up to ${APP_NAME}, please ignore this email or contact us at support@jabril.dev
        `
    }

    const emailResponse = await sendEmail(emailDetails)
    if (!emailResponse) { return res.status(500).send({ error: 'email failed' }) }

    res.sendStatus(200)
})

// Verify Account
authRoutes.post('/auth/verify-account', async (req, res) => {
    const verificationCode = req.body.verificationCode

    const verifyResponse = await DB.users.verifyVerificationCode({ verificationCode });
    if (!verifyResponse.status) { return res.status(500).json({ error: 'verification code invalid' }) }

    const userId = verifyResponse.data.user_id

    const updateVerifiedresponse = await DB.users.updateUserVerified({ userId });
    if (!updateVerifiedresponse.status) { return res.status(500).json({ error: 'update user verified failed' }) }

    res.sendStatus(200)
})

// Email Validation Rules
const forgotPasswordEmailValidate = [
    body('email', 'Must Be an Email Address').notEmpty().isEmail().toLowerCase()
];

// Generate forgot password link
authRoutes.post('/auth/forgot-password', forgotPasswordEmailValidate, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) return res.status(400).send({ error: 'validation error' })

    const toEmail = req.body.email

    const getUserResponse = await DB.users.getUserByEmail({ email: toEmail });
    if (!getUserResponse.status) { return res.status(200).json({ error: 'user not found' }) }

    const userFirstName = getUserResponse.data.first_name
    const PasswordResetCode = uuidv4()

    const createResetResponse = await DB.users.createPasswordReset({ email: toEmail, resetCode: PasswordResetCode });
    if (!createResetResponse.status) { return res.status(400).json({ error: 'create reset code failed' }) }

    const emailDetails = {
        toEmail,
        subject: 'Password Reset Link',
        htmlBody:
            `
        <h1>${APP_NAME}</h1>
        <h2>Forgot your password?</h2><br/>
        <p>Hi ${userFirstName}, we received a request to reset your password on ${APP_NAME}</p>
        <p><a href='${ORIGIN}/reset-password/${PasswordResetCode}'>Click here</a> to reset your password. This link is only valid for one hour.</p>
        <p>If you didn't request a password change, ignore this email.</p>
        `,
        textBody:
            `
        ${APP_NAME}

        Forgot your password?

        Hi ${userFirstName}, we received a request to reset your password on ${APP_NAME}

        Click the link to reset your password. This link is only valid for one hour.
        ${ORIGIN}/reset-password/${PasswordResetCode}

        If you didn't request a password change, ignore this email.
        `
    }

    const emailResponse = await sendEmail(emailDetails)
    if (!emailResponse) { return res.status(400).json({ error: 'email failed' }) }

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

// Reset Password
authRoutes.post('/auth/reset-password', validatePassword, async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({ error: 'validation error' }) }

    const { resetCode, newPassword } = req.body

    const verifyResponse = await DB.users.verifyResetCode({ resetCode });
    if (!verifyResponse.status) { return res.status(500).json({ error: 'reset code invalid' }) }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const userDetails = {
        password: hashedPassword,
        userId: verifyResponse.data.user_id
    }

    const updatePasswordresponse = await DB.users.updateUserPassword(userDetails);
    if (updatePasswordresponse.error) { return res.status(500).json({ error: 'update user password failed' }) }

    const deleteResetCoderesponse = await DB.users.deleteResetCode(resetCode);
    if (!deleteResetCoderesponse.status) { return res.status(500).send({ error: 'delete reset code failed' }) }

    res.sendStatus(200)
})

export default authRoutes;