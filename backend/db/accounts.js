import pool from './pool.js'
import { logError, sqlResponse } from '../utils.js';

//INSERT NEW ACCOUNT INTO DATABASE
export async function createAccount(accountDetails) {
    let response = new sqlResponse;

    const { name, userId } = accountDetails;

    try {
        const [rows] = await pool.query(`SELECT 
                COUNT(account_id) AS total
                FROM accounts WHERE user_id = ? AND name = ?`
            , [userId, name])

        if (rows[0].total > 0) {
            response.error = 'duplicate account name'
            return response;
        }

    } catch (error) {
        logError(error)
        return response;
    }

    try {
        const [result] = await pool.query(
            `
            INSERT INTO accounts (name, user_id )
            VALUES (?, ?);
            `,
            [name, userId])

        if (!result.insertId) {
            logError('createAccount - insert account failed: ' + JSON.stringify(accountDetails))
        } else {
            response.data = { accountId: result.insertId };
            response.status = true
        }

    } catch (error) {
        logError(error);
    }

    return response;
}

//UPDATE ACCOUNT IN DATABASE
export async function updateAccount(accountDetails) {
    let response = new sqlResponse;

    const { accountId, name, userId } = accountDetails;

    try {
        await pool.query(
            `
            UPDATE accounts
            SET name = ?
            WHERE account_id = ? AND user_id = ?
            `,
            [name, accountId, userId])


        const [rows] = await pool.query(`SELECT 
                name
                FROM accounts WHERE account_id = ?`, [accountId])

        if (!rows[0]) {
            logError('updateAccount - updated account not found: ' + JSON.stringify(accountDetails))
        } else {
            response.data = rows[0];
            response.status = true
        }

    } catch (error) {
        logError(error);
    }

    return response;
}

//GET ACCOUNTS FROM THE DATABASE
export async function getAccounts(userId) {
    let response = new sqlResponse;

    try {
        const [rows] = await pool.query(`SELECT 
            account_id,
            name
            FROM accounts WHERE user_id = ? ORDER BY name ASC`, [userId])

        if (!rows[0]) {
            logError('getAccounts - accounts not found for user: ' + userId)
        } else {
            response.data = rows;
            response.status = true
        }

    } catch (error) {
        logError(error);
    }

    return response;
}

//GET ACCOUNT DETAILS FROM THE DATABASE
export async function getAccount(accountDetails) {
    let response = new sqlResponse;

    const { userId, accountId } = accountDetails

    try {
        const [rows] = await pool.query(
            `SELECT name
            FROM accounts 
            WHERE user_id = ? AND account_id = ?`, [userId, accountId])

        if (!rows[0]) {
            logError('getAccount - account not found: ' + JSON.stringify(accountDetails))
        } else {
            response.data = rows[0];
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

//GET ACCOUNT BALANCE FROM DATABASE
export async function getAccountBalance(balanceDetails) {
    let response = new sqlResponse;
    let income = 0;
    let expense = 0;
    let balance = 0;

    const { userId, accountId } = balanceDetails

    //Get account total income
    try {
        const [rows] = await pool.query(
            `SELECT SUM(amount) as total_income 
            FROM transactions 
            WHERE user_id = ? 
            AND account_id = ?
            AND type = 'INCOME'
            AND schedule_type = 'NONE'`
            , [userId, accountId])

        if (!rows[0]) {
            logError('getAccountBalance - total income not found: ' + JSON.stringify(balanceDetails))
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
            AND account_id = ?
            AND type = 'EXPENSE'
            AND schedule_type = 'NONE'`, [userId, accountId])

        if (!rows[0]) {
            logError('getAccountBalance - total expense not found: ' + JSON.stringify(balanceDetails))
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

//DELETE ACCOUNT IN DATABASE
export async function deleteAccount(accountDetails) {
    let response = new sqlResponse;
    const { accountId, userId } = accountDetails;

    try {
        const [rows] = await pool.query(`SELECT 
                COUNT(account_id) AS total
                FROM transactions WHERE account_id = ? AND user_id = ?`
            , [accountId, userId])

        //Check if there are any transactions under this account
        if (rows[0].total > 0) {
            response.error = 'could not delete with transactions'
            return response;
        }
    } catch (error) {
        logError(error)
        response.error = 'unexpected error'
        return response;
    }

    try {
        const [rows] = await pool.query(`SELECT 
                COUNT(account_id) AS total
                FROM accounts WHERE user_id = ?`
            , [userId])

        if (rows[0].total === 1) {
            response.error = 'could not delete only account';
            return response;
        }

        await pool.query(`DELETE 
            FROM accounts
            WHERE account_id = ? AND user_id = ?
            `,
            [accountId, userId])

        response.status = true

    } catch (error) {
        logError(error)
        response.error = 'unexpected error'
        return response;
    }

    return response;
}