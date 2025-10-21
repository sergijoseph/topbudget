import { Router } from 'express'
import DB from '../db/database.js'
import { body, validationResult } from 'express-validator'
import { verifyAccessToken } from '../utils.js'

const transactionRoutes = Router();

const validateTransaction = [
    body('description')
        .notEmpty().withMessage('Transaction description is empty')
        .isLength({ max: 100 }).withMessage('Transaction description is too long')
    ,
    body('amount')
        .notEmpty().withMessage('Transaction amount is empty')
        .isNumeric().withMessage('Transaction amount must be a number')
    ,
    body('account')
        .notEmpty().withMessage('Transaction account ID is empty')
        .isNumeric().withMessage('Transaction account ID must be a number')
    ,
    body('date')
        .notEmpty().withMessage('Transaction date is empty')
    ,
    body('schedule')
        .notEmpty().withMessage('Schedule type is empty')
    ,
    body('type')
        .notEmpty().withMessage('Transaction type is empty')
]

//Add a new transaction
transactionRoutes.post('/transaction', validateTransaction, verifyAccessToken, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) { return res.status(400).json({ error: 'validation error' }) }

    const transactionDetails = { ...req.body }
    transactionDetails.userId = req.user.userId

    //Verify total amount & category allocations matchup first
    const allocTotal = transactionDetails.allocations.reduce((sum, alloc) => sum + Number(alloc.amount), 0);

    if (transactionDetails.amount !== allocTotal) {
        return res.status(500).json({ error: 'amounts are not equal' })
    }

    const response = await DB.transactions.createTransaction(transactionDetails);
    if (!response.status) { return res.status(500).json({ error: 'create transaction failed' }) }

    res.sendStatus(200)

})

//Update a transaction
transactionRoutes.put('/transaction', validateTransaction, verifyAccessToken, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) { return res.status(400).json({ error: 'validation error' }) }

    const transactionDetails = { ...req.body }
    transactionDetails.userId = req.user.userId

    //Verify total amount & category allocations matchup first
    const allocTotal = transactionDetails.allocations.reduce((sum, alloc) => sum + Number(alloc.amount), 0);

    if (transactionDetails.amount !== allocTotal) {
        return res.status(500).json({ error: 'amounts are not equal' })
    }

    const response = await DB.transactions.updateTransaction(transactionDetails);
    if (!response.status) { return res.status(500).json({ error: 'update transaction failed' }) }

    res.sendStatus(200)
})

//Get list of user transactions
transactionRoutes.get('/transactions', verifyAccessToken, async (req, res) => {
    const limit = parseInt(req.query.limit) || 50

    const transactionDetails = {
        userId: req.user.userId,
        cursor: req.query.cursor,
        limit,
        catId: req.query.catId
    }

    const response = await DB.transactions.getTransactions(transactionDetails);
    if (!response.status) { return res.status(500).json({ error: 'get transactions failed' }) }

    // new cursor = created_at of the last row we got
    let nextCursor = {}
    nextCursor.date = response.data.length > 0 ? response.data[response.data.length - 1].date : null
    nextCursor.id = response.data.length > 0 ? response.data[response.data.length - 1].transaction_id : null

    res.status(200).json({
        transactions: response.data,
        nextCursor,
        hasMore: response.data.length === limit
    })
})

//Get an individual transaction
transactionRoutes.get('/transaction/:transId', verifyAccessToken, async (req, res) => {
    const transactionDetails = {
        transId: req.params.transId
    }

    const response = await DB.transactions.getTransaction(transactionDetails);
    if (!response.status) { return res.status(500).json({ error: 'get transaction failed' }) }

    res.status(200).json({ transaction: response.data })
})

//Get scheduled transactions
transactionRoutes.get('/transactions/scheduled', verifyAccessToken, async (req, res) => {
    const transactionDetails = {
        userId: req.user.userId
    }

    const response = await DB.transactions.getScheduleTrans(transactionDetails);
    if (!response.status) { return res.status(500).json({ error: 'get scheduled transactions failed' }) }

    const transactions = [];

    response.data.forEach(transaction => {
        transactions.push({
            transId: transaction.transaction_id,
            transName: transaction.description,
            transCategory: transaction.category_name,
            transDate: transaction.date,
            transAmt: transaction.amount
        })
    });

    res.status(200).json({ transactions })
})

//Delete a transaction
transactionRoutes.delete('/transaction/:transId', verifyAccessToken, async (req, res) => {
    const transactionDetails = {
        userId: req.user.userId,
        transId: req.params.transId
    }

    const response = await DB.transactions.deleteTransaction(transactionDetails);
    if (!response.status) { return res.status(500).json({ error: 'delete transaction failed' }) }

    res.sendStatus(200)
})

export default transactionRoutes;