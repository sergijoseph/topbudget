import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import queryClient from "../../utils/queryClient"
import { getAccount, getAccountBalance, updateAccount, deleteAccount } from "../../utils/backend"
import { isAuthenticated } from "../../utils/auth"

import SessionExpired from '../ui/SessionExpired';
import LoadingError from '../ui/LoadingError';
import LoadingSpinner from '../ui/LoadingSpinner';
import iconCorrect from '../../assets/icon-correct-orange.png'
import iconDelete from '../../assets/icon-delete-red.png'

export default function EditAccount({ appModal, modalData }) {
    const isLoggedIn = isAuthenticated()
    const navigate = useNavigate()
    const accountId = modalData.accountId
    const [disableButton, setDisableButton] = useState(false);

    const { data: accountData, isError: getAccountIsError } = useQuery({
        queryKey: ['getAccount', accountId],
        queryFn: getAccount,
        enabled: isLoggedIn
    });

    const { data: accountBalanceData, isError: getAccountBalanceIsError } = useQuery({
        queryKey: ['getAccountBalance', accountId],
        queryFn: getAccountBalance,
        enabled: isLoggedIn
    });

    const {
        mutate: mutateEditAccount,
        isPending: editAccountIsPending,
        isError: editAccountIsError,
        error: editAccountError,
        isSuccess: editAccountIsSuccess
    } = useMutation({
        mutationFn: updateAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getAccounts'] })
            queryClient.invalidateQueries({ queryKey: ['getAccount'] })
            queryClient.invalidateQueries({ queryKey: ['getTransactions'] })

            setTimeout(() => {
                appModal('close')
                navigate('/dashboard', { replace: true })
            }, 1000);
        }
    });

    const {
        mutate: mutateDeleteAccount,
        isPending: deleteAccountIsPending,
        isError: deleteAccountIsError,
        error: deleteAccountError,
        isSuccess: deleteAccountIsSuccess
    } = useMutation({
        mutationFn: deleteAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getAccounts'] })
            queryClient.invalidateQueries({ queryKey: ['getTransactions'] })

            setTimeout(() => {
                appModal('close')
                navigate('/dashboard', { replace: true })
            }, 1000);
        }
    });

    function handleEditAccount(event) {
        event.preventDefault();
        setDisableButton(true)
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);
        data.accountId = accountId

        mutateEditAccount(data);
    }

    function handleDeleteAccount(accountId) {
        const confirmation = confirm("Are you sure you want to delete this Account?");
        if (confirmation) {
            setDisableButton(true)
            mutateDeleteAccount(accountId)
        } else {
            return false; // Prevent the default action
        }
    }

    useEffect(() => {
        if (editAccountIsError || deleteAccountIsError) { setDisableButton(false); }
    }, [editAccountIsError, deleteAccountIsError]);

    if (!isLoggedIn) return <SessionExpired />

    if (getAccountIsError || getAccountBalanceIsError) { return <LoadingError contHeight='200px' contWidth='350px' imgHeight="50px" /> }

    const isSubmitting = editAccountIsPending || deleteAccountIsPending

    return (
        <form onSubmit={handleEditAccount}>
            <div className="modal-custom-content">
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <div><label htmlFor="name">Name</label></div>
                                <input type="text" size="15" id='name' name='name' defaultValue={accountData?.name || ''} required />
                                
                                <p>Balance: <span style={{color: accountBalanceData < 0.00 ? '#971a1a' : '#8dbfa8'}}>${accountBalanceData || ''}</span></p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="modal-footer">
                {isSubmitting && <LoadingSpinner small={true} />}

                {editAccountIsSuccess && <p className='success-message'>Account Updated</p>}
                {deleteAccountIsSuccess && <p className='success-message'>Account Deleted</p>}

                {editAccountIsError && <p className='error-message'>{editAccountError.message}</p>}
                {deleteAccountIsError && <p className='error-message'>{deleteAccountError.message}</p>}
                <button type="button" disabled={disableButton} title="Delete Account" onClick={() => { handleDeleteAccount(accountId) }}><img className='modal-icons' src={iconDelete} /></button>
                <button type="submit" disabled={disableButton} title="Update Account"><img className='modal-icons' src={iconCorrect} /></button>
            </div>
        </form>

    )
}