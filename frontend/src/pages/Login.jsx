import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Form, useActionData, useNavigation, useNavigate, Link } from 'react-router-dom'
import { setAuth } from '../store/authStore'
import axios from 'axios'

const VITE_BE_URL = import.meta.env.VITE_BE_URL
const VITE_SERVER_ERROR = import.meta.env.VITE_SERVER_ERROR
const VITE_CONNECTION_ERROR = import.meta.env.VITE_CONNECTION_ERROR
const VITE_UNEXPECTED_ERROR = import.meta.env.VITE_UNEXPECTED_ERROR

import ContentBox from '../components/ui/ContentBox'
import ButtonText from '../components/ui/ButtonText'

import iconEmail from '../assets/icon-email.png'
import iconPassword from '../assets/icon-password.png'


export default function Login() {
    const navigation = useNavigation();
    const navigate = useNavigate();
    const result = useActionData();
    const dispatch = useDispatch();
    const isSubmitting = navigation.state === 'submitting';

    useEffect(() => {

        if (result?.data) {
            dispatch(setAuth({ accessToken: result.data.accessToken, user: result.data.user }));

            navigate('/dashboard', { replace: true })
        }

    }, [result])


    return (
        <ContentBox boxTitle="Login" style="login-box">
            <Form method='POST' action="/login" className='login-form'>
                <div className="input-wrapper">
                    <img className='icons' src={iconEmail} />
                    <input type="email" size="27" id='email' name='email' placeholder="myemail@email.com" />
                </div>
                <br></br>
                <div className="input-wrapper">
                    <img className='icons' src={iconPassword} />
                    <input type="password" size="27" id='password' name='password' placeholder="Password" />
                </div>
                <br /><br />

                <Link className='forgot-password-link' to='/forgot-password'>Forgot Password?</Link>
                <ButtonText disabled={isSubmitting} addStyle="button-right">{isSubmitting ? 'Logging In' : 'Login'}</ButtonText>
            </Form>
            {result?.error && <p className='error-message'>{result.error}</p>}
        </ContentBox>

    )
}

export async function action({ request }) {
    const data = await request.formData();

    const loginData = {
        email: data.get('email'),
        password: data.get('password')
    }

    if (!loginData.email || !loginData.password) {
        return { error: 'Please ensure all fields are filled out!' }
    }

    try {
        const response = await axios.post(`${VITE_BE_URL}/auth/login`, loginData, { withCredentials: true });
        return { data: response.data };

    } catch (error) {
        let errorMessage = VITE_UNEXPECTED_ERROR;

        if (error.response) { // Server responded but with an error status
            switch (error.response.data?.error) {
                case 'validation error':
                    errorMessage = 'Please enter a valid email address'
                    break;
                case 'incorrect user':
                case 'incorrect password':
                    errorMessage = 'Email or Password is incorrect'
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