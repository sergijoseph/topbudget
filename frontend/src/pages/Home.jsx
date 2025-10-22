import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ContentBox from "../components/ui/ContentBox";
import { isAuthenticated } from "../utils/auth";

import Logo from '../assets/TopBudget-logo.png'

export default function Home() {
    const isLoggedIn = isAuthenticated()
    const navigate = useNavigate()

    useEffect(() => {
        if (isLoggedIn) { navigate('/dashboard'), { replace: true } }
    }, [])

    return (
        <ContentBox boxTitle="Welcome" style="welcome">
            <div className="welcome-page">
                <p>Welcome to</p>
                <br></br>
                <img src={Logo} />
                <br></br>
                <p>A simple budgeting tool designed to help you stay organized, plan ahead, and achieve your financial goals.</p>
                <ul>
                    <li><b>Add income or expense transactions in just a few taps</b> - so you always know where your money goes.</li>
                    <li><b>Categorize your spending</b> - organize transactions by category to understand your habits and make smarter financial choices.</li>
                    <li><b>Schedule future transactions</b> - plan ahead for recurring payments, bills, or expected income.</li>
                    <li><b>Track finances by account</b> - manage multiple accounts in one place and see the big picture of your budget at a glance.</li>
                </ul>
                <br /><br />
                <div>
                    <Link className="home-links" to='/signup'>Sign Up</Link>
                    <Link className="home-links" to='/login'>Login</Link>
                </div>
                <br></br>
            </div>
        </ContentBox>
    )
}