import { useState } from 'react'
import './ServiceCard.css'

export default function ServiceCard({ service, onAddToCart }) {
  const [platform, setPlatform] = useState('')

  const handleAdd = () => {
    if (!platform) return
    onAddToCart(service, platform)
    setPlatform('')
  }

  return (
    <div className="service-card">
      <img
        src="/zeusservicesPackage.png"
        alt={`${service.name} package`}
        className="card-image"
      />
      <h3 className="card-title">{service.name}</h3>
      <p className="card-description">{service.description}</p>

      <label className="platform-label" htmlFor={`platform-${service.id}`}>
        Choose platform
      </label>
      <select
        id={`platform-${service.id}`}
        className="platform-select"
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
      >
        <option value="">Select a platform</option>
        {service.platforms?.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>

      <div className="card-footer">
        <span className="card-price">${service.price}</span>
        <button
          className="add-to-cart-btn"
          onClick={handleAdd}
          disabled={!platform}
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}
