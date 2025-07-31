"use client"

import { createContext, useContext, useState } from "react"

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [groups, setGroups] = useState([])
  const [expenses, setExpenses] = useState([])
  const [balances, setBalances] = useState([])

  return (
    <AppContext.Provider
      value={{
        groups,
        setGroups,
        expenses,
        setExpenses,
        balances,
        setBalances,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
