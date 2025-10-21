import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import queryClient from "../../utils/queryClient"
import { addAccount } from "../../utils/backend"
import { isAuthenticated } from '../../utils/auth';

import SessionExpired from '../ui/SessionExpired';
import LoadingSpinner from "../ui/LoadingSpinner"
import iconCorrect from '../../assets/icon-correct-orange.png'

export default function AddAccount({ appModal }) {
    const isLoggedIn = isAuthenticated()
    const navigate = useNavigate()
    const [disableButton, setDisableButton] = useState(false);

    const {
        mutate: mutateAddAccount,
        isPending: addAccountIsPending,
        isError: addAccountIsError,
        error: addAccountError,
        isSuccess: addAccountIsSuccess
    } = useMutation({
        mutationFn: addAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getAccounts'] })

            setTimeout(() => {
                appModal('close')
                navigate('dashboard', { replace: true })
            }, 1000);
        }
    });

    function handleAddAccount(event) {
        event.preventDefault();
        setDisableButton(true)
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        mutateAddAccount(data);
    }

    useEffect(() => {
        if (addAccountIsError) { setDisableButton(false); }
    }, [addAccountIsError]);

    if (!isLoggedIn) return <SessionExpired />

    return (
        <form onSubmit={handleAddAccount}>
            <div className="modal-custom-content">
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <div><label htmlFor="name">Name</label></div>
                                <input type="text" size="15" id='name' name='name' required />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="modal-footer">
                {addAccountIsPending && <LoadingSpinner small={true} />}
                {addAccountIsSuccess && <p className='success-message'>Account Added</p>}
                {addAccountIsError && <p className='error-message'>{addAccountError.message}</p>}
                <button type="submit" disabled={disableButton} title='Add Account'><img className='modal-icons' src={iconCorrect} /></button>
            </div>
        </form>

    )
}