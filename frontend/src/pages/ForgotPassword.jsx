import { useState } from "react";
import axios from "axios";
import ContentBox from "../components/ui/ContentBox";
import iconEmail from '../assets/icon-email.png'
import { Link } from "react-router-dom";

const VITE_BE_URL = import.meta.env.VITE_BE_URL
const VITE_SERVER_ERROR = import.meta.env.VITE_SERVER_ERROR
const VITE_CONNECTION_ERROR = import.meta.env.VITE_CONNECTION_ERROR
const VITE_UNEXPECTED_ERROR = import.meta.env.VITE_UNEXPECTED_ERROR

export default function ForgotPassword() {
    const [disableButton, setDisableButton] = useState(false)
    const [submitError, setSubmitError] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault();
        setDisableButton(true)

        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        if (!data.email) {
            setSubmitError('Please enter a valid email address.')
            setDisableButton(false)
            return
        }

        try {
            await axios.post(`${VITE_BE_URL}/auth/forgot-password`, { email: data.email }, { withCredentials: true });
            setSubmitSuccess(true)
        } catch (error) {
            let errorMessage = VITE_UNEXPECTED_ERROR;

            if (error.response) { // Server responded but with an error status
                switch (error.response.data?.error) {
                    case 'validation error':
                        errorMessage = 'Please enter a valid email address.'
                        break;
                    case 'create reset code failed':
                    case 'email failed':
                        errorMessage = 'Password reset could not be processed. Please try again later'
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

        <ContentBox boxTitle="Forgot Your Password" style="forgot-password-box">
            {!submitSuccess ?
                <form onSubmit={handleSubmit} className='forgot-password-form'>
                    <p style={{ textAlign: 'center' }}>Please enter your email address and we will <br /> send you instructions to reset your password </p>
                    <input type="email" size="27" id='email' name='email' required placeholder="myemail@email.com" />
                    <br></br>

                    <button type="submit" disabled={disableButton}>Continue</button>
                    <Link className="forgot-password-link" to='/login'>
                        <p>Back to login</p>
                    </Link>
                    {submitError && <p className='error-message'>{submitError}</p>}
                </form>
                :
                <>
                    <p>Success!</p>
                    <p>Password reset link has been sent to your email.</p>
                </>

            }
        </ContentBox>

    )
}