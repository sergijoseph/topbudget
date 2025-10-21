import { useQuery } from "@tanstack/react-query";
import { Form, Link } from "react-router-dom";
import { getUser, getUserBalance, getAccounts } from "../utils/backend";
import { isAuthenticated } from "../utils/auth";
import { useState } from "react";
import { authStore } from "../store/authStore";

import iconUser from '../assets/icon-user.png'
import iconSignup from '../assets/icon-signup.png'
import iconLogout from '../assets/icon-off.png'
import iconLogo from '../assets/TopBudget-logo.png'

export default function MainMenu({ appModal }) {
    const isLoggedIn = isAuthenticated()
    const [displayAccMenu, setDisplayAccMenu] = useState('none')
    const state = authStore.getState()
    const userStarted = state.auth.user?.started || 0;
    const userVerified = state.auth.user?.verified || 0;

    const { data: userData, isLoading: getUserIsPending, isError: getUserIsError, error: getUserError } = useQuery({
        queryKey: ['getUser'],
        queryFn: getUser,
        enabled: isLoggedIn
    });

    const { data: userBalance, isLoading: getUserBalanceIsPending, isError: getUserBalanceIsError, error: getUserBalanceError } = useQuery({
        queryKey: ['getUserBalance'],
        queryFn: getUserBalance,
        enabled: isLoggedIn
    });

    const { data: accountsData } = useQuery({
        queryKey: ['getAccounts'],
        queryFn: getAccounts,
        enabled: isLoggedIn
    });

    let fullName = '';

    if (userData) {
        fullName = userData.firstName + ' ' + userData.lastName;
    }

    return (
        <div className="main-menu">
            <div className="menu">
                <div className="app-name">
                    <Link to="/">
                        <img src={iconLogo} height="30px"/>
                    </Link>

                </div>
                <div className="menu-items">
                    {!isLoggedIn &&
                        <Link to="/login" className="menu-item">
                            Login <img className="menu-icons" src={iconUser} />
                        </Link>
                    }
                    {!isLoggedIn &&
                        <Link to="/signup" className="menu-item">
                            Sign Up <img className="menu-icons" src={iconSignup} />
                        </Link>
                    }
                    {isLoggedIn &&
                        <>
                            {userVerified === 1 && <span className="menu-balance">
                                Balance: ${userBalance || '0.00'}
                            </span>}

                            {userVerified === 1 && userStarted === 1 &&
                                <div className="menu-item"
                                    onMouseEnter={() => { setDisplayAccMenu('grid') }}
                                    onMouseLeave={() => { setDisplayAccMenu('none') }}
                                >My Accounts
                                    <div style={{ display: displayAccMenu }} className='menu-dropdown'>
                                        <span onClick={() => appModal('open', 'addAccount')}>
                                            <span style={{ color: '#8dbfa8', fontWeight: 'bold', fontSize: '20px' }}>+</span>
                                            Add Account
                                        </span>
                                        {
                                            accountsData?.map((account, index) => (
                                                <span key={account.accountId}
                                                    onClick={() => appModal('open', 'editAccount', { accountId: account.accountId })}
                                                >{account.accountName}</span>
                                            ))
                                        }
                                    </div>
                                </div>
                            }
                            
                            {userVerified === 1 && <button onClick={() => appModal('open', 'profile')} className="menu-item menu-button">
                                {fullName} <img className="menu-icons" src={iconUser} />
                            </button>}

                            <Form action="/logout" method="POST" style={{display: 'flex'}}>
                                <button className="menu-item menu-button">
                                    Logout <img className="menu-icons" src={iconLogout} />
                                </button>
                            </Form>
                        </>
                    }
                </div>
            </div>
        </div>
    );
}