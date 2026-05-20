import './ServiceCard.css'
import { ShoppingCart, Eye } from 'lucide-react'

export default function ServiceCard({
  item,
  onClick,
  onQuickAdd,
  gameIcon,
  isComingSoon = false,
  eagerImage = false,
  formatPrice
}) {
  const data = item
  const cardImage = data.icon || gameIcon || '/zeusservicesPackage.webp'

  const isOutOfStock = data.stock_enabled &&
    !data.stock_unlimited &&
    (data.stock_quantity === null || data.stock_quantity === 0)

  const stockBadgeText = data.stock_enabled && !data.stock_unlimited && data.stock_quantity !== null
    ? `${data.stock_quantity} in stock`
    : null

  const isDisabled = isComingSoon || isOutOfStock

  const handleCardClick = () => {
    if (!isDisabled) onClick?.(data)
  }

  return (
    <div
      className={`sc-card${isDisabled ? ' sc-disabled' : ''}`}
      onClick={handleCardClick}
    >
      {/* ── Image area ── */}
      <div className="sc-img-wrap">
        <img
          src={cardImage}
          alt={data.name}
          className="sc-img"
          loading={eagerImage ? 'eager' : 'lazy'}
          fetchPriority={eagerImage ? 'high' : 'auto'}
          decoding="async"
          onError={(e) => {
            if (e.target.dataset.fb === '1') return
            e.target.dataset.fb = '1'
            e.target.src = gameIcon || '/zeusservicesPackage.webp'
          }}
        />

        {/* Status badges */}
        {isOutOfStock && <span className="sc-badge sc-badge-out">Out of Stock</span>}
        {stockBadgeText && !isOutOfStock && !isComingSoon && (
          <span className="sc-badge sc-badge-stock">{stockBadgeText}</span>
        )}
        {data.featured && !isComingSoon && !isOutOfStock && (
          <span className="sc-badge sc-badge-featured">Featured</span>
        )}
        {isComingSoon && <span className="sc-badge sc-badge-soon">Coming Soon</span>}

        {/* Hover action overlay — slides up from bottom of image */}
        {!isDisabled && (
          <div className="sc-overlay">
            {onQuickAdd && (
              <button
                className="sc-overlay-btn sc-add-btn"
                onClick={(e) => { e.stopPropagation(); onQuickAdd(data) }}
              >
                <ShoppingCart size={16} strokeWidth={2.2} />
                Add to Cart
              </button>
            )}
            <button
              className="sc-overlay-btn sc-view-btn"
              onClick={(e) => { e.stopPropagation(); onClick?.(data) }}
            >
              <Eye size={16} strokeWidth={2.2} />
              View Details
            </button>
          </div>
        )}
      </div>

      {/* ── Info area ── */}
      <div className="sc-info">
        <h3 className="sc-name">{data.name}</h3>
        {data.price && (
          <p className="sc-price">
            {formatPrice ? formatPrice(data.price) : `£${data.price}`}
          </p>
        )}
      </div>
    </div>
  )
}
