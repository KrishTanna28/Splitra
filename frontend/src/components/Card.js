"use client"
import "../styles/card.css"

const Card = ({ children, className = "", onClick, hover = false }) => {
  return (
    <div
      className={`card ${className} ${hover ? "card-hover" : ""} ${onClick ? "card-clickable" : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Card
