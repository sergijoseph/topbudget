import { Router } from "express";
import { body, validationResult } from 'express-validator'
import DB from '../db/database.js'
import { verifyAccessToken } from '../utils.js'

const categoryRoutes = Router();

const validateCategory = [
    body('name')
        .notEmpty().withMessage('Category name is empty')
        .isLength({ max: 50 }).withMessage('Category name is too long')
    ,
    body('budgetAmount')
        .notEmpty().withMessage('Budget Amount is empty')
        .isNumeric().withMessage('Budget Amount must be a number')
]

//Add a new category
categoryRoutes.post('/category', validateCategory, verifyAccessToken, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) { return res.status(400).json({ error: 'validation error' }) }

    const categoryDetails = {
        name: req.body.name,
        amount: req.body.budgetAmount,
        userId: req.user.userId
    }

    if (!req.body.started && (categoryDetails.name === 'Uncategorized' || categoryDetails.name === 'uncategorized')) { 
        return res.status(500).json({ error: 'create category failed' }) 
    }

    const response = await DB.categories.createCategory(categoryDetails);
    
    if (!response.status) {
        if (response.error) { return res.status(500).json({ error: response.error }) }

        return res.status(500).json({ error: 'create category failed' })
    }

    res.sendStatus(200)
})

//Update a category
categoryRoutes.put('/category', validateCategory, verifyAccessToken, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) { return res.status(400).json({ error: 'validation error' }) }

    const categoryDetails = {
        name: req.body.name,
        amount: req.body.budgetAmount,
        catId: req.body.catId,
        userId: req.user.userId
    }

    const response = await DB.categories.updateCategory(categoryDetails);
    if (!response.status) { return res.status(500).json({ error: 'update category failed' }) }

    res.status(200).json({ category: response.data })
})

//Delete a category
categoryRoutes.delete('/category/:catId', verifyAccessToken, async (req, res) => {
    const categoryDetails = {
        userId: req.user.userId,
        catId: req.params.catId
    }

    const checkResponse = await DB.categories.checkLastCategory(categoryDetails);
    if (!checkResponse.status) { return res.status(500).json({ error: 'delete last category failed' }) }

    const updateResponse = await DB.categories.uncategorizeTransactions(categoryDetails);
    if (!updateResponse.status) { return res.status(500).json({ error: 'delete category failed' }) }

    const deleteResponse = await DB.categories.deleteCategory(categoryDetails);
    if (!deleteResponse.status) { return res.status(500).json({ error: 'delete category failed' }) }

    res.sendStatus(200)
})

//Get list of user categories
categoryRoutes.get('/categories', verifyAccessToken, async (req, res) => {
    const categoryDetails = {
        userId: req.user.userId
    }

    const response = await DB.categories.getCategories(categoryDetails);
    if (!response.status) { return res.status(500).json({ error: 'get categories failed' }) }

    const categories = [];

    response.data.forEach(category => {
        categories.push({ catId: category.category_id, catName: category.name, catAmt: category.budget_amount })
    });

    res.status(200).json({ categories })
})

//Get an individual category
categoryRoutes.get('/category/:catId', verifyAccessToken, async (req, res) => {
    const categoryDetails = {
        userId: req.user.userId,
        catId: req.params.catId
    }

    const response = await DB.categories.getCategory(categoryDetails);
    if (!response.status) { return res.status(500).json({ error: 'get category failed' }) }

    res.status(200).json({ category: response.data })
})

//GET USER BALANCE
categoryRoutes.get('/category/balance/:catId', verifyAccessToken, async (req, res) => {
    const categoryDetails = {
        userId: req.user.userId,
        catId: req.params.catId
    }

    const response = await DB.categories.getCategoryBalance(categoryDetails);
    if (response.error) { return res.status(500).json({ error: 'get category balance failed' }) }

    res.status(200).json({ balance: response.data })
})

export default categoryRoutes;