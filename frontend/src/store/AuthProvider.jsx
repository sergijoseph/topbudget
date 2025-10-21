// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { api } from '../utils/backend';

const VITE_BE_URL = import.meta.env.VITE_BE_URL;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(null);
    const [user, setUser] = useState(null);
    const isRefreshingRef = useRef(false);
    const refreshQueue = useRef([]);

    const isRefreshingInitial = useRef(false);

    useEffect(() => {
        // Attach access token
        const reqInterceptor = api.interceptors.request.use((config) => {
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        });

        // Refresh on 401 once
        const resInterceptor = api.interceptors.response.use(
            (res) => res,
            async (error) => {
                const original = error.config;

                if (error?.response?.status === 401 && !original._retry) {
                    // queue requests while refreshing to avoid token stampede
                    if (!isRefreshingRef.current) {
                        isRefreshingRef.current = true;
                        original._retry = true; //To avoid looping through same failed request
                        try {
                            const { data } = await axios.post(`${VITE_BE_URL}/auth/token/refresh`, null, { withCredentials: true });
                            setAccessToken(data.accessToken);
                            setUser(data.user);
                            isRefreshingRef.current = false;
                            // drain queue
                            refreshQueue.current.forEach((queuedRequest) => queuedRequest(null, data.accessToken));
                            refreshQueue.current = [];
                            // retry original
                            original.headers.Authorization = `Bearer ${data.accessToken}`;
                            return axios(original);
                        } catch (error) {
                            isRefreshingRef.current = false;
                            refreshQueue.current.forEach((queuedRequest) => queuedRequest(error));
                            refreshQueue.current = [];

                            try {
                                await axios.post(`${VITE_BE_URL}/auth/logout`, null, { withCredentials: true });
                            } finally {
                                setAccessToken(null);
                                setUser(null);
                            }

                            return Promise.reject(error);
                        }
                    }

                    // if already refreshing, wait
                    return new Promise((resolve, reject) => {
                        refreshQueue.current.push((err, newToken) => {
                            if (err) return reject(err);
                            original._retry = true;
                            original.headers.Authorization = `Bearer ${newToken}`;
                            resolve(axios(original));
                        });
                    });
                }

                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.request.eject(reqInterceptor);
            api.interceptors.response.eject(resInterceptor);
        };
    }, [accessToken]);

    function updateAccessToken(token, user) {
        setAccessToken(token);
        setUser(user);
    }


    // Attempt a silent refresh on first mount (if a valid refresh cookie exists)
    // Refresh only once at startup
    useEffect(() => {
        const doRefresh = async () => {
            if (isRefreshingInitial.current) return; //If initial refresh is true don't attempt token refresh. Token Refresh already attempted.

            isRefreshingInitial.current = true; //If initial refresh is false set to true so it won't attempt refresh again
            try {
                const response = await axios.post(`${VITE_BE_URL}/auth/token/refresh`, {}, { withCredentials: true });
                setAccessToken(response.data.accessToken);
                setUser(response.data.user);
            } catch (err) {
                setAccessToken(null);
            } finally {
                isRefreshingInitial.current = false;
            }
        };

        doRefresh();
    }, []);

    const ctxValue = useMemo(() => ({
        user,
        accessToken,   // intentionally in memory only
        updateAccessToken,
        api,           // use this for authed API calls
        isAuthenticated: !!user && !!accessToken,
    }), [user, accessToken, api]);


    return <AuthContext.Provider value={ctxValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
