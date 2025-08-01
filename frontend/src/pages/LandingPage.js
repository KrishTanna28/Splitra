"use client"

import { useState , useEffect} from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import Button from "../components/Button"
import Card from "../components/Card"
import "../styles/landing-page.css"
import { useAuth } from "../context/AuthContext"

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const {user} = useAuth()
  const navigate = useNavigate()

  const features = [
    {
      icon: "👥",
      title: "Create Groups",
      description: "Organize expenses with friends, family, or colleagues in dedicated groups",
    },
    {
      icon: "💸",
      title: "Split & Manage Expenses",
      description: "Easily divide bills, track who owes what, and manage expenses in one place",
    },
    {
      icon: "🔁",
      title: "Recurring Expenses",
      description: "Automate regular payments like rent, subscriptions, or shared bills",
    },
  ]

  useEffect(() => {
    if (user) {
      navigate("/dashboard")
    }
  }, [user, navigate])

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <img src="/logo.png" alt="Splitra Logo" className="logo-img" />
            <span className="brand-name">Splitra</span>
          </div>

          <div className={`nav-menu ${mobileMenuOpen ? "nav-menu-open" : ""}`}>
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#how-it-works" className="nav-link">
              How it Works
            </a>
            <button className="theme-toggle-nav" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <Link to="/login" className="nav-cta">
              Sign In
            </Link>
          </div>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Split Bills,
              <br />
              <span className="hero-highlight">Not Friendships</span>
            </h1>
            <p className="hero-description">
              The easiest way to split expenses with friends, family, and colleagues. Track balances, settle payments,
              and keep everyone happy with transparent expense sharing.
            </p>
            <div className="hero-actions">
              <Link to="/register">
                <Button size="large" className="hero-cta-primary">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="large" className="hero-cta-secondary">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="app-preview">
                  <div className="preview-header">
                    <div className="preview-avatar">JD</div>
                    <div className="preview-info">
                      <div className="preview-name">Weekend Trip</div>
                      <div className="preview-members">4 members</div>
                    </div>
                    <div className="preview-amount">₹15,000</div>
                  </div>
                  <div className="preview-expenses">
                    <div className="expense-item">
                      <span className="expense-icon">🏨</span>
                      <span className="expense-desc">Hotel booking</span>
                      <span className="expense-amt">₹8,000</span>
                    </div>
                    <div className="expense-item">
                      <span className="expense-icon">🍽️</span>
                      <span className="expense-desc">Dinner</span>
                      <span className="expense-amt">₹3,200</span>
                    </div>
                    <div className="expense-item">
                      <span className="expense-icon">🚗</span>
                      <span className="expense-desc">Transport</span>
                      <span className="expense-amt">₹2,400</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-container">
          <div className="section-header">
            <h2>Everything you need to split expenses</h2>
            <p>Powerful features designed to make expense sharing effortless and transparent</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <Card key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <h2>How SplitPay Works</h2>
            <p>Get started in just three simple steps</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create a Group</h3>
                <p>Add friends, family, or colleagues to your expense group</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Add Expenses</h3>
                <p>Record expenses and split them among group members</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Settle Up</h3>
                <p>Track who owes what and get smart suggestions to minimize transactions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2>Ready to simplify your expense sharing?</h2>
            <p>Join thousands of users who trust SplitPay for their group expenses</p>
            <div className="cta-actions">
              <Link to="/register">
                <Button size="large" className="cta-primary">
                  Start Splitting Now
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="large">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-bottom">
            <p>&copy; 2025 Splitra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
