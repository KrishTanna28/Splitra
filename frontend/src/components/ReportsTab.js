"use client"

import { useState, useEffect } from "react"
// import { Bar, Line, Doughnut } from 'react-chartjs-2'
// import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, ArcElement, Title, Tooltip, Legend, PointElement } from 'chart.js'
import Card from "./Card"
import Button from "./Button"
import { useNotification } from "../hooks/useNotification"
import NotificationModal from "./NotificationModal"
import { useAuth } from "../context/AuthContext"
import LoadingModal from "./LoadingModal"

// ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, ArcElement, PointElement, Title, Tooltip, Legend)

const ReportsTab = ({ groupId }) => {
  const [summary, setSummary] = useState(null)
  const { notification, hideNotification, showSuccess, showError } = useNotification()
  const { token } = useAuth()
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL
  const [loadingSummary , setLoadingSummary] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true)
      try {
        const today = new Date()
        const month = today.getMonth() + 1
        const year = today.getFullYear()

        const res = await fetch(`${REACT_APP_API_URL}/reports/summary?groupId=${groupId}&month=${month}&year=${year}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })
        const data = await res.json()

        const formattedCategoryBreakdown = (data.categoryBreakdown || []).map(item => ({
          ...item,
          month: item.month.trim(),
          total: parseFloat(item.total)
        }))

        setSummary({
          totalGroupExpenses: data.totalSpending,
          totalSettlements: data.totalSettlements,
          yourContribution: data.yourContribution,
          topSpender: data.topContributors[0]?.name || "N/A",
          topCategory: data.topCategory?.category || "N/A",
          avgPerPerson: data.averagePerPerson,
          contributionData: data.topContributors,
          monthlyBreakdown: data.last3Months.map(item => ({
            month: `${item.month} ${item.year}`,
            amount: item.total
          })),
          categoryBreakdown: formattedCategoryBreakdown
        })
      } catch (err) {
        console.error("Failed to fetch report summary:", err)
      }finally{
        setLoadingSummary(false)
      }
    }

    if (groupId) {
      fetchSummary()
    }
  }, [groupId])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${REACT_APP_API_URL}/reports/export/${groupId}/csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("CSV export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `expenses_${groupId}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      showSuccess("CSV export has been started! Your file will be downloaded shortly.", "Export Started")
    } catch (error) {
      console.error(error)
      showError("Failed to export CSV.")
    }
  }

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`${REACT_APP_API_URL}/reports/export/${groupId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("PDF export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `expenses_${groupId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      showSuccess("PDF export has been started! Your file will be downloaded shortly.", "Export Started")
    } catch (error) {
      console.error(error)
      showError("Failed to export PDF.")
    }
  }

  const months = [...new Set(summary.categoryBreakdown.map(item => item.month))];
  const categories = [...new Set(summary.categoryBreakdown.map(item => item.category))];

  const categoryData = {
    labels: months,
    datasets: categories.map(category => ({
      label: category,
      data: months.map(month => {
        const entry = summary.categoryBreakdown.find(i => i.month === month && i.category === category);
        return entry ? entry.total : 0;
      }),
      backgroundColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    })),
  };

  if (loadingSummary) {
    return <LoadingModal
        isOpen={true}
        message="Fetching Summary"
        type="pulse"
      />
  }

  return (
    <div className="reports-tab">
      <div className="tab-header">
        <h3>Reports & Analytics</h3>
        <div className="export-buttons">
          <Button variant="secondary" onClick={handleExportCSV}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-2"
    viewBox="0 0 24 24"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
  Download CSV
</Button>

<Button variant="secondary" onClick={handleExportPDF}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-2"
    viewBox="0 0 24 24"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
  Download PDF
</Button>

        </div>
      </div>

      <div className="reports-grid">
        <Card className="insights-card">
          <h4>Expense Summary</h4>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Expenses</span>
              <span className="stat-value">{formatCurrency(summary.totalGroupExpenses)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Settlements</span>
              <span className="stat-value">{formatCurrency(summary.totalSettlements)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Your Contribution</span>
              <span className="stat-value">{formatCurrency(summary.yourContribution)}</span>
            </div>
          </div>
        </Card>

        <Card className="insights-card">
          <h4>Insights</h4>
          <div className="insights-list">
            <div className="insight-item">
              <span className="insight-label">Top Spender:</span>
              <span className="insight-value">{summary.topSpender}</span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Top Category:</span>
              <span className="insight-value">{summary.topCategory}</span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Average per person:</span>
              <span className="insight-value">{formatCurrency((summary.avgPerPerson ?? 0))}</span>
            </div>
          </div>
        </Card>

        <Card className="monthly-card">
          <h4>Monthly Breakdown</h4>
          <div className="monthly-list">
            {summary.monthlyBreakdown.map((month, index) => (
              <div key={index} className="monthly-item">
                <span className="month-name">{month.month}</span>
                <span className="month-amount">{formatCurrency(month.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* <Card className="chart-placeholder">
        <Bar data={{
          labels: summary.monthlyBreakdown.map(item => item.month),
          datasets: [{
            label: "Total Spent (₹)",
            data: summary.monthlyBreakdown.map(item => item.amount),
            backgroundColor: "#6366f1",
            borderRadius: 6
          }]
        }} options={{
          responsive: true,
          plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Monthly Expense Trends" },
          },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 100 } } },
        }} />
      </Card>

      <Card className="chart-placeholder">
        <Doughnut data={{
          labels: summary.contributionData.map(d => d.name),
          datasets: [{
            data: summary.contributionData.map(d => d.total_paid),
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
          }]
        }} options={{
          plugins: {
            legend: { position: "top" },
            title: { display: true, text: "This Month's Contributions" }
          }
        }} />
      </Card> */}

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        confirmText={notification.confirmText}
        showCancel={notification.showCancel}
        cancelText={notification.cancelText}
        onConfirm={notification.onConfirm}
      />
    </div>
  )
}

export default ReportsTab
