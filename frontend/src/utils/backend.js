import { api } from "./api";
import { authStore, clearAuth } from "../store/authStore";
import { redirect } from "react-router-dom";
import queryClient from './queryClient';

const VITE_TRANS_PER_QUERY = import.meta.env.VITE_TRANS_PER_QUERY
const VITE_SERVER_ERROR = import.meta.env.VITE_SERVER_ERROR
const VITE_CONNECTION_ERROR = import.meta.env.VITE_CONNECTION_ERROR
const VITE_UNEXPECTED_ERROR = import.meta.env.VITE_UNEXPECTED_ERROR
const VITE_NAME_LENGTH = import.meta.env.VITE_NAME_LENGTH

export async function getUser() {
    try {
        const response = await api.get('/user');
        return response.data;
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Get User balance from backend
export async function getUserBalance() {

    try {
        const response = await api.get(`/user/balance`);
        return response.data.balance;

    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Update user first name and last name
export async function updateUser({ firstName, lastName }) {

    //Throw error if first name or last name is empty
    if (!firstName || !lastName) {
        throw new Error('Please ensure all fields are filled out!')
    }

    //Throw error if first name is too long
    if (firstName.length > VITE_NAME_LENGTH) {
        throw new Error(`First name should be less than ${VITE_NAME_LENGTH} characters`);
    }

    //Throw error if last name is too long
    if (lastName.length > VITE_NAME_LENGTH) {
        throw new Error(`Last name should be less than ${VITE_NAME_LENGTH} characters`);
    }

    try {
        await api.put('/user', { firstName, lastName });
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'validation error':
                    errorMessage = 'Please enter valid information'
                    break;
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Log out user
export async function logout() {

    try {
        await api.post('/auth/logout');
    } catch {
        authStore.dispatch(clearAuth());
        queryClient.clear();
    } finally {
        authStore.dispatch(clearAuth());
        queryClient.clear();
    }

    return redirect('/');
}

//Function to change user password
export async function changePassword({ oldPassword, newPassword, newPasswordConfirm }) {

    //Throw error if any of the user fields are empty
    if (!oldPassword || !newPassword || !newPasswordConfirm) {
        throw new Error('Please ensure all fields are filled out!')
    }

    //Throw error if the new passwords don't match
    if (newPassword !== newPasswordConfirm) {
        throw new Error('Passwords do not match!')
    }

    const state = authStore.getState();
    const { email } = state.auth.user;

    try {
        await api.put('/user/password', { email, oldPassword, newPassword });

    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'validation error':
                    errorMessage = 'Please enter valid information'
                    break;
                case 'incorrect user':
                    errorMessage = 'Error: Email mismatch'
                    break;
                case 'incorrect password':
                    errorMessage = 'Old password is incorrect'
                    break;
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Create an account 
export async function addAccount({ name }) {

    //Throw error if account name is missing
    if (!name) {
        throw new Error('Account name is missing')
    }

    //Throw error if account name is too long
    if (name.length > 20) {
        throw new Error('Account name is too long')
    }

    try {
        await api.post('/account', { name });
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'validation error':
                    errorMessage = 'Please enter valid account name'
                    break;
                case 'duplicate account name':
                    errorMessage = 'This account name already exists'
                    break;
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Update an account 
export async function updateAccount({ accountId, name }) {

    //Throw error if account name is missing
    if (!name) {
        throw new Error('Account name is missing')
    }

    //Throw error if account name is too long
    if (name.length > 50) {
        throw new Error('Account name is too long')
    }

    const accountData = {
        accountId,
        name
    }

    try {
        const response = await api.put('/account', accountData);
        return response.data.account;
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'validation error':
                    errorMessage = 'Please enter valid account name'
                    break;
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Get Accounts List
export async function getAccounts() {
    try {
        const response = await api.get('/accounts');
        return response.data.accounts;
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Get individual account
export async function getAccount({ queryKey }) {
    const [, accountId] = queryKey

    try {
        const response = await api.get(`/account/${accountId}`);
        return response.data.account
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Get individual account balance
export async function getAccountBalance({ queryKey }) {
    const [, accountId] = queryKey

    try {
        const response = await api.get(`/account/balance/${accountId}`);
        return response.data.balance
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Delete an account
export async function deleteAccount(accountId) {
    try {
        await api.delete(`/account/${accountId}`);
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'could not delete with transactions':
                    errorMessage = 'You cannot delete an account with transactions'
                    break;
                case 'could not delete only account':
                    errorMessage = 'You cannot delete the only account'
                    break;
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

export async function addCategory({ name, amount }) {
    const budgetAmount = Number(amount)

    //Throw error if category name or amount is missing
    if (!name || !budgetAmount) {
        throw new Error('Category name or amount is missing')
    }

    //Throw error if category name is Uncategorized
    if (name === "Uncategorized" || name == "uncategorized") {
        throw new Error('Category name cannot be Uncategorized')
    }

    //Throw error if category amount is not a number
    if (typeof budgetAmount !== 'number') {
        throw new Error('Ensure entered amount is a number')
    }

    //Throw error if category name is too long
    if (name.length > 50) {
        throw new Error('Category name is too long')
    }

    const categoryData = {
        name,
        budgetAmount
    }

    try {
        await api.post('/category', categoryData);
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'validation error':
                    errorMessage = 'Please enter valid information'
                    break;
                case 'duplicate category name':
                    errorMessage = 'Category name already exists'
                    break;
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

export async function updateCategory({ catId, name, amount }) {
    const budgetAmount = Number(amount)

    //Throw error if category name or amount is missing
    if (!name || !budgetAmount) {
        throw new Error('Category name or amount is missing')
    }

    //Throw error if category name is Uncategorized
    if (name === "Uncategorized" || name == "uncategorized") {
        throw new Error('Category name cannot be Uncategorized')
    }

    //Throw error if category amount is not a number
    if (typeof budgetAmount !== 'number') {
        throw new Error('Ensure entered amount is a number')
    }

    //Throw error if category name is too long
    if (name.length > 50) {
        throw new Error('Category name is too long')
    }

    const categoryData = {
        catId,
        name,
        budgetAmount
    }

    try {
        const categoryResponse = await api.put('/category', categoryData);
        return categoryResponse.data.category;
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'validation error':
                    errorMessage = 'Please enter valid information'
                    break;
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Get list of categories
export async function getCategories() {
    try {
        const response = await api.get('/categories');
        return response.data.categories;
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Get Single Category Details
export async function getCategory({ queryKey }) {
    const [, catId] = queryKey

    try {
        const response = await api.get(`/category/${catId}`);
        return response.data.category;

    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Get Category Balance
export async function getCategoryBalance({ queryKey }) {
    const [, catId] = queryKey

    try {
        const response = await api.get(`/category/balance/${catId}`);
        return response.data.balance;

    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Delete a category
export async function deleteCategory(catId) {
    try {
        await api.delete(`/category/${catId}`);
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Get transactions from backend
export async function getTransactions({ pageParam = null, queryKey }) {
    const [_key, optionalCatId] = queryKey

    try {
        const response = await api.get('/transactions', {
            params: { cursor: pageParam, limit: VITE_TRANS_PER_QUERY, catId: optionalCatId }
        });

        return response.data;
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

export async function getScheduleTrans() {
    try {
        const response = await api.get('/transactions/scheduled');
        return response.data.transactions;
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Get Transaction
export async function getTransaction({ queryKey }) {
    const [, transId] = queryKey

    try {
        const response = await api.get(`/transaction/${transId}`);
        return response.data.transaction;

    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

//Add Transaction
export async function addTransaction(transData) {
    transData.amount = Number(transData.amount)
    const allocTotal = transData.allocations.reduce((sum, alloc) => sum + Number(alloc.amount), 0);

    //return error if any field is missing
    if (!transData.description ||
        !transData.amount ||
        !transData.type ||
        !transData.account ||
        !transData.date ||
        !transData.schedule) {
        throw new Error('Please ensure all fields are filled out.')
    }

    //return error if category name is too long
    if (transData.description.length > 100) {
        throw new Error('Description is too long')
    }

    //return error if category amount is not a number
    if (typeof transData.amount !== 'number') {
        throw new Error('Ensure entered amount is a number')
    }

    //return error if total amount & allocation total don't match
    if (transData.amount !== allocTotal) {
        throw new Error('Ensure category amounts are equal to total amount')
    }

    //Loop through allocations to ensure all categories are selected and amounts are entered
    let newAllocations = [];
    let checkDuplicates = [];

    for (let count = 0; count < transData.allocations.length; count++) {
        const categoryId = transData.allocations[count].categoryId;
        const amount = transData.allocations[count].amount;

        //If any category is blank throw error
        if (!categoryId) {
            throw new Error('Ensure Category is selected')
        }

        //If an amount is present add it to the new array with the categoryId
        //This array will replace the original allocations array to pass to the API
        if (amount && amount > 0.00) {
            newAllocations.push({ categoryId, amount })
        }

        //Add each categoryId to a new array to later check duplicates
        checkDuplicates.push(categoryId)
    }

    //Check allocations for duplicate category IDs
    const hasDuplicates = new Set(checkDuplicates).size !== checkDuplicates.length;

    if (hasDuplicates) {
        throw new Error('Ensure each selected category is diffferent')
    }

    transData.allocations = newAllocations;

    try {
        await api.post('/transaction', transData);
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'validation error':
                    errorMessage = 'Please enter valid information'
                    break;
                case 'amounts are not equal':
                    errorMessage = 'Ensure category amounts are equal to total amount'
                    break;
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}


//Edit Transaction
export async function editTransaction(transData) {
    transData.amount = Number(transData.amount)
    const allocTotal = transData.allocations.reduce((sum, alloc) => sum + Number(alloc.amount), 0);

    //return error if any field in empty
    if (!transData.description ||
        !transData.amount ||
        !transData.type ||
        !transData.account ||
        !transData.date ||
        !transData.schedule) {
        throw new Error('Please ensure all fields are filled out.')
    }

    //return error if category name is too long
    if (transData.description.length > 100) {
        throw new Error('Description is too long')
    }

    //return error if category amount is not a number
    if (typeof transData.amount !== 'number') {
        throw new Error('Ensure entered amount is a number')
    }

    //return error if total amount & allocation total don't match
    if (transData.amount !== allocTotal) {
        throw new Error('Ensure category amounts are equal to total amount')
    }

    //Loop through allocations to ensure all categories are selected and amounts are entered
    let newAllocations = [];
    let checkDuplicates = [];

    for (let count = 0; count < transData.allocations.length; count++) {
        const categoryId = transData.allocations[count].categoryId;
        const amount = transData.allocations[count].amount;

        //If any category is blank throw error
        if (!categoryId) {
            throw new Error('Ensure Category is selected')
        }

        //If an amount is present add it to the new array with the categoryId
        //This array will replace the original allocations array to pass to the API
        if (amount && amount > 0.00) {
            newAllocations.push({ categoryId, amount })
        }

        //Add each categoryId to a new array to later check duplicates
        checkDuplicates.push(categoryId)
    }

    //Check allocations for duplicate category IDs
    const hasDuplicates = new Set(checkDuplicates).size !== checkDuplicates.length;

    if (hasDuplicates) {
        throw new Error('Ensure each selected category is diffferent')
    }

    transData.allocations = newAllocations;

    try {
        await api.put('/transaction', transData);
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'validation error':
                    errorMessage = 'Please enter valid information'
                    break;
                case 'amounts are not equal':
                    errorMessage = 'Ensure category amounts are equal to total amount'
                    break;
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}

export async function deleteTransaction(transId) {
    try {
        await api.delete(`/transaction/${transId}`);
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            errorMessage = VITE_SERVER_ERROR;
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        throw new Error(errorMessage)
    }
}