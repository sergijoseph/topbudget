import axios from 'axios';
import { authStore, setAuth, clearAuth, setRefreshing } from '../store/authStore';
import queryClient from './queryClient';

const VITE_BE_URL = import.meta.env.VITE_BE_URL;

export const api = axios.create({
    baseURL: VITE_BE_URL,
    withCredentials: true, // include cookies
});

// Queue for pending requests during refresh
let refreshQueue = [];
let isRefreshing = false;


// Attach access token to all requests using the api call
api.interceptors.request.use((config) => {
    const state = authStore.getState();
    const accessToken = state.auth.accessToken;

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// Refresh on 401 once
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        if (error?.response?.status === 401 && !original._retry) {
            // queue requests while refreshing to avoid token stampede
            if (!isRefreshing) {
                isRefreshing = true;
                authStore.dispatch(setRefreshing(true));
                original._retry = true; //To avoid looping through same failed request

                try {
                    const { data } = await axios.post(`${VITE_BE_URL}/auth/token/refresh`, null, { withCredentials: true });

                    // update Redux state
                    authStore.dispatch(setAuth({ accessToken: data.accessToken, user: data.user }));

                    // drain queue
                    refreshQueue.forEach((queuedRequest) => queuedRequest(null, data.accessToken));
                    refreshQueue = [];

                    isRefreshing = false;
                    authStore.dispatch(setRefreshing(false));

                    // retry original
                    original.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(original);

                } catch (error) {
                    refreshQueue.forEach((queuedRequest) => queuedRequest(error));
                    refreshQueue = [];

                    isRefreshing = false;
                    authStore.dispatch(setRefreshing(false));
                    authStore.dispatch(clearAuth());
                    queryClient.clear();

                    try {
                        await axios.post(`${VITE_BE_URL}/auth/logout`, null, { withCredentials: true });
                    } catch { }

                    return Promise.reject(error);
                }
            }

            // if already refreshing, wait
            return new Promise((resolve, reject) => {
                refreshQueue.push((err, newToken) => {
                    if (err) return reject(err);
                    original._retry = true;
                    original.headers.Authorization = `Bearer ${newToken}`;
                    resolve(api(original));
                });
            });
        }

        return Promise.reject(error);
    }
);
