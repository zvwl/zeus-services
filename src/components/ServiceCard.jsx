import './ServiceCard.css'
import { ShoppingCart } from 'lucide-react'

export default function ServiceCard({ 
  item,
  onClick,
  onQuickAdd,
  gameIcon,
  isComingSoon = false,
  eagerImage = false,
  formatPrice
}) {
  // Support legacy 'service' prop name
  const data = item

  const cardImage = data.icon || gameIcon || '/zeusservicesPackage.webp'
  
  // Check stock status
  const isOutOfStock = data.stock_enabled && 
    !data.stock_unlimited && 
    (data.stock_quantity === null || data.stock_quantity === 0)
  
  const stockBadgeText = data.stock_enabled && !data.stock_unlimited && data.stock_quantity !== null
    ? `${data.stock_quantity} in stock`
    : null

  const isDisabled = isComingSoon || isOutOfStock

  return (
    <div 
      className="service-card" 
      onClick={() => !isDisabled && onClick?.(data)}
      style={{ 
        cursor: isDisabled ? 'not-allowed' : 'pointer', 
        opacity: isDisabled ? 0.7 : 1 
      }}
    >
      <picture>
        <source type="image/webp" srcSet={cardImage} />
        <img
          src={cardImage}
          alt={data.name}
          className="card-image"
          loading={eagerImage ? "eager" : "lazy"}
          fetchPriority={eagerImage ? "high" : "auto"}
          decoding="async"
          onError={(e) => {
            if (e.target.dataset.fallbackApplied === '1') return
            e.target.dataset.fallbackApplied = '1'
            e.target.src = gameIcon || '/zeusservicesPackage.webp'
          }}
        />
      </picture>
      
      {/* Out of Stock badge */}
      {isOutOfStock && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
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
      
      {/* Stock quantity badge */}
      {stockBadgeText && !isOutOfStock && !isComingSoon && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
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
      
      {/* Featured badge */}
      {data.featured && !isComingSoon && !isOutOfStock && (
        <div className="featured-badge">Featured</div>
      )}
      
      {/* Coming Soon badge */}
      {isComingSoon && (
        <div className="featured-badge" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
          Coming Soon
        </div>
      )}
      
      <h3 className="card-title">{data.name}</h3>
      <p className="card-description">{data.description || ''}</p>

      {/* Platform badges */}
      {data.platforms && data.platforms.length > 0 && (
        <div className="service-platforms">
          {data.platforms.slice(0, 3).map((platform, idx) => (
            <span key={idx} className="platform-badge">{platform}</span>
          ))}
          {data.platforms.length > 3 && (
            <span className="platform-badge">+{data.platforms.length - 3}</span>
          )}
        </div>
      )}

      {/* Price */}
      {data.price && (
        <div className="card-price">
          {formatPrice ? formatPrice(data.price) : `£${data.price}`}
        </div>
      )}

      <div className="card-footer">
        {isComingSoon ? (
          <div style={{
            padding: '0.85rem 1.6rem',
            textAlign: 'center',
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#fbbf24',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Coming Soon
          </div>
        ) : isOutOfStock ? (
          <div style={{
            padding: '0.85rem 1.6rem',
            textAlign: 'center',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Out of Stock
          </div>
        ) : (
          <>
            {onQuickAdd && (
              <button
                className="quick-add-btn"
                onClick={(e) => { 
                  e.stopPropagation()
                  onQuickAdd(data)
                }}
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
            )}
            <button
              className="view-details-btn"
              onClick={(e) => { 
                e.stopPropagation()
                onClick?.(data)
              }}
            >
              View Details
            </button>
          </>
        )}
      </div>
    </div>
  )
}
