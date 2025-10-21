import { useState, useEffect } from "react";
import { api } from "../utils/api";
import axios from "axios";
import { authStore, setAuth, clearAuth } from "../store/authStore";
import { useParams, Link } from "react-router-dom"
import ContentBox from "../components/ui/ContentBox";

const VITE_BE_URL = import.meta.env.VITE_BE_URL
const VITE_SERVER_ERROR = import.meta.env.VITE_SERVER_ERROR
const VITE_CONNECTION_ERROR = import.meta.env.VITE_CONNECTION_ERROR
const VITE_UNEXPECTED_ERROR = import.meta.env.VITE_UNEXPECTED_ERROR
let requestNewToken = true;

export default function VerifyAccount() {
    const { verificationCode } = useParams();
    const [submitError, setSubmitError] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    useEffect(() => {
        async function verifyAccount() {
            try {
                await api.post(`${VITE_BE_URL}/auth/verify-account`, { verificationCode }, { withCredentials: true });
                setSubmitSuccess(true)

            } catch (error) {
                let errorMessage = VITE_UNEXPECTED_ERROR;

                if (error.response) { // Server responded but with an error status
                    switch (error.response.data?.error) {
                        case 'verification code invalid':
                            errorMessage = 'This verification code is invalid. Please try again later'
                            break;
                        case 'update user verified failed':
                            errorMessage = 'Could not verify Account at the moment. Please try again later'
                            break;
                        default:
                            errorMessage = VITE_SERVER_ERROR;
                    }
                } else if (error.request) { // Request sent, but no response received
                    errorMessage = VITE_CONNECTION_ERROR;
                }

                setSubmitError(errorMessage)
                return
            }

            if (requestNewToken) {
                requestNewToken = false; //This ensures a new refresh token is only requested once.

                //Get a new refresh token and access token in order to get updated 'started' field
                try {
                    const tokenResponse = await axios.post(`${VITE_BE_URL}/auth/token/refresh`, {}, { withCredentials: true });
                    authStore.dispatch(setAuth({ accessToken: tokenResponse.data.accessToken, user: tokenResponse.data.user }));
                } catch (error) {
                    authStore.dispatch(clearAuth());

                    let errorMessage = VITE_UNEXPECTED_ERROR;

                    if (error.response) { // Server responded but with an error status
                        switch (error.response.data?.error) {
                            default:
                                errorMessage = 'An unexpected error occurred! Please logout and log out and log back in.';
                        }
                    } else if (error.request) { // Request sent, but no response received
                        errorMessage = VITE_CONNECTION_ERROR;
                    }

                    setSubmitError(errorMessage)
                    setDisableButton(false)
                    return
                }
            }
        }

        verifyAccount()
    }, [verificationCode])

    return (
        <ContentBox boxTitle="Account Verification" style="verification-box">
            {submitSuccess ?
                <>
                    <p>Success!</p>
                    <p>Your Account is now verified.</p>
                    <Link className="reset-password-link" to='/dashboard'>
                        <p>Go to dashboard</p>
                    </Link>
                </>
                :
                <>
                    <p>Uh oh!</p>
                    <p>Your Account verification failed</p>
                    {submitError && <p className='error-message'>{submitError}</p>}
                    <Link className="reset-password-link" to='/dashboard'>
                        <p>Go back to Account Verification</p>
                    </Link>
                </>
            }
        </ContentBox>
    )
}