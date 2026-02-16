import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/auth";
const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        axios.get(`${API}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setUser(res.data))
        .catch(() => {
            localStorage.removeItem("token");
            setUser(null);
        })
        .finally(() => setLoading(false));
    }, [token]);

    const register = async (username, email, password) => {
        const res = await axios.post(`${API}/register`, { username, email, password });
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
    };

    const login = async (email, password) => {
        const res = await axios.post(`${API}/login`, { email, password });
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
