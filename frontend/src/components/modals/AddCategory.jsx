import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import queryClient from "../../utils/queryClient"
import { addCategory } from "../../utils/backend"
import { isAuthenticated } from '../../utils/auth';

import SessionExpired from '../ui/SessionExpired';
import LoadingSpinner from "../ui/LoadingSpinner"
import iconCorrect from '../../assets/icon-correct-orange.png'

export default function AddCategory({ appModal }) {
    const isLoggedIn = isAuthenticated()
    const navigate = useNavigate()
    const [disableButton, setDisableButton] = useState(false);

    const {
        mutate: mutateAddCategory,
        isPending: addCategoryIsPending,
        isError: addCategoryIsError,
        error: addCategoryError,
        isSuccess: addCategoryIsSuccess
    } = useMutation({
        mutationFn: addCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getCategories'] })

            setTimeout(() => {
                appModal('close')
                navigate('dashboard', { replace: true })
            }, 1000);
        }
    });

    function handleAddCategory(event) {
        event.preventDefault();
        setDisableButton(true)
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        mutateAddCategory(data);
    }

    useEffect(() => {
        if (addCategoryIsError) { setDisableButton(false); }
    }, [addCategoryIsError]);

    if (!isLoggedIn) return <SessionExpired />

    return (
        <form onSubmit={handleAddCategory}>
            <div className="modal-custom-content">
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <div><label htmlFor="name">Name</label></div>
                                <input type="text" size="15" id='name' name='name' required />
                            </td>
                            <td>
                                <div><label htmlFor="amount">Budget Amount</label></div>
                                <input type="number" step="0.01" size="15" id='amount' name='amount' required />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="modal-footer">
                {addCategoryIsPending && <LoadingSpinner small={true} />}
                {addCategoryIsSuccess && <p className='success-message'>Category Added</p>}
                {addCategoryIsError && <p className='error-message'>{addCategoryError.message}</p>}

                <button type="submit" disabled={disableButton} title="Add Category"><img className='modal-icons' src={iconCorrect} /></button>
            </div>
        </form>

    )
}