import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('nexus_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        axios.get(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setUser(res.data);   // ✅ FIXED HERE
        })
        .catch(() => {
            localStorage.removeItem('nexus_token');
            setUser(null);
        })
        .finally(() => setLoading(false));

    }, [token]);

    const login = async (email, password) => {
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });

        localStorage.setItem('nexus_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);

        return res.data;
    };

    const register = async (username, email, password) => {
        const res = await axios.post(`${API_BASE}/auth/register`, { username, email, password });

        localStorage.setItem('nexus_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);

        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('nexus_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
