import pool from './pool.js'
import { logError, sqlResponse } from '../utils.js';

//INSERT NEW TRANSACTION INTO DATABASE
export async function createTransaction(transactionDetails) {
    let response = new sqlResponse;

    const { description, amount, type, schedule, date, account, userId, allocations } = transactionDetails;
    let transactionId = null;

    try {
        const [result] = await pool.query(
            `
            INSERT INTO transactions (description, amount, type, schedule_type, date, account_id, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?);
            `,
            [description, amount, type, schedule, date, account, userId])

        if (!result.insertId) {
            logError('createTransaction - insert transaction failed: ' + JSON.stringify(transactionDetails))
            return response;
        }

        transactionId = result.insertId;

    } catch (error) {
        logError(error)
        return response;
    }

    for (let count = 0; count < allocations.length; count++) {

        const categoryId = allocations[count].categoryId;
        const amount = allocations[count].amount;

        if (categoryId && amount) {
            try {
                await pool.query(
                    `
            INSERT INTO transaction_allocations (transaction_id, category_id, amount)
            VALUES (?, ?, ?);
            `,
                    [transactionId, categoryId, amount])

            } catch (error) {
                logError(error)
                return response;
            }
        }
    }

    response.status = true;

    return response;
}

//UPDATE A TRANSACTION IN THE DATABASE
export async function updateTransaction(transactionDetails) {
    let response = new sqlResponse;

    const { description, amount, type, schedule, date, account, userId, allocations, transId } = transactionDetails;

    try {
        await pool.query(
            `
            UPDATE transactions 
            SET description = ?, 
            amount = ?, 
            type = ?, 
            schedule_type = ?, 
            date = ?, 
            account_id = ?
            WHERE user_id = ? AND transaction_id = ?
            `,
            [description, amount, type, schedule, date, account, userId, transId])


        await pool.query(
            `
            DELETE FROM transaction_allocations
            WHERE transaction_id = ?
            `, [transId])

    } catch (error) {
        logError(error)
        return response;
    }

    for (let count = 0; count < allocations.length; count++) {

        const categoryId = allocations[count].categoryId;
        const amount = allocations[count].amount;

        if (categoryId && amount) {
            try {
                await pool.query(
                    `
            INSERT INTO transaction_allocations (transaction_id, category_id, amount)
            VALUES (?, ?, ?);
            `,
                    [transId, categoryId, amount])

            } catch (error) {
                logError(error)
                return response;
            }
        }
    }

    response.status = true;

    return response;
}


//GET TRANSACTIONS FROM THE DATABASE
export async function getTransactions(transactionDetails) {
    let response = new sqlResponse;

    const { userId, limit, cursor, catId } = transactionDetails
    const includeCatId = catId !== '' ? `AND t.category_id = ${catId}` : ``;

    let transQuery = '';
    let queryParams = [];

    //No cursor and category, meaning first page of all transactions list
    if (!cursor && catId === '') {
        transQuery = `SELECT   
                t.transaction_id,
                t.amount,
                t.description,
                t.date,
                a.name AS account_name,
                CASE 
                    WHEN COUNT(DISTINCT c.category_id) = 1 
                        THEN MAX(c.name) 
                    ELSE 'Multiple' 
                END AS category_name,
                t.type
                FROM transactions t
                JOIN transaction_allocations ta ON ta.transaction_id = t.transaction_id
                JOIN categories c ON ta.category_id = c.category_id
                JOIN accounts a ON t.account_id  = a.account_id
                WHERE t.user_id = ? AND t.schedule_type = 'NONE'
                GROUP BY t.transaction_id, t.amount, t.description, t.date, a.name
                ORDER BY t.date DESC, t.transaction_id DESC LIMIT ?`;

        queryParams = [userId, limit];
    }
    //No cursor and category exist, meaning first page of all transactions in a category
    else if (!cursor && catId) {
        transQuery = `SELECT t.transaction_id, ta.amount, t.description, t.date, c.name AS category_name, a.name AS account_name, t.type
                FROM transaction_allocations ta 
                JOIN transactions t ON ta.transaction_id = t.transaction_id
                JOIN categories c ON ta.category_id = c.category_id
                JOIN accounts a ON t.account_id = a.account_id
                WHERE t.user_id = ?
                AND ta.category_id = ?
                AND t.schedule_type = 'NONE'
                ORDER BY t.date DESC, t.transaction_id DESC LIMIT ?`;

        queryParams = [userId, catId, limit]
    }
    //Cursor provided and no category, meaning 2nd or more pages of all transactions list
    else if (cursor && catId === '') {
        const cursorDate = cursor.date.replace("T", " ").replace(".000Z", "")
        const cursorId = cursor.id;

        transQuery = `SELECT   
                t.transaction_id,
                t.amount,
                t.description,
                t.date,
                a.name AS account_name,
                CASE 
                    WHEN COUNT(DISTINCT c.category_id) = 1 
                        THEN MAX(c.name) 
                    ELSE 'Multiple' 
                END AS category_name,
                t.type 
                FROM transactions t
                JOIN transaction_allocations ta ON t.transaction_id = ta.transaction_id
                JOIN categories c ON ta.category_id = c.category_id
                JOIN accounts a ON t.account_id = a.account_id
                WHERE t.user_id = ? 
                AND t.schedule_type = 'NONE'
                AND (t.date < ? OR (t.date = ? AND t.transaction_id < ?))
                GROUP BY t.transaction_id, t.amount, t.description, t.date, a.name
                ORDER BY t.date DESC, t.transaction_id DESC LIMIT ?`;

        queryParams = [userId, cursorDate, cursorDate, cursorId, limit]
    }
    //Cursor and category ID provided, meaning 2nd or more pages of all transactions in a category
    else if (cursor && catId) {
        const cursorDate = cursor.date.replace("T", " ").replace(".000Z", "")
        const cursorId = cursor.id;

        transQuery = `SELECT t.transaction_id, ta.amount, t.description, t.date, c.name AS category_name, a.name AS account_name, t.type
                FROM transaction_allocations ta 
                JOIN transactions t ON ta.transaction_id = t.transaction_id
                JOIN categories c ON ta.category_id = c.category_id
                JOIN accounts a ON t.account_id = a.account_id
                WHERE t.user_id = ?
                AND ta.category_id = ?
                AND t.schedule_type = 'NONE'
                AND (t.date < ? OR (t.date = ? AND t.transaction_id < ?))
                ORDER BY t.date DESC, t.transaction_id DESC LIMIT ?`;

        queryParams = [userId, catId, cursorDate, cursorDate, cursorId, limit]
    }

    try {
        const [rows] = await pool.query(transQuery, queryParams)

        response.data = rows;
        response.status = true;
    } catch (error) {
        logError(error)
    }

    return response;
}

//GET SCHEDULED TRANSACTIONS FROM THE DATABASE
export async function getScheduleTrans(transactionDetails) {
    let response = new sqlResponse;
    const { userId } = transactionDetails

    try {
        const [rows] = await pool.query(`SELECT   
            t.transaction_id,
            t.description,
            t.amount,
            t.date,
            CASE 
                WHEN COUNT(DISTINCT c.category_id) = 1 
                    THEN MAX(c.name) 
                ELSE 'Multiple' 
            END AS category_name 
            FROM transactions t
            JOIN transaction_allocations ta ON t.transaction_id = ta.transaction_id
            JOIN categories c ON ta.category_id = c.category_id
            WHERE t.user_id = ?
            AND t.schedule_type != 'NONE'
            GROUP BY t.transaction_id, t.amount, t.description, t.date
            ORDER BY t.date ASC; `
            , [userId])

        if (!rows[0]) {
            response.data = [];
        } else {
            response.data = rows;
        }

        response.status = true

    } catch (error) {
        logError(error)
    }

    return response;
}

//GET TRANSACTION DETAILS FROM THE DATABASE
export async function getTransaction(transactionDetails) {
    let response = new sqlResponse;

    const { transId } = transactionDetails

    try {
        const [rows] = await pool.query(`SELECT 
            description,
            amount,
            type,
            schedule_type,
            date,
            account_id
            FROM transactions 
            WHERE transaction_id = ?`
            , [transId])

        if (!rows[0]) {
            logError('getTransaction - transaction not found: ' + JSON.stringify(transactionDetails))
            return response;
        } else {
            response.data = rows[0];
            response.status = true
        }

    } catch (error) {
        logError(error)
        return response
    }

    try {
        const [rows] = await pool.query(`SELECT 
            ta.category_id AS categoryId, 
            c.name, 
            ta.amount 
            FROM transaction_allocations ta 
            JOIN categories c ON ta.category_id = c.category_id 
            WHERE ta.transaction_id = ?`
            , [transId])

        if (!rows[0]) {
            logError('getTransaction - transaction allocations not found: ' + JSON.stringify(transactionDetails))
            return response;
        } else {
            response.data.allocations = rows;
            response.status = true
        }
    } catch (error) {
        logError(error)
    }

    return response;
}

//DELETE TRANSACTION FROM DATABASE
export async function deleteTransaction(transactionDetails) {
    let response = new sqlResponse;

    const { transId, userId } = transactionDetails

    try {

        //Run this to find the transaction first using the transaction ID and userID
        const [rows] = await pool.query(
            `
            SELECT 
            transaction_id
            FROM transactions 
            WHERE transaction_id = ? AND user_id = ?`
            , [transId, userId])

        if (!rows[0]) {
            logError('deleteTransaction - Transaction not found: ' + JSON.stringify(transactionDetails))
            return response;
        } else {
            await pool.query(
                `
            DELETE FROM transaction_allocations
            WHERE transaction_id = ? 
            `, [transId])

            await pool.query(
                `
            DELETE FROM transactions
            WHERE transaction_id = ? AND user_id = ?
            `, [transId, userId])

            response.status = true;
        }
    } catch (error) {
        logError(error)
    }

    return response;
}