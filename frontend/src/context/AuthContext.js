"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({})
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erros, setErrors] = useState({})
  const API_URL = process.env.APPI_URL || "http://localhost:5000"

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
    }
    setLoading(false)
  }, [])

  const fetchUserDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/user-details`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const data = await response.json();

            if (response.ok) {
                // Normalize path once
                const userWithCleanPath = {
                    ...data.user,
                    profilePicture: data.user.profile_picture?.replace(/\\/g, "/"),
                };

                setUser(userWithCleanPath);
            }
        } catch (error) {
            setErrors("Unable to fetch user details")
        }
    }

    useEffect(()=>{
      fetchUserDetails()
    },[token])

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
