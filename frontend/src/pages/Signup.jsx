import { useEffect, useState } from 'react'
import { Form, useActionData, useNavigate, useNavigation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setAuth } from '../store/authStore'
import axios from 'axios'

import ContentBox from '../components/ui/ContentBox'
import ButtonText from '../components/ui/ButtonText'

import iconName from '../assets/icon-name.png'
import iconEmail from '../assets/icon-email.png'
import iconPassword from '../assets/icon-password.png'

const VITE_BE_URL = import.meta.env.VITE_BE_URL
const VITE_SERVER_ERROR = import.meta.env.VITE_SERVER_ERROR
const VITE_CONNECTION_ERROR = import.meta.env.VITE_CONNECTION_ERROR
const VITE_UNEXPECTED_ERROR = import.meta.env.VITE_UNEXPECTED_ERROR
const VITE_NAME_LENGTH = import.meta.env.VITE_NAME_LENGTH

export default function Signup() {
    const navigation = useNavigation();
    const navigate = useNavigate()
    const result = useActionData();
    const dispatch = useDispatch()
    const isSubmitting = navigation.state === 'submitting';
    const [showNotice, setShowNotice] = useState(false)

    useEffect(() => {

        if (result?.data) {
            dispatch(setAuth({ accessToken: result.data.accessToken, user: result.data.user }));

            navigate('/dashboard', { replace: true })
        }

    }, [result])

    function handleShowNotice() {
        setShowNotice(prev => !prev)
    }

    return (
        <ContentBox boxTitle="Sign Up" style="signup-box">
            <Form method='POST' className='signup-form'>
                <div className="input-wrapper">
                    <img className='icons' src={iconName} />
                    <input type="text" size="8" id='firstName' name='firstName' placeholder="First Name" required />
                    <input style={{ marginLeft: '13px' }} type="text" size="7" id='lastName' name='lastName' placeholder="Last Name" required />
                </div>
                <br></br>
                <div className="input-wrapper">
                    <img className='icons' src={iconEmail} />
                    <input type="email" size="27" id='email' name='email' placeholder="myemail@email.com" required />
                </div>
                <br></br>
                <div className="input-wrapper">
                    <img className='icons' src={iconPassword} />
                    <input type="password" size="27" id='password' name='password' placeholder="Password" required />
                </div>
                <br></br>
                <div className="input-wrapper">
                    <img className='icons' src={iconPassword} />
                    <input type="password" size="27" id='passwordConfirm' name='passwordConfirm' placeholder="Confirm Password" required />
                </div>
                <br />
                <br />
                <ButtonText disabled={isSubmitting} addStyle="button-right">{isSubmitting ? 'Signing Up' : 'Sign Up'}</ButtonText>

                <span style={{ fontSize: '0.9rem' }}>By signing up you agree to the <br />
                    <span className='show-notice' onClick={handleShowNotice}>Demo Privary & Terms Notice</span>
                </span>

            </Form>
            <br />
            {result?.error && <p className='error-message'>{result.error}</p>}
            {showNotice &&
                <div className='signup-notice'>
                    <p><b>Top Budget - Demo Privary & Terms Notice</b></p>
                    <p><b>Demo Status:</b><br />
                        Top Budget is currently provided as a demo application.<br />
                        It is primarily intended to showcase features and allow<br />
                        users to test budgeting functionality. Users should avoid<br />
                        entering sensitive or real financial information.
                    </p>

                    <p><b>Data Collection:</b><br />
                        When signing up, Top Budget collects your first name,<br />
                        last name, email address, and budgeting transaction data.<br />
                        This information is used solely to provide the app's<br/> functionality.
                    </p>

                    <p><b>Privacy & Security:</b><br />
                        <li>We make reasonable efforts to protect your data.</li>
                        <li>As a demo, your data may not be permanently stored <br />
                            and security cannot be guaranteed.</li>
                        <li>Your data will not be shared with third parties except<br />
                            as needed to operate the app (e.g., sending email<br/> notifications).</li>
                    </p>

                    <p><b>Terms of use:</b><br/>
                    By using Top Budget, you acknowledge that:<br/>
                        <li>This is a demo application. Features may change or <br/>
                        stop without notice.</li>
                        <li>We are not responsible for any financial outcomes resulting<br/>
                        from using this app.</li>
                        <li>You will not misuse the app (e.g., spam accounts, attempt<br/> unauthorized access)</li>
                    </p>
                </div>}
        </ContentBox>

    )
}

export async function action({ request }) {
    const data = await request.formData();

    const signupData = {
        firstName: data.get('firstName'),
        lastName: data.get('lastName'),
        email: data.get('email'),
        password: data.get('password'),
    };

    const confirmedPassword = data.get('passwordConfirm');

    //return error if any field is empty
    if (!signupData.firstName || !signupData.lastName || !signupData.email || !signupData.password) {
        return { error: 'Please ensure all fields are filled out!' }
    }

    //return error if first name is too long
    if (signupData.firstName.length > VITE_NAME_LENGTH) {
        return { error: `Your first name should not be more than ${VITE_NAME_LENGTH} characters` }
    }

    //return error if last name is too long
    if (signupData.lastName.length > VITE_NAME_LENGTH) {
        return { error: `Your last name should not be more than ${VITE_NAME_LENGTH} characters` }
    }

    //return error if the passwords don't match
    if (confirmedPassword !== signupData.password) {
        return { error: 'Passwords do not match!' }
    }

    try {
        const response = await axios.post(`${VITE_BE_URL}/auth/signup`, signupData, { withCredentials: true });
        return { data: response.data };

    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'validation error':
                    errorMessage = 'Please enter valid information'
                    break;
                case 'duplicate user':
                    errorMessage = 'This user already exists'
                    break;
                case 'User not found':
                    errorMessage = 'This user already exists'
                    break;
                default:
                    errorMessage = VITE_SERVER_ERROR;
            }
        } else if (error.request) { // Request sent, but no response received
            errorMessage = VITE_CONNECTION_ERROR;
        }

        return { error: errorMessage }
    }
}