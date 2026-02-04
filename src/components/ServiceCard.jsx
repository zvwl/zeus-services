import { useNavigate } from 'react-router-dom'
import './ServiceCard.css'

export default function ServiceCard({ service, formatPrice }) {
  const navigate = useNavigate()

  const handleViewDetails = () => {
    navigate(`/service/${service.id}`, { state: { service } })
  }

  return (
    <div className="service-card" onClick={handleViewDetails}>
      <picture>
        <source type="image/webp" srcSet="/zeusservicesPackage.webp" />
        <img
          src="/zeusservicesPackage.png"
          alt={`${service.name} package`}
          className="card-image"
          width="600"
          height="300"
          loading="lazy"
          decoding="async"
        />
      </picture>
      <h3 className="card-title">{service.name}</h3>
      <p className="card-description">{service.description}</p>

      <div className="card-footer">
        <span className="card-price">{formatPrice ? formatPrice(service.price) : `$${service.price}`}</span>
        <button
          className="view-details-btn"
          onClick={(e) => { e.stopPropagation(); handleViewDetails(); }}
        >
          View Details
        </button>
      </div>
    </div>
  )
}
