import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { Link, useNavigate } from "react-router-dom"
import ContentBox from "../components/ui/ContentBox";
import { isAuthenticated } from "../utils/auth";
import { authStore } from "../store/authStore";

const VITE_BE_URL = import.meta.env.VITE_BE_URL
const VITE_SERVER_ERROR = import.meta.env.VITE_SERVER_ERROR
const VITE_CONNECTION_ERROR = import.meta.env.VITE_CONNECTION_ERROR
const VITE_UNEXPECTED_ERROR = import.meta.env.VITE_UNEXPECTED_ERROR

export default function NotVerified() {
    const isLoggedIn = isAuthenticated()
    const navigate = useNavigate()
    const [disableButton, setDisableButton] = useState(false)
    const [submitError, setSubmitError] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const state = authStore.getState();
    const isVerified = state.auth.user.verified === 1;

    useEffect(() => {
        if (!isLoggedIn) { navigate('/login'), { replace: true } }
        if (isVerified) { navigate('/dashboard'), { replace: true } }
    }, [])


    async function handleSubmit(event) {
        event.preventDefault();
        setDisableButton(true)

        try {
            await api.post(`${VITE_BE_URL}/auth/verification-link`, {}, { withCredentials: true });
            setSubmitSuccess(true)
        } catch (error) {
            let errorMessage = VITE_UNEXPECTED_ERROR;

            if (error.response) { // Server responded but with an error status
                switch (error.response.data?.error) {
                    case 'user not found':
                    case 'create verification code failed':
                    case 'email failed':
                        errorMessage = 'verification link could not be created. Please try again later'
                        break;
                    default:
                        errorMessage = VITE_SERVER_ERROR;
                }
            } else if (error.request) { // Request sent, but no response received
                errorMessage = VITE_CONNECTION_ERROR;
            }

            setSubmitError(errorMessage)
            setDisableButton(false)
        }
    }

    return (
        <>
            {isLoggedIn &&

                <ContentBox boxTitle="Account Verification" style="verification-box">
                    <form onSubmit={handleSubmit} className='forgot-password-form'>
                        <p style={{ textAlign: 'center', fontSize: '18px' }}>You need to verify your email address before you can continue.</p>
                        <p style={{ textAlign: 'center', fontSize: '18px' }}>A verification link was sent to your email.</p>
                        <p style={{ textAlign: 'center', fontSize: '18px' }}>If you did not receive the verification link <br /> please use the button below to send a new link.</p>

                        <button type="submit" disabled={disableButton}>Send Verification Link</button>
                        <br />
                        {submitError && <p className='error-message'>{submitError}</p>}
                        {submitSuccess &&
                            <>
                                <p className='success-message'>Verification link sent.</p>
                                <Link className="reset-password-link" to='/dashboard'>
                                    <p>Go to dashboard</p>
                                </Link>
                            </>
                        }

                    </form>

                </ContentBox>
            }
        </>
    )
}