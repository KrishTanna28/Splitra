import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext"
import { AuthProvider } from "./context/AuthContext"
import { AppProvider } from "./context/AppContext"
import LandingPage from "./pages/LandingPage"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import GroupPage from "./pages/GroupPage"
import RecurringContributions from "./pages/RecurringContributions"
import ProtectedRoute from "./components/ProtectedRoute"
import "./styles/global.css"
import "./styles/themes.css"


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/group/:groupId"
                  element={
                    <ProtectedRoute>
                      <GroupPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recurring"
                  element={
                    <ProtectedRoute>
                      <RecurringContributions />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
