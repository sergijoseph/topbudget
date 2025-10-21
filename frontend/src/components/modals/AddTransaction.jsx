import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import queryClient from "../../utils/queryClient"
import { getCategories, getAccounts, addTransaction } from '../../utils/backend';
import { isAuthenticated } from '../../utils/auth';

import SessionExpired from '../ui/SessionExpired';
import LoadingError from '../ui/LoadingError';
import LoadingSpinner from '../ui/LoadingSpinner';

import iconCorrect from '../../assets/icon-correct-orange.png'
import iconSchedule from '../../assets/icon-clock-purple.png'

export default function AddTransaction({ appModal, modalData }) {
    const isLoggedIn = isAuthenticated()
    const isScheduled = modalData?.isScheduled || false;
    const fromCatId = modalData?.catId || '';
    const [multiCategory, setMultiCategory] = useState(false);
    const [scheduleCheck, setScheduleCheck] = useState(isScheduled);
    const [allocations, setAllocations] = useState([{ categoryId: "", amount: "" }])
    const [disableButton, setDisableButton] = useState(false);
    const navigate = useNavigate()

    const [displayScheduleType, setDisplayScheduleType] = useState('NONE')
    const [amountValue, setAmountValue] = useState('')
    const today = new Date();
    const todayFormatted = today.toLocaleDateString("en-CA");
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
    const [dateValue, setDateValue] = useState(todayFormatted)

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
        mutate: mutateAddTransaction,
        isPending: addTransactionIsPending,
        isError: addTransactionIsError,
        error: addTransactionError,
        isSuccess: addTransactionIsSuccess
    } = useMutation({
        mutationFn: addTransaction,
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

    function handleAddTransaction(event) {
        event.preventDefault();
        setDisableButton(true)
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);
        multiCategory ? data.allocations = allocations : data.allocations = [{ categoryId: data.category, amount: Number(data.amount) }];
        if (!scheduleCheck) data.schedule = 'NONE'

        mutateAddTransaction(data);
    }

    useEffect(() => {
        if (addTransactionIsError) { setDisableButton(false); }
    }, [addTransactionIsError]);

    if (!isLoggedIn) return <SessionExpired />

    if (getCategoriesIsError || getAccountsIsError) {
        return <LoadingError contHeight='200px' contWidth='350px' imgHeight="50px" />
    }

    return (
        <form onSubmit={handleAddTransaction}>
            <div className="modal-custom-content">
                <table><tbody>
                    <tr>
                        <td>
                            <div><label htmlFor="description">Description</label></div>
                            <input type="text" size="15" id='description' name='description' required />
                        </td>
                        <td>
                            <div><label htmlFor="amount">Amount</label></div>
                            <input style={{ width: '125px', textAlign: 'right' }}
                                step="0.01" min="0.00" placeholder='0.00' required
                                type="number" id='amount' name='amount'
                                value={amountValue}
                                onChange={(e) => {
                                    setAmountValue(e.target.value);
                                }}
                                onBlur={(e) => {
                                    const newValue = e.target.value ? parseFloat(e.target.value).toFixed(2) : "0.00";
                                    setAmountValue(newValue);
                                }}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td><div>
                            <label htmlFor="category">Category</label>
                            <label className='multiple-label' htmlFor="multiple">Multiple</label>
                            <input style={{ float: 'right' }} type="checkbox" id="multiple" name="multiple" value="yes"
                                onChange={handleMultiCheck}
                            />
                        </div>
                            {multiCategory ?
                                <table className='multi-cat-table'><tbody>
                                    {allocations.map((alloc, index) => (
                                        <tr key={index} className="flex gap-2">
                                            <td>
                                                <select required value={alloc.categoryId} onChange={(e) => {
                                                    const updated = [...allocations];
                                                    updated[index].categoryId = e.target.value;
                                                    setAllocations(updated);
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
                                                    const updated = [...allocations];
                                                    updated[index].amount = e.target.value;
                                                    setAllocations(updated);
                                                }}
                                                onBlur={(e) => {
                                                    const newValue = e.target.value ? parseFloat(e.target.value).toFixed(2) : "0.00";

                                                    const updated = [...allocations];
                                                    updated[index].amount = newValue;
                                                    setAllocations(updated);
                                                }}
                                            />
                                            </td>
                                        </tr>
                                    ))
                                    }
                                    <tr><td></td><td style={{ textAlign: 'center' }}>
                                        <button className="add-button-small" type="button" onClick={() => setAllocations([...allocations, { categoryId: "", amount: "" }])}>
                                            ↡
                                        </button>
                                    </td></tr>
                                </tbody>
                                </table>
                                :
                                <select id='category' name='category' defaultValue={fromCatId} required>
                                    <option value='' disabled hidden>Select Category</option>
                                    {
                                        categoriesData?.map((category, index) => (
                                            <option key={category.catId} value={category.catId}>{category.catName}</option>
                                        ))
                                    }
                                </select>
                            }
                        </td>
                        <td>
                            <div><label htmlFor="type">Type</label></div>
                            <select id='type' name='type' required style={{ width: '145px' }}>
                                <option value='expense'>Expense</option>
                                <option value='income'>Income</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><label htmlFor="account">Account</label></div>
                            <select id='account' name='account' required>
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
                                value={displayScheduleType === 'MONTHLY-EOM' ? lastDayOfMonth : dateValue}
                                readOnly={displayScheduleType === 'MONTHLY-EOM' ? true : false}
                                onChange={e => setDateValue(e.target.value)}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><label htmlFor="schedule">Schedule</label>
                                <input style={{ marginLeft: '10px' }} type="checkbox" id="scheduleCheck" name="scheduleCheck" checked={scheduleCheck}
                                    onChange={e => setScheduleCheck(e.target.checked)}
                                />
                            </div>
                            {scheduleCheck &&
                                <select id='schedule' name='schedule' required
                                    onChange={(e) => setDisplayScheduleType(e.target.value)}>
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
                {addTransactionIsPending && <LoadingSpinner small={true} />}
                {addTransactionIsSuccess && <p className='success-message'>Transaction Added</p>}
                {addTransactionIsError && <p className='error-message'>{addTransactionError.message}</p>}
                {
                    scheduleCheck
                        ? <button disabled={disableButton} title="Schedule Transaction" type="submit"><img className='modal-icons' src={iconSchedule} /></button>
                        : <button disabled={disableButton} title="Add Transaction" type="submit"><img className='modal-icons' src={iconCorrect} /></button>
                }
            </div>
        </form>

    )
}