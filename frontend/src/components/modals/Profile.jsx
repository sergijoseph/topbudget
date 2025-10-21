import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import queryClient from "../../utils/queryClient"
import { getUser, updateUser, changePassword } from "../../utils/backend"
import { isAuthenticated } from "../../utils/auth"

import SessionExpired from '../ui/SessionExpired';
import LoadingSpinner from "../ui/LoadingSpinner"
import LoadingError from "../ui/LoadingError"

import iconName from '../../assets/icon-name.png'
import iconEmail from '../../assets/icon-email.png'
import iconPassword from '../../assets/icon-password.png'
import iconCorrect from '../../assets/icon-correct-orange.png'

export default function Profile({ appModal }) {
    const isLoggedIn = isAuthenticated();
    const [changePasswordScreen, setChangePasswordScreen] = useState();
    const [disableButton, setDisableButton] = useState(false)

    const { data: userData, isError: getUserIsError } = useQuery({
        queryKey: ['getUser'],
        queryFn: getUser,
        enabled: isLoggedIn
    });

    const {
        mutate: mutateUpdateUser,
        isPending: updateUserIsPending,
        isError: updateUserIsError,
        error: updateUserError,
        isSuccess: updateUserIsSuccess
    } = useMutation({
        mutationFn: updateUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getUser'] })

            setTimeout(() => {
                appModal('close')
            }, 2000);
        }
    });

    const {
        mutate: mutateChangePassword,
        isPending: changePasswordIsPending,
        isError: changePasswordIsError,
        error: changePasswordError,
        isSuccess: changePasswordIsSuccess
    } = useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getUser'] })

            setTimeout(() => {
                appModal('close')
            }, 1000);
        }
    });

    function handleUserUpdate(event) {
        event.preventDefault();
        setDisableButton(true)
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        mutateUpdateUser(data);
    }

    function handleChangePassword(event) {
        event.preventDefault();
        setDisableButton(true)
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        mutateChangePassword(data);
    }

    function handleSwitchToPassword() {
        setChangePasswordScreen(true);
    }

    useEffect(() => {
        if (updateUserIsError || changePasswordIsError) { setDisableButton(false); }
    }, [updateUserIsError, changePasswordIsError]);

    if (!isLoggedIn) return <SessionExpired />

    if (getUserIsError) {
        return <LoadingError contHeight='200px' contWidth='350px' imgHeight="50px" />
    }

    return (
        <>{isLoggedIn &&
            !changePasswordScreen ? (
            <form onSubmit={handleUserUpdate}>
                <div className="modal-content">
                    <div className="input-wrapper">
                        <img className='icons' src={iconName} />
                        <input type="text" size="8" id='firstName' name='firstName' placeholder="First Name" defaultValue={userData.firstName || ''} />
                        <input style={{marginLeft: '13px'}} type="text" size="7" id='lastName' name='lastName' placeholder="Last Name" defaultValue={userData.lastName || ''} />
                    </div>
                    <br></br>
                    <div className="input-wrapper">
                        <img className='icons' src={iconEmail} />
                        <input type="email" size="27" id='email' name='email' placeholder="myemail@email.com" readOnly defaultValue={userData.email || ''} />
                    </div>
                    <br></br>
                </div>
                <div className="modal-footer">
                    {!disableButton && <span className="change-password"><a onClick={handleSwitchToPassword} >Change Password</a></span>}
                    {updateUserIsPending && <LoadingSpinner small={true} />}
                    <button type="submit" disabled={disableButton} title="Change User"><img className='modal-icons' src={iconCorrect} /></button>
                </div>
                <div style={{ padding: '2px 15px' }}>
                    {updateUserIsSuccess && <p className='success-message'>Name changed successfully</p>}
                    {updateUserIsError && <p className='error-message'>{updateUserError.message}</p>}
                </div>
            </form>
        ) : (
            <form onSubmit={handleChangePassword}>
                <div className="modal-content">
                    <div className="input-wrapper">
                        <img className='icons' src={iconPassword} />
                        <input type="password" size="27" id='oldPassword' name='oldPassword' placeholder="Old Password" />
                    </div>
                    <br></br>
                    <div className="input-wrapper">
                        <img className='icons' src={iconPassword} />
                        <input type="password" size="27" id='newPassword' name='newPassword' placeholder="New Password" />
                    </div>
                    <br></br>
                    <div className="input-wrapper">
                        <img className='icons' src={iconPassword} />
                        <input type="password" size="27" id='newPasswordConfirm' name='newPasswordConfirm' placeholder="Confirm New Password" />
                    </div>
                </div>
                <div className="modal-footer">
                    {changePasswordIsPending && <LoadingSpinner small={true} />}
                    <button type="submit" disabled={disableButton} title="Change Password"><img className='modal-icons' src={iconCorrect} /></button>
                </div>
                <div style={{ padding: '2px 15px' }}>
                    {changePasswordIsSuccess && <p className='success-message'>Password changed successfully</p>}
                    {changePasswordIsError && <p className='error-message'>{changePasswordError.message}</p>}
                </div>
            </form>
        )
        }</>
    )
}