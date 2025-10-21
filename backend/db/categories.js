import pool from './pool.js'
import { logError, sqlResponse } from '../utils.js';

//INSERT NEW CATEGORY INTO DATABASE
export async function createCategory(categoryDetails) {
    let response = new sqlResponse;

    const { name, amount, userId } = categoryDetails;

    try {
        const [rows] = await pool.query(`SELECT 
                COUNT(category_id) AS total
                FROM categories WHERE user_id = ? AND name = ?`
            , [userId, name])

        if (rows[0].total > 0) {
            response.error = 'duplicate category name'
            return response;
        }

    } catch (error) {
        logError(error)
        return response;
    }

    try {
        const [result] = await pool.query(
            `
            INSERT INTO categories (name, budget_amount, user_id)
            VALUES (?, ?, ?);
            `,
            [name, amount, userId])

        if (!result.insertId) {
            logError('createCategory - insert category failed: ' + JSON.stringify(categoryDetails))
        } else {
            response.data = { categoryId: result.insertId };
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

//UPDATE CATEGORY IN DATABASE
export async function updateCategory(categoryDetails) {
    let response = new sqlResponse;

    const { name, amount, catId, userId } = categoryDetails;

    try {
        await pool.query(
            `
            UPDATE categories
            SET name = ?, budget_amount = ?
            WHERE category_id = ? AND user_id = ?
            `,
            [name, amount, catId, userId])


        const [rows] = await pool.query(`SELECT 
                name,
                budget_amount
                FROM categories WHERE category_id = ?`, [catId])

        if (!rows[0]) {
            logError('updateCategory - category not found: ' + JSON.stringify(categoryDetails))
        } else {
            response.data = rows[0];
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

export async function checkLastCategory(categoryDetails) {
    let response = new sqlResponse;

    const { userId } = categoryDetails

    try {
        const [rows] = await pool.query(`SELECT 
                COUNT(category_id) AS total
                FROM categories WHERE user_id = ?`
            , [userId])

        if (rows[0].total === 1) {
            return response;
        }

        response.status = true

    } catch (error) {
        logError(error)
        return response;
    }

    return response;
}

//UPDATE ALL TRANSACTIONS IN THIS CATEGORY TO UNCATEGORIZED CATEGORY IN DATABASE
export async function uncategorizeTransactions(categoryDetails) {
    let response = new sqlResponse;
    let uncatId = null;
    const { userId, catId: deleteCatId } = categoryDetails;

    try {
        const [rows] = await pool.query(`SELECT 
            category_id
            FROM categories WHERE name = 'Uncategorized' AND user_id = ?`, [userId])

        if (!rows[0]) {
            logError('uncategorizeTransactions - Uncategorize not found: ' + JSON.stringify(categoryDetails))
            return response;
        }

        uncatId = rows[0].category_id;

        if (deleteCatId == uncatId) {
            logError('uncategorizeTransactions - Cannot delete Uncategorized: ' + JSON.stringify(categoryDetails))
            return response;
        }

    } catch (error) {
        logError(error)
        return response;
    }

    try {
        await pool.query(
            `
            UPDATE transaction_allocations
            SET category_id = ?
            WHERE category_id = ?
            `,
            [uncatId, deleteCatId])

        response.status = true;
    } catch (error) {
        logError(error)
    }

    return response;
}

//DELETE CATEGORY FROM DATABASE
export async function deleteCategory(categoryDetails) {
    let response = new sqlResponse;

    const { catId, userId } = categoryDetails

    try {
        await pool.query(
            `
            DELETE FROM categories
            WHERE category_id = ? AND user_id = ?
            `, [catId, userId])

        response.status = true;
    } catch (error) {
        logError(error)
    }

    return response;
}

//GET CATEGORIES FROM THE DATABASE
export async function getCategories(categoryDetails) {
    let response = new sqlResponse;

    const { userId } = categoryDetails

    try {
        const [rows] = await pool.query(`SELECT 
            category_id,
            name,
            budget_amount
            FROM categories WHERE user_id = ? ORDER BY name ASC`, [userId])

        if (!rows[0]) {
            logError('getCategories - user categories not found: ' + JSON.stringify(categoryDetails))
        } else {
            response.data = rows;
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

//GET CATEGORY DETAILS FROM THE DATABASE
export async function getCategory(categoryDetails) {
    let response = new sqlResponse;

    const { catId, userId } = categoryDetails

    try {
        const [rows] = await pool.query(`SELECT 
            name,
            budget_amount
            FROM categories WHERE category_id = ? AND user_id = ?`, [catId, userId])

        if (!rows[0]) {
            logError('getCategory - category not found: ' + JSON.stringify(categoryDetails))
        } else {
            response.data = rows[0];
            response.status = true
        }

    } catch (error) {
        logError(err)
    }

    return response;
}


//GET CATEGORY BALANCE FROM DATABASE
export async function getCategoryBalance(categoryDetails) {
    let response = new sqlResponse;
    let income = 0;
    let expense = 0;
    let balance = 0;

    const { catId, userId } = categoryDetails

    //Get category total income
    try {
        const [rows] = await pool.query(
            `SELECT SUM(ta.amount) as total_income 
            FROM transaction_allocations ta
            JOIN transactions t ON ta.transaction_id = t.transaction_id
            WHERE t.user_id = ? 
            AND ta.category_id = ?
            AND t.type = 'INCOME'
            AND t.schedule_type = 'NONE'`, [userId, catId])

        if (!rows[0]) {
            logError('getCategoryBalance - Category total income not found: ' + JSON.stringify(categoryDetails))
            return response;
        }

        income = rows[0].total_income;

    } catch (error) {
        logError(error)
        return response;
    }

    //Get category total expense
    try {
        const [rows] = await pool.query(
            `SELECT SUM(ta.amount) as total_expense 
            FROM transaction_allocations ta
            JOIN transactions t ON ta.transaction_id = t.transaction_id
            WHERE t.user_id = ? 
            AND ta.category_id = ?
            AND t.type = 'EXPENSE'
            AND t.schedule_type = 'NONE'`, [userId, catId])

        if (!rows[0]) {
            logError('getCategoryBalance - Category total expense not found: ' + JSON.stringify(categoryDetails))
            return response;
        }

        expense = rows[0].total_expense;

    } catch (error) {
        logError(error)
        return response;
    }

    balance = income - expense;
    response.data = Number(balance).toFixed(2);
    response.status = true

    return response;
}