import { Router } from "express";
import { body, validationResult } from 'express-validator'
import DB from '../db/database.js'
import { verifyAccessToken } from '../utils.js'

const accountRoutes = Router();

const validateAccount = [
    body('name')
        .notEmpty().withMessage('Account name is empty')
        .isLength({ max: 50 }).withMessage('Account name is too long')
]

//Create Account
accountRoutes.post('/account', validateAccount, verifyAccessToken, async (req, res) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({ error: 'validation error' }) }

    const accountDetails = {
        name: req.body.name,
        userId: req.user.userId
    }

    const response = await DB.accounts.createAccount(accountDetails);
    if (!response.status) {
        if (response.error) { return res.status(500).json({ error: response.error }) }
        
        return res.status(500).json({ error: 'create account failed' })
    }

    res.sendStatus(200)
})

//Update an Account
accountRoutes.put('/account', validateAccount, verifyAccessToken, async (req, res) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({ error: 'validation error' }) }

    const accountDetails = {
        accountId: req.body.accountId,
        name: req.body.name,
        userId: req.user.userId
    }

    const response = await DB.accounts.updateAccount(accountDetails);
    if (!response.status) {return res.status(500).json({ error: 'update account failed' })}

    res.status(200).json({ account: response.data })
})

//Get list of user accounts
accountRoutes.get('/accounts', verifyAccessToken, async (req, res) => {
    const userId = req.user.userId

    const response = await DB.accounts.getAccounts(userId);
    if (!response.status) {return res.status(500).json({ error: 'get accounts failed' })}

    const accounts = [];

    response.data.forEach(account => {
        accounts.push({ accountId: account.account_id, accountName: account.name })
    });

    res.status(200).json({ accounts })
})

//Get individual account
accountRoutes.get('/account/:accountId', verifyAccessToken, async (req, res) => {
    const getAccountDetails = {
        accountId: req.params.accountId,
        userId: req.user.userId
    }

    const response = await DB.accounts.getAccount(getAccountDetails);
    if (!response.status) {return res.status(500).json({ error: 'get account failed' })}

    res.status(200).json({ account: response.data })
})

//Get individual account balance
accountRoutes.get('/account/balance/:accountId', verifyAccessToken, async (req, res) => {
    const getBalanceDetails = {
        accountId: req.params.accountId,
        userId: req.user.userId
    }

    const response = await DB.accounts.getAccountBalance(getBalanceDetails);
    if (!response.status) {return res.status(500).json({ error: 'get account balance failed' })}

    res.status(200).json({ balance: response.data })
})

//Delete an Account
accountRoutes.delete('/account/:accountId', verifyAccessToken, async (req, res) => {
    const accountDetails = {
        accountId: req.params.accountId,
        userId: req.user.userId
    }

    const response = await DB.accounts.deleteAccount(accountDetails);
    if (!response.status) {return res.status(500).json({ error: response.error })} 

    res.sendStatus(200)
})

export default accountRoutes;