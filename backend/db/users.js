import pool from './pool.js'
import { logError, sqlResponse } from '../utils.js';

const {
    DEFAULT_GETTING_STARTED,
    DEFAULT_VERIFIED
} = process.env;


//INSERT NEW USER INTO DATABASE
export async function createUser(userDetails) {
    let response = new sqlResponse;

    const { firstName, lastName, email, password } = userDetails;

    try {
        const [result] = await pool.query(
            `
            INSERT INTO users (first_name, last_name, email, password, started, verified)
            VALUES (?, ?, ?, ?, ${DEFAULT_GETTING_STARTED}, ${DEFAULT_VERIFIED});
            `,
            [firstName, lastName, email, password])

        if (!result.insertId) {
            logError('createUser - insert user failed: ' + JSON.stringify(userDetails))
            return response;
        } else {
            response.data = { userId: result.insertId };
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

//GET USER DETAILS FROM THE DATABASE
export async function getUser(userDetails) {
    let response = new sqlResponse;

    const { userId } = userDetails

    try {
        const [rows] = await pool.query(`SELECT 
            first_name,
            last_name,
            email,
            password,
            started,
            verified
            FROM users WHERE user_id = ?`, [userId])

        if (!rows[0]) {
            logError('getUser - user not found: ' + JSON.stringify(userDetails))
            return response;
        } else {
            response.data = rows[0];
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

//GET USER NAMES BY EMAIL FROM THE DATABASE
export async function getUserByEmail(userDetails) {
    let response = new sqlResponse;

    const { email } = userDetails

    try {
        const [rows] = await pool.query(`SELECT 
            user_id,
            first_name,
            last_name
            FROM users WHERE email = ?`, [email])

        if (!rows[0]) {
            logError('getUserByEmail - user not found: ' + JSON.stringify(userDetails))
            return response;
        } else {
            response.data = rows[0];
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

//GET USER DETAILS FROM THE DATABASE BY EMAIL
export async function checkUserExist(userDetails) {
    let response = new sqlResponse;

    const { email } = userDetails

    try {
        const [rows] = await pool.query(`SELECT 
            email
            FROM users WHERE email = ?`, [email])

        if (rows[0]) {
            response.data = true;
        } else {
            response.data = false;
        }

        response.status = true

    } catch (error) {
        logError(error)
    }

    return response;
}

//GET USER PASSWORD BY EMAIL FROM THE DATABASE
export async function getUserPassword(userDetails) {
    let response = new sqlResponse;

    const { email } = userDetails

    try {
        const [rows] = await pool.query(`SELECT 
            user_id, password
            FROM users WHERE email = ?`, [email])

        if (!rows[0]) {
            logError('getUserPassword - user password not found: ' + JSON.stringify(userDetails))
            return response;
        } else {
            response.data = rows[0];
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

//GET USER BALANCE FROM DATABASE
export async function getUserBalance(userDetails) {
    let response = new sqlResponse;
    let income = 0;
    let expense = 0;
    let balance = 0;

    const { userId } = userDetails

    //Get user total income
    try {
        const [rows] = await pool.query(
            `SELECT SUM(amount) as total_income 
            FROM transactions 
            WHERE user_id = ? 
            AND type = 'INCOME'
            AND schedule_type = 'NONE'`, [userId])

        if (!rows[0]) {
            logError('getUserBalance - user total income not found: ' + JSON.stringify(userDetails))
            return response;
        }

        income = rows[0].total_income;

    } catch (error) {
        logError(error)
        return response;
    }

    //Get user total expense
    try {
        const [rows] = await pool.query(
            `SELECT SUM(amount) as total_expense 
            FROM transactions 
            WHERE user_id = ? 
            AND type = 'EXPENSE'
            AND schedule_type = 'NONE'`, [userId])

        if (!rows[0]) {
            logError('getUserBalance - user total expense not found: ' + JSON.stringify(userDetails))
            return response;
        }

        expense = rows[0].total_expense;

    } catch (error) {
        logError(error)
        return response;
    }

    balance = income - expense;
    response.data = balance.toFixed(2);
    response.status = true

    return response;
}

//UPDATE USER IN DATABASE
export async function updateUser(userDetails) {
    let response = new sqlResponse;

    const { firstName, lastName, userId } = userDetails;

    try {
        await pool.query(
            `
            UPDATE users
            SET first_name = ?, last_name = ?
            WHERE user_id = ?
            `,
            [firstName, lastName, userId])

        response.status = true;
    } catch (error) {
        logError(error)
    }

    return response;
}

//UPDATE USER PASSWORD IN DATABASE
export async function updateUserPassword(userDetails) {
    let response = new sqlResponse;
    const { password, userId } = userDetails;

    try {
        await pool.query(
            `
            UPDATE users
            SET password = ?
            WHERE user_id = ?
            `,
            [password, userId])

        response.status = true

    } catch (error) {
        logError(error)
    }

    return response;
}

//UPDATE USER STARTED IN DATABASE
export async function updateUserStarted(userDetails) {
    let response = new sqlResponse;

    const { userId } = userDetails

    try {
        await pool.query(
            `
            UPDATE users
            SET started = 1
            WHERE user_id = ?
            `,
            [userId])

        response.status = true;

    } catch (error) {
        logError(error)
    }

    return response;
}

//UPDATE USER VERIFIED IN DATABASE
export async function updateUserVerified(userDetails) {
    let response = new sqlResponse;

    const { userId } = userDetails

    try {
        await pool.query(
            `
            UPDATE users
            SET verified = 1
            WHERE user_id = ?
            `,
            [userId])

        response.status = true;

    } catch (error) {
        logError(error)
    }

    return response;
}

//INSERT NEW PASSWORD RESET CODE INTO DATABASE
export async function createPasswordReset(userDetails) {
    let response = new sqlResponse;

    const { email, resetCode } = userDetails
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const formattedExpiresAt = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    try {
        await pool.query(
            `DELETE FROM password_reset WHERE email = ?;`,
            [email])

        const [result] = await pool.query(
            `
            INSERT INTO password_reset (email, reset_code, expires_at)
            VALUES (?, ?, ?);
            `,
            [email, resetCode, formattedExpiresAt])

        if (!result.insertId) {
            logError('createPasswordReset - insert password reset failed: ' + JSON.stringify(userDetails))
            return response;
        }

        response.status = true

    } catch (error) {
        logError(error)
    }

    return response;
}

//VERIFY RESET CODE
export async function verifyResetCode(verifyDetails) {
    let response = new sqlResponse;

    const { resetCode } = verifyDetails

    const now = new Date();
    const dateTimeNow = now.toISOString().slice(0, 19).replace('T', ' ');

    try {
        const [rows] = await pool.query(`SELECT 
            u.user_id
            FROM password_reset pr
            JOIN users u ON pr.email = u.email
            WHERE pr.reset_code = ? AND pr.expires_at > ?`, [resetCode, dateTimeNow])

        if (!rows[0]) {
            response.error = 'reset code invalid';
            logError('verifyResetCode - reset code invalid: ' + JSON.stringify(verifyDetails))
            return response;
        } else {
            response.data = rows[0];
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

//DELETE RESET CODE FROM DATABASE
export async function deleteResetCode(resetDetails) {
    let response = new sqlResponse;

    const { resetCode } = resetDetails

    try {
        await pool.query(
            `DELETE FROM password_reset WHERE reset_code = ?;`,
            [resetCode])

        response.status = true

    } catch (error) {
        logError(error)
    }

    return response;
}

//UPDATE USER VERIFICATION CODE IN DATABASE
export async function updateVerificationCode(verifyDetails) {
    let response = new sqlResponse;

    const { userId, verificationCode } = verifyDetails

    try {
        await pool.query(
            `
            UPDATE users
            SET verification_code = ?
            WHERE user_id = ?
            `,
            [verificationCode, userId])

        response.status = true

    } catch (error) {
        logError(error)
    }

    return response;
}

//VERIFY VERIFICATION CODE
export async function verifyVerificationCode(verifyDetails) {
    let response = new sqlResponse;

    const { verificationCode } = verifyDetails

    try {
        const [rows] = await pool.query(`SELECT 
            user_id
            FROM users
            WHERE verification_code = ?`, [verificationCode])

        if (!rows[0]) {
            logError('verifyVerificationCode - verification code invalid: ' + JSON.stringify(verifyDetails))
            return response;
        } else {
            response.data = rows[0]
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}