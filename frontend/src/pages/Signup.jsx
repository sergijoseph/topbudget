import { useEffect } from 'react'
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

    useEffect(() => {

        if (result?.data) {
            dispatch(setAuth({ accessToken: result.data.accessToken, user: result.data.user }));

            navigate('/dashboard', { replace: true })
        }

    }, [result])

    return (
        <ContentBox boxTitle="Sign Up" style="signup-box">
            <Form method='POST' className='signup-form'>
                <div className="input-wrapper">
                    <img className='icons' src={iconName} />
                    <input type="text" size="8" id='firstName' name='firstName' placeholder="First Name" required />
                    <input style={{marginLeft: '13px'}} type="text" size="7" id='lastName' name='lastName' placeholder="Last Name" required />
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
                <br></br><br></br>

                <ButtonText disabled={isSubmitting} addStyle="button-right">{isSubmitting ? 'Signing Up' : 'Sign Up'}</ButtonText>

            </Form>
            <br />
            {result?.error && <p className='error-message'>{result.error}</p>}
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