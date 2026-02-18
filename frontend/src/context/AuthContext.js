"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    // Guard against values that were accidentally saved as the string "undefined"
    if (storedToken && storedToken !== "undefined") setToken(storedToken);
    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.warn('Failed to parse stored user from localStorage, clearing value', err)
        localStorage.removeItem('user')
      }
    }

    setLoading(false);
  }, []);

  const fetchUserDetails = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${REACT_APP_API_URL}/auth/user-details`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json();

      if (response.ok) {
        const userWithCleanPath = {
          ...data.user,
          profilePicture: data.user.profile_picture?.replace(/\\/g, "/"),
        };

        setUser(userWithCleanPath);
      }
    } catch (error) {
      // silently handle
    }
  }, [REACT_APP_API_URL, token])

    useEffect(()=>{
      fetchUserDetails()
    },[token, fetchUserDetails])

  const login = (userData, token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(userData))
    setToken(token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
