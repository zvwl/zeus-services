import { useNavigate } from 'react-router-dom'
import './ServiceCard.css'

export default function ServiceCard({ service, formatPrice, eagerImage = false }) {
  const navigate = useNavigate()

  const handleViewDetails = () => {
    navigate(`/service/${service.id}`, { state: { service } })
  }

  const serviceImage = service.icon || '/zeusservicesPackage.png'
  // Only try WebP conversion if the URL doesn't already have file extension
  const shouldTryWebp = service.icon && !service.icon.endsWith('.png') && !service.icon.endsWith('.jpg') && !service.icon.endsWith('.jpeg')
  const serviceImageWebp = shouldTryWebp ? service.icon.replace(/\.(webp)?$/i, '.webp') : null

  return (
    <div className="service-card" onClick={handleViewDetails}>\n      <picture>\n        {serviceImageWebp && <source type="image/webp" srcSet={serviceImageWebp} />}\n        <img
          src={serviceImage}
          alt={`${service.name} package`}
          className="card-image"
          width="600"
          height="300"
          loading={eagerImage ? "eager" : "lazy"}
          fetchpriority={eagerImage ? "high" : "auto"}
          decoding="async"
          onError={(e) => {
            if (e.target.dataset.fallbackApplied === '1') return
            e.target.dataset.fallbackApplied = '1'
            e.target.src = '/zeusservicesPackage.png'
          }}
        />
      </picture>
      <h2 className="card-title">{service.name}</h2>
      <p className="card-description">{service.description}</p>

      <div className="card-footer">
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
