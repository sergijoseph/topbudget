import { redirect } from 'react-router-dom';
import { authStore, setAuth, clearAuth } from '../store/authStore';
import axios from 'axios';
import queryClient from './queryClient';
import { getUser, getCategories } from './backend';

const VITE_BE_URL = import.meta.env.VITE_BE_URL
let isRefreshingInitially = true

export function isAuthenticated() {
    const state = authStore.getState();
    const accessToken = state.auth.accessToken;
    const user = state.auth.user;

    const authenticated = !!accessToken && !!user;
    return authenticated
}

export function authPagesLoader() {
    const isLoggedIn = isAuthenticated();
    if (isLoggedIn) return redirect('/dashboard');
}

export async function rootLoader() {
    if (!isRefreshingInitially) return; //If initial refresh is false don't attempt token refresh. Token Refresh already attempted.

    isRefreshingInitially = false; //If initial refresh is true set to false so it won't attempt refresh again

    try {
        const response = await axios.post(`${VITE_BE_URL}/auth/token/refresh`, {}, { withCredentials: true });
        authStore.dispatch(setAuth({ accessToken: response.data.accessToken, user: response.data.user }));

        return { success: true }
    } catch {
        authStore.dispatch(clearAuth());
        queryClient.clear();

        return { success: false }
    }
}

export async function dashboardLoader() {
    const isLoggedIn = isAuthenticated()
    if (!isLoggedIn) return redirect('/');

    const state = authStore.getState();
    const user = state.auth.user;

    if (!user.verified) return redirect('/not-verified');
    if (!user.started) return redirect('/gettingstarted');
}

export async function gettingStartedLoader() {
    const isLoggedIn = isAuthenticated();
    if (!isLoggedIn) return redirect('/login');

    const state = authStore.getState();
    const user = state.auth.user;

    if (!user.verified) return redirect('/not-verified');
    if (user.started) return redirect('/dashboard');

    try {
        const userInfo = await queryClient.fetchQuery({
            queryKey: ['getUser'],
            queryFn: getUser,
            staleTime: 1000 * 60
        }
        );

        return userInfo
    } catch {
        return false
    }

}