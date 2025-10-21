import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import queryClient from "../../utils/queryClient"
import { getCategory, updateCategory, deleteCategory } from "../../utils/backend"
import { isAuthenticated } from "../../utils/auth"

import SessionExpired from '../ui/SessionExpired';
import LoadingError from '../ui/LoadingError';
import LoadingSpinner from '../ui/LoadingSpinner';
import iconCorrect from '../../assets/icon-correct-orange.png'
import iconDelete from '../../assets/icon-delete-red.png'

export default function EditCategory({ appModal, modalData, loadCatTransactions }) {
    const isLoggedIn = isAuthenticated()
    const navigate = useNavigate()
    const catId = modalData.catId
    const [disableButton, setDisableButton] = useState(false);


    const { data: categoryData, isError: getCategoryIsError } = useQuery({
        queryKey: ['getCategory', catId],
        queryFn: getCategory
    });

    useEffect(() => {

        if (categoryData?.name === 'Uncategorized') {
            appModal('close')
        }

    }, [categoryData])

    const {
        mutate: mutateEditCategory,
        isPending: editCategoryIsPending,
        isError: editCategoryIsError,
        error: editCategoryError,
        isSuccess: editCategoryIsSuccess
    } = useMutation({
        mutationFn: updateCategory,
        onSuccess: (newCatData) => {
            queryClient.invalidateQueries({ queryKey: ['getCategories'] })
            queryClient.invalidateQueries({ queryKey: ['getCategory', catId] })
            queryClient.invalidateQueries({ queryKey: ['getTransactions', catId] })
            loadCatTransactions({ catId, catName: newCatData?.name, catAmt: newCatData?.budget_amount })

            setTimeout(() => {
                appModal('close')
                navigate('/dashboard', { replace: true })
            }, 1000);
        }
    });

    const {
        mutate: mutateDeleteCategory,
        isPending: deleteCategoryIsPending,
        isError: deleteCategoryIsError,
        error: deleteCategoryError,
        isSuccess: deleteCategoryIsSuccess
    } = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getCategories'] })
            queryClient.invalidateQueries({ queryKey: ['getTransactions'] })
            loadCatTransactions({ catId: '' })

            setTimeout(() => {
                appModal('close')
                navigate('/dashboard', { replace: true })
            }, 1000);
        }
    });

    function handleEditCategory(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);
        data.catId = catId

        mutateEditCategory(data);
    }

    function handleDeleteCategory(catId) {
        const confirmation = confirm("Are you sure you want to delete this category? \nAll transactions in this category will move to uncategorized");
        if (confirmation) {
            mutateDeleteCategory(catId)
        } else {
            return false; // Prevent the default action
        }
    }

    useEffect(() => {
        if (editCategoryIsError || deleteCategoryIsError) { setDisableButton(false); }
    }, [editCategoryIsError, deleteCategoryIsError]);

    if (!isLoggedIn) return <SessionExpired />

    if (getCategoryIsError) { return <LoadingError contHeight='200px' contWidth='350px' imgHeight="50px" /> }

    const isSubmitting = editCategoryIsPending || deleteCategoryIsPending

    return (
        <form onSubmit={handleEditCategory}>
            <div className="modal-custom-content">
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <div><label htmlFor="name">Name</label></div>
                                <input type="text" size="15" id='name' name='name' defaultValue={categoryData?.name || ''} required />
                            </td>
                            <td>
                                <div><label htmlFor="amount">Budget Amount</label></div>
                                <input type="number" step="0.01" size="15" id='amount' name='amount' defaultValue={categoryData?.budget_amount || ''} required />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="modal-footer">
                {isSubmitting && <LoadingSpinner small={true} />}

                {editCategoryIsSuccess && <p className='success-message'>Category Updated</p>}
                {deleteCategoryIsSuccess && <p className='success-message'>Category Deleted</p>}

                {editCategoryIsError && <p className='error-message'>{editCategoryError.message}</p>}
                {deleteCategoryIsError && <p className='error-message'>{deleteCategoryError.message}</p>}
                <button type="button" disabled={disableButton} title="Delete Category" onClick={() => { handleDeleteCategory(catId) }}><img className='modal-icons' src={iconDelete} /></button>
                <button type="submit" disabled={disableButton} title="Update Category"><img className='modal-icons' src={iconCorrect} /></button>
            </div>
        </form>

    )
}