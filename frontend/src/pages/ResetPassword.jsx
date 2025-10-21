import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom"
import ContentBox from "../components/ui/ContentBox";
import axios from "axios";

const VITE_BE_URL = import.meta.env.VITE_BE_URL
const VITE_SERVER_ERROR = import.meta.env.VITE_SERVER_ERROR
const VITE_CONNECTION_ERROR = import.meta.env.VITE_CONNECTION_ERROR
const VITE_UNEXPECTED_ERROR = import.meta.env.VITE_UNEXPECTED_ERROR

export default function ResetPassword() {
    const { resetCode } = useParams();
    const [disableButton, setDisableButton] = useState(false)
    const [submitError, setSubmitError] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [codeExpired, setCodeExpired] = useState(false)
    const navigate = useNavigate()

    async function handleSubmit(event) {
        event.preventDefault();
        setDisableButton(true)

        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        //Throw error if any of the user fields are empty
        if (!data.newPassword || !data.newPasswordConfirm) {
            setSubmitError('Please ensure all fields are filled out!')
            setDisableButton(false)
            return
        }

        //Throw error if the new passwords don't match
        if (data.newPassword !== data.newPasswordConfirm) {
            setSubmitError('Passwords do not match')
            setDisableButton(false)
            return
        }

        const resetDetails = { newPassword: data.newPassword, resetCode }

        try {
            await axios.post(`${VITE_BE_URL}/auth/reset-password`, resetDetails, { withCredentials: true });

            setSubmitSuccess(true)
            setTimeout(() => {navigate('/login', { replace: true })}, 1000);
            
        } catch (error) {
            let errorMessage = VITE_UNEXPECTED_ERROR;

            if (error.response) { // Server responded but with an error status
                switch (error.response.data?.error) {
                    case 'validation error':
                        errorMessage = 'Please enter a valid password'
                        break;
                    case 'reset code invalid':
                        errorMessage = 'This password reset request has expired'
                        setCodeExpired(true)
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
        <ContentBox boxTitle="Forgot Your Password" style="reset-password-box">
            <form onSubmit={handleSubmit} className='reset-password-form'>
                <p style={{ textAlign: 'center' }}>Please enter your new password.</p>
                <label htmlFor="newPassword"></label>
                <input type="password" size="27" id='newPassword' name='newPassword' placeholder="New Password" />

                <label htmlFor="newPasswordConfirm"></label>
                <input type="password" size="27" id='newPasswordConfirm' name='newPasswordConfirm' placeholder="Confirm New Password" />
                <br></br>
                <button type="submit" disabled={disableButton}>Save</button>
                <Link className="reset-password-link" to='/login'>
                    <p>Back to login</p>
                </Link>
                {submitError && <p className='error-message'>{submitError}</p>}
                {submitSuccess && <p className='success-message'>Password changed successfully.</p>}

                {codeExpired && <Link className="reset-password-link" to='/forgot-password'>
                    <p>Request a new Password Reset.</p>
                </Link>}
            </form>
        </ContentBox>
    )
}