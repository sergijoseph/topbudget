import { useEffect, useState } from "react";
import { Form, useLoaderData, useActionData, useNavigation, useNavigate } from 'react-router-dom'
import { api } from "../utils/api";
import axios from "axios";
import { authStore, setAuth, clearAuth } from "../store/authStore";
import { isAuthenticated } from "../utils/auth";

import ContentBox from "../components/ui/ContentBox";
import ButtonText from "../components/ui/ButtonText";
import LoadingError from "../components/ui/LoadingError";
import SessionExpired from "../components/ui/SessionExpired";

const VITE_BE_URL = import.meta.env.VITE_BE_URL
const VITE_SERVER_ERROR = import.meta.env.VITE_SERVER_ERROR
const VITE_CONNECTION_ERROR = import.meta.env.VITE_CONNECTION_ERROR
const VITE_UNEXPECTED_ERROR = import.meta.env.VITE_UNEXPECTED_ERROR

export default function GettingStarted() {
    const isLoggedIn = isAuthenticated()
    const [successMessage, setSuccessMessage] = useState();
    const [defaultCheck, setDefaultCheck] = useState()
    const [defaultValues, setDefaultValues] = useState(null)
    const navigate = useNavigate()
    const navigation = useNavigation()
    const loaderData = useLoaderData()
    const result = useActionData()
    const firstName = loaderData.firstName;
    const isSubmitting = navigation.state === 'submitting';

    useEffect(() => {
        if (result?.success) {
            setSuccessMessage('Budget setup successfully!')

            setTimeout(() => {
                navigate('/dashboard', { replace: true })

            }, 2000);
        }
    }, [result])

    function handleDefaultCheck(event) {
        setDefaultCheck(event.target.checked)

        if (event.target.checked) {

            setDefaultValues({
                name1: 'Housing', amount1: '1000.00',
                name2: 'Groceries', amount2: '500.00',
                name3: 'Transportation', amount3: '100.00',
                name4: 'Utilities', amount4: '200.00',
                name5: 'Entertainment', amount5: '150.00'
            }
            )
        } else {
            setDefaultValues(null)
        }
    }

    if (!isLoggedIn) return <SessionExpired />

    if (!loaderData) {
        return <LoadingError contHeight='200px' contWidth='350px' imgHeight="100px" />
    }

    return (

        <ContentBox boxTitle="Getting Started" style="gettingstarted-box">
            <Form method="POST">
                <br />
                <p className="center-text">Hi {firstName}, let's get your budget setup!</p>
                <p className="center-text">Create your first 5 categories</p>
                <br /><br />
                <table>
                    <thead>
                        <tr><th>Name</th><th>Budget Amount</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>
                                <input type="text" size="20" name='catName1' placeholder="Housing" value={defaultValues?.name1 || ''}
                                    onChange={e => setDefaultValues({ ...defaultValues, name1: e.target.value })} />
                            </th>
                            <th>
                                <input type="number" name='catAmt1' step="0.01" placeholder="1000.00" className="input-amt" value={defaultValues?.amount1 || ''}
                                    onChange={e => setDefaultValues({ ...defaultValues, amount1: e.target.value })} />
                            </th>
                        </tr>
                        <tr>
                            <th>
                                <input type="text" size="20" name='catName2' placeholder="Groceries" value={defaultValues?.name2 || ''}
                                    onChange={e => setDefaultValues({ ...defaultValues, name2: e.target.value })} />
                            </th>
                            <th>
                                <input type="number" name='catAmt2' step="0.01" placeholder="500.00" className="input-amt" value={defaultValues?.amount2 || ''}
                                    onChange={e => setDefaultValues({ ...defaultValues, amount2: e.target.value })} />
                            </th>
                        </tr>
                        <tr>
                            <th>
                                <input type="text" size="20" name='catName3' placeholder="Transportation" value={defaultValues?.name3 || ''}
                                    onChange={e => setDefaultValues({ ...defaultValues, name3: e.target.value })} />
                            </th>
                            <th>
                                <input type="number" name='catAmt3' step="0.01" placeholder="100.00" className="input-amt" value={defaultValues?.amount3 || ''}
                                    onChange={e => setDefaultValues({ ...defaultValues, amount3: e.target.value })} />
                            </th>
                        </tr>
                        <tr>
                            <th>
                                <input type="text" size="20" name='catName4' placeholder="Utilities" value={defaultValues?.name4 || ''}
                                    onChange={e => setDefaultValues({ ...defaultValues, name4: e.target.value })} />
                            </th>
                            <th>
                                <input type="number" name='catAmt4' step="0.01" placeholder="200.00" className="input-amt" value={defaultValues?.amount4 || ''}
                                    onChange={e => setDefaultValues({ ...defaultValues, amount4: e.target.value })} />
                            </th>
                        </tr>
                        <tr>
                            <th>
                                <input type="text" size="20" name='catName5' placeholder="Entertainment" value={defaultValues?.name5 || ''}
                                    onChange={e => setDefaultValues({ ...defaultValues, name5: e.target.value })} />
                            </th>
                            <th>
                                <input type="number" name='catAmt5' step="0.01" placeholder="150.00" className="input-amt" value={defaultValues?.amount5 || ''}
                                    onChange={e => setDefaultValues({ ...defaultValues, amount5: e.target.value })} />
                            </th>
                        </tr>
                    </tbody>
                </table>
                <br></br><br></br>

                <ButtonText disabled={isSubmitting} addStyle="button-right">{isSubmitting ? 'Creating...' : 'Create Budget'}</ButtonText>
                <span style={{ float: 'right' }}>
                    <label htmlFor="useDefaultCheck">Use Default</label>
                    <input
                        style={{ marginLeft: '10px' }}
                        type="checkbox"
                        id="useDefaultCheck"
                        name="useDefaultCheck"
                        checked={defaultCheck ? 'checked' : ''}
                        onChange={e => handleDefaultCheck(e)}
                    />
                </span>
                <br /><br />

                {result?.error && <p className='error-message'>{result.error}</p>}
                {successMessage && <p className='success-message'>{successMessage}</p>}

            </Form>
        </ContentBox>
    );
}

export async function action({ request }) {
    const data = await request.formData();

    const newCategoriesData = [
        { name: data.get('catName1'), amount: Number(data.get('catAmt1')) },
        { name: data.get('catName2'), amount: Number(data.get('catAmt2')) },
        { name: data.get('catName3'), amount: Number(data.get('catAmt3')) },
        { name: data.get('catName4'), amount: Number(data.get('catAmt4')) },
        { name: data.get('catName5'), amount: Number(data.get('catAmt5')) }
    ]

    //Loop through category values to validate data
    for (let count = 0; count < newCategoriesData.length; count++) {

        //return error if category name or amount is missing
        if (!newCategoriesData[count].name || !newCategoriesData[count].amount) {
            return { error: 'Category name or amount is missing' }
        }

        //return error if category amount is not a number
        if (typeof newCategoriesData[count].amount !== 'number') {
            return { error: 'Ensure entered amount is a number' }
        }

        //return error if category name is too long
        if (newCategoriesData[count].name.length > 50) {
            return { error: 'Category name is too long' }
        }
    };

    //Create a default category: Uncategorized
    try {
        await api.post('/category', { name: 'Uncategorized', budgetAmount: 0, started: true });
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        return { error: errorMessage }
    }

    //Loop through each submitted category to add to database
    for (let count = 0; count < newCategoriesData.length; count++) {
        const categoryData = {
            name: newCategoriesData[count].name,
            budgetAmount: newCategoriesData[count].amount,
        }

        try {
            await api.post('/category', categoryData);
        } catch (error) {
            let errorMessage = VITE_UNEXPECTED_ERROR;

            if (error.response) { // Server responded but with an error status
                switch (error.response.data?.error) {
                    default:
                        errorMessage = VITE_SERVER_ERROR;
                }
            } else if (error.request) { // Request sent, but no response received
                errorMessage = VITE_CONNECTION_ERROR;
            }

            return { error: errorMessage }
        }
    }

    //Update user started flag after Categories are created
    try {
        await api.put('/user/started');
    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        return { error: errorMessage }
    }

    //Get a new refresh token and access token in order to get updated 'started' field
    try {
        const tokenResponse = await axios.post(`${VITE_BE_URL}/auth/token/refresh`, {}, { withCredentials: true });
        authStore.dispatch(setAuth({ accessToken: tokenResponse.data.accessToken, user: tokenResponse.data.user }));
    } catch (error) {
        authStore.dispatch(clearAuth());

        return { error: 'Unable to refresh token' }
    }

    return { success: true }
}