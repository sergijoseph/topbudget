import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import queryClient from "../../utils/queryClient"
import { getCategories, getAccounts, editTransaction, getTransaction, addTransaction, deleteTransaction } from '../../utils/backend';
import { getNextDate } from '../../utils/scheduleRules'
import { isAuthenticated } from "../../utils/auth"

import SessionExpired from '../ui/SessionExpired';
import LoadingError from '../ui/LoadingError';
import LoadingSpinner from '../ui/LoadingSpinner';

import iconDelete from '../../assets/icon-delete-red.png'
import iconCorrect from '../../assets/icon-correct-orange.png'
import iconSchedule from '../../assets/icon-clock-purple.png'

export default function EditTransaction({ appModal, modalData }) {
    const isLoggedIn = isAuthenticated();
    const [multiCategory, setMultiCategory] = useState();
    const [scheduleCheck, setScheduleCheck] = useState();
    const [transValues, setTransValues] = useState({
        description: '',
        amount: '',
        type: '',
        schedule_type: '',
        date: '',
        account_id: '',
        allocations: [{ categoryId: '', amount: '' }]
    })
    const [disableButton, setDisableButton] = useState(false);
    const navigate = useNavigate()
    const transId = modalData.transId

    const { data: transactionData, isError: getTransactionIsError } = useQuery({
        queryKey: ['getTransaction', transId],
        queryFn: getTransaction,
        enabled: isLoggedIn
    });

    useEffect(() => {
        if (transactionData) {
            setTransValues(transactionData)

            if (transactionData.allocations.length > 1) {
                setMultiCategory(true)
            }

            if (transactionData.schedule_type === 'NONE') {
                setScheduleCheck(false)
            } else {
                setScheduleCheck(true)
            }
        }

    }, [transactionData])

    const { data: categoriesData, isError: getCategoriesIsError } = useQuery({
        queryKey: ['getCategories'],
        queryFn: getCategories,
        enabled: isLoggedIn
    });

    const { data: accountsData, isError: getAccountsIsError } = useQuery({
        queryKey: ['getAccounts'],
        queryFn: getAccounts,
        enabled: isLoggedIn
    });

    const {
        mutate: mutateEditTransaction,
        isPending: editTransactionIsPending,
        isError: editTransactionIsError,
        error: editTransactionError,
        isSuccess: editTransactionIsSuccess
    } = useMutation({
        mutationFn: editTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getTransactions'] })
            queryClient.invalidateQueries({ queryKey: ['getTransaction'] })
            queryClient.invalidateQueries({ queryKey: ['getScheduleTrans'] })
            queryClient.invalidateQueries({ queryKey: ['getUserBalance'] })
            queryClient.invalidateQueries({ queryKey: ['getCategoryBalance'] })

            setTimeout(() => {
                appModal('close')
                navigate('dashboard', { replace: true })
            }, 1000);
        }
    });

    const {
        mutate: mutateAddTransaction,
        isPending: addTransactionIsPending,
        isError: addTransactionIsError,
        error: addTransactionError
    } = useMutation({
        mutationFn: addTransaction
    });

    const {
        mutate: mutateDeleteTransaction,
        isPending: deleteTransactionIsPending,
        isError: deleteTransactionIsError,
        error: deleteTransactionError,
        isSuccess: deleteTransactionIsSuccess
    } = useMutation({
        mutationFn: deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getTransactions'] })
            queryClient.invalidateQueries({ queryKey: ['getScheduleTrans'] })
            queryClient.invalidateQueries({ queryKey: ['getUserBalance'] })
            queryClient.invalidateQueries({ queryKey: ['getCategoryBalance'] })

            setTimeout(() => {
                appModal('close')
                navigate('dashboard', { replace: true })
            }, 1000);
        }
    });

    function handleMultiCheck(event) {
        setMultiCategory(event.target.checked)
    }

    function handleEditTransaction(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);
        multiCategory ? data.allocations = transValues.allocations : data.allocations = [{ categoryId: data.category, amount: Number(data.amount) }];
        if (!scheduleCheck) data.schedule = 'NONE'
        data.transId = transId

        mutateEditTransaction(data);
    }

    function handleAddTransaction(transData) {
        setDisableButton(true)
        //Format data to JSON Object for add transaction
        const addData = {
            description: transData.description,
            amount: transData.amount,
            type: transData.type,
            account: transData.account_id,
            date: transData.date,
            schedule: 'NONE',
            allocations: transData.allocations
        }
        
        //This ensures that if the amount changes for a transaction with a single category it is updated in the allocations
        //Without this if the amount changes there would be a mismatch in the amount field and the allocations amount
        if (!multiCategory) addData.allocations = [{ categoryId: addData.allocations[0].categoryId, amount: Number(addData.amount) }];

        mutateAddTransaction(addData);

        //Copy data to JSON Object for edit transaction
        //Using this method to avoid updating data object before mutation runs
        const editData = { ...addData }
        editData.date = getNextDate(transData.date, transData.schedule_type);
        editData.schedule = transData.schedule_type
        editData.transId = transId

        mutateEditTransaction(editData);
    }

    function handleDeleteTransaction() {
        const confirmation = confirm("Are you sure you want to delete this transaction?");
        if (confirmation) {
            setDisableButton(true)
            mutateDeleteTransaction(transId)
        } else {
            return false; // Prevent the default action
        }
    }

    useEffect(() => {
        if (editTransactionIsError || deleteTransactionIsError) { setDisableButton(false); }
    }, [editTransactionIsError, deleteTransactionIsError]);

    if (!isLoggedIn) return <SessionExpired />

    if (getTransactionIsError || getCategoriesIsError || getAccountsIsError) {
        return <LoadingError contHeight='200px' contWidth='350px' imgHeight="50px" />
    }

    const isSubmitting = addTransactionIsPending || editTransactionIsPending || deleteTransactionIsPending

    return (
        <form onSubmit={handleEditTransaction}>
            <div className="modal-custom-content" style={{ minHeight: '200px', minWidth: '300px' }}>
                <table><tbody>
                    <tr>
                        <td>
                            <div><label htmlFor="description">Description</label></div>
                            <input type="text" size="15" id='description' name='description' required
                                value={transValues.description}
                                onChange={e => setTransValues({ ...transValues, description: e.target.value })}
                            />
                        </td>
                        <td>
                            <div><label htmlFor="amount">Amount</label></div>
                            <input style={{ width: '125px', textAlign: 'right' }}
                                step="0.01" min="0.00" placeholder='0.00' required
                                type="number" id='amount' name='amount'
                                value={transValues.amount}
                                onChange={(e) => {
                                    setTransValues({ ...transValues, amount: e.target.value })
                                }}
                                onBlur={(e) => {
                                    const newValue = e.target.value ? parseFloat(e.target.value).toFixed(2) : "0.00";
                                    setTransValues({ ...transValues, amount: newValue })
                                }}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td><div>
                            <label htmlFor="category">Category</label>
                            <label className='multiple-label' htmlFor="multiple">Multiple</label>
                            <input style={{ float: 'right' }} type="checkbox" id="multiple" name="multiple" checked={multiCategory ? "checked" : ''}
                                onChange={handleMultiCheck}
                            />
                        </div>
                            {multiCategory ?
                                <table className='multi-cat-table'><tbody>
                                    {transValues.allocations.map((alloc, index) => (
                                        <tr key={index} className="flex gap-2">
                                            <td>
                                                <select required value={alloc.categoryId}
                                                    onChange={(e) => {
                                                        const updated = [...transValues.allocations];
                                                        updated[index].categoryId = e.target.value;
                                                        setTransValues({ ...transValues, allocations: updated });
                                                    }}>
                                                    <option value='' disabled hidden>Select Category</option>
                                                    {categoriesData?.map(category => (
                                                        <option key={category.catId} value={category.catId}>{category.catName}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td><input
                                                type="number"
                                                value={alloc.amount}
                                                step="0.01" min="0.00" placeholder='0.00'
                                                onChange={(e) => {
                                                    const updated = [...transValues.allocations];
                                                    updated[index].amount = e.target.value;
                                                    setTransValues({ ...transValues, allocations: updated });
                                                }}
                                                onBlur={(e) => {
                                                    const newValue = e.target.value ? parseFloat(e.target.value).toFixed(2) : "0.00";

                                                    const updated = [...transValues.allocations];
                                                    updated[index].amount = newValue;
                                                    setTransValues({ ...transValues, allocations: updated });
                                                }}
                                            />
                                            </td>
                                        </tr>
                                    ))
                                    }
                                    <tr><td></td><td style={{ textAlign: 'center' }}>
                                        <button className="add-button-small" type="button"
                                            onClick={() => {
                                                const newCat = [...transValues.allocations];
                                                newCat.push({ categoryId: "", amount: "" })

                                                setTransValues({ ...transValues, allocations: newCat });
                                            }}>
                                            ↡
                                        </button>
                                    </td></tr>
                                </tbody>
                                </table>
                                :
                                <select id='category' name='category' required
                                    value={transValues.allocations[0].categoryId}
                                    onChange={e => setTransValues({ ...transValues, allocations: [{ categoryId: e.target.value }] })}
                                >
                                    <option value='' disabled hidden></option>
                                    {categoriesData?.map((category, index) => (
                                        <option key={category.catId} value={category.catId}>{category.catName}</option>
                                    ))}
                                </select>
                            }
                        </td>
                        <td>
                            <div><label htmlFor="type">Type</label></div>
                            <select id='type' name='type' required
                                value={transValues.type}
                                onChange={e => setTransValues({ ...transValues, type: e.target.value })}
                                style={{ width: '145px' }}>
                                <option value='' disabled hidden></option>
                                <option value='EXPENSE'>Expense</option>
                                <option value='INCOME'>Income</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><label htmlFor="account">Account</label></div>
                            <select id='account' name='account' required
                                value={transValues.account_id}
                                onChange={e => setTransValues({ ...transValues, account_id: e.target.value })}
                            >
                                <option value='' disabled hidden></option>
                                {
                                    accountsData?.map((account, index) => (
                                        <option key={account.accountId} value={account.accountId}>{account.accountName}</option>
                                    ))
                                }
                            </select>
                        </td>
                        <td>
                            <div><label htmlFor="date">Date</label></div>
                            <input type="date" size="12" id='date' name='date' required
                                readOnly={transValues.schedule_type === 'MONTHLY-EOM' ? true : false}
                                value={transValues.date}
                                onChange={e => setTransValues({ ...transValues, date: e.target.value })}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><label htmlFor="scheduleCheck">Schedule</label>
                                <input style={{ marginLeft: '10px' }} type="checkbox" id="scheduleCheck" name="scheduleCheck" checked={scheduleCheck ? 'checked' : ''}
                                    disabled
                                />
                            </div>
                            {scheduleCheck &&
                                <select id='schedule' name='schedule' required
                                    value={transValues.schedule_type}
                                    onChange={(e) => {
                                        setTransValues({ ...transValues, schedule_type: e.target.value })
                                    }}>
                                    <option value='MONTHLY-SD'>Monthly - Same Day</option>
                                    <option value='MONTHLY-EOM'>Last day of every month</option>
                                    <option value='WEEKLY'>Weekly</option>
                                </select>}
                        </td>
                    </tr>
                </tbody>
                </table>
            </div>
            <div className="modal-footer">
                {isSubmitting && <LoadingSpinner small={true} />}

                {addTransactionIsError && <p className='error-message'>{addTransactionError.message}</p>}
                {editTransactionIsError && <p className='error-message'>{editTransactionError.message}</p>}
                {deleteTransactionIsError && <p className='error-message'>{deleteTransactionError.message}</p>}

                {editTransactionIsSuccess && <p className='success-message'>Transaction Updated</p>}
                {deleteTransactionIsSuccess && <p className='success-message'>Transaction Deleted</p>}
                <button type="button" title="Delete Transaction" onClick={handleDeleteTransaction}><img className='modal-icons' src={iconDelete} /></button>
                {
                    transValues.schedule_type === 'NONE'
                        ? <button type="submit" disabled={disableButton} title="Update Transaction"><img className='modal-icons' src={iconCorrect} /></button>
                        :
                        <>
                            <button type="submit" disabled={disableButton} title="Re-schedule Transaction"><img className='modal-icons' src={iconSchedule} /></button>
                            <button type="button" disabled={disableButton} title="Add Transaction" onClick={() => handleAddTransaction(transValues)}><img className='modal-icons' src={iconCorrect} /></button>
                        </>
                }
            </div>
        </form>
    )
}