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

  // Check stock status
  const isOutOfStock = service.stock_enabled && 
    !service.stock_unlimited && 
    (service.stock_quantity === null || service.stock_quantity === 0)
  
  const stockBadgeText = service.stock_enabled && !service.stock_unlimited && service.stock_quantity !== null
    ? `${service.stock_quantity} in stock`
    : null

  return (
    <div className="service-card" onClick={handleViewDetails} style={{ opacity: isOutOfStock ? 0.7 : 1 }}>
      <picture>
        {serviceImageWebp && <source type="image/webp" srcSet={serviceImageWebp} />}
        <img
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
      
      {/* Stock badges */}
      {isOutOfStock && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          padding: '0.4rem 0.85rem',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: '700',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
          zIndex: 2
        }}>
          Out of Stock
        </div>
      )}
      
      {stockBadgeText && !isOutOfStock && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(34, 197, 94, 0.9)',
          color: '#fff',
          padding: '0.3rem 0.75rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
          zIndex: 2
        }}>
          {stockBadgeText}
        </div>
      )}
      
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
