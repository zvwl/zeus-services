import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check } from 'lucide-react'
import './FlyingCartAnimation.css'

export default function FlyingCartAnimation({ isActive, itemIcon, onComplete }) {
  const [buttonPosition, setButtonPosition] = useState({ x: -1, y: -1 })
  const [cartPosition, setCartPosition] = useState({ x: -1, y: -1 })
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isActive) return

    // Function to calculate positions
    const calculatePositions = () => {
      // Find the "Add to Cart" button position
      const button = document.querySelector('.cta-button')
      if (button) {
        const buttonRect = button.getBoundingClientRect()
        // Use viewport coordinates for fixed positioning
        setButtonPosition({
          x: buttonRect.left + buttonRect.width / 2,
          y: buttonRect.top + buttonRect.height / 2
        })
      }

      // Find the cart button in header
      const cartBtn = document.querySelector('.cart-button')
      if (cartBtn) {
        const cartRect = cartBtn.getBoundingClientRect()
        // Use viewport coordinates for fixed positioning
        setCartPosition({
          x: cartRect.left + cartRect.width / 2,
          y: cartRect.top + cartRect.height / 2
        })
      }
    }

    // Wait for render, then calculate positions
    requestAnimationFrame(() => {
      calculatePositions()
      // Double-check after a small delay
      setTimeout(calculatePositions, 100)
    })

    return () => {}
  }, [isActive])

  const deltaX = cartPosition.x - buttonPosition.x
  const deltaY = cartPosition.y - buttonPosition.y
  
  // Only show animation if we have valid positions
  const hasValidPositions = buttonPosition.x > 0 && buttonPosition.y > 0 && 
                            cartPosition.x > 0 && cartPosition.y > 0
  
  // Calculate animation duration based on distance (but keep it reasonable)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const duration = Math.max(0.4, Math.min(0.7, distance / 800))
  
  // Adjust scale based on viewport size
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
  const isMobile = viewportWidth < 768
  const isTablet = viewportWidth < 1024 && viewportWidth >= 768
  const initialScale = isMobile ? 1 : isTablet ? 1.1 : 1.2
  const finalScale = isMobile ? 0.5 : 0.4
  const arcHeight = isMobile ? 80 : isTablet ? 100 : 120

  return (
    <AnimatePresence>
      {isActive && hasValidPositions && (
        <motion.div
          className="flying-cart-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          ref={containerRef}
        >
          {/* Burst effect at start position */}
          <motion.div
            className="burst-effect"
            initial={{ 
              scale: 0.5, 
              opacity: 1
            }}
            animate={{ 
              scale: 2.5, 
              opacity: 0
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: `${buttonPosition.x}px`,
              top: `${buttonPosition.y}px`,
              zIndex: 9997,
              pointerEvents: 'none'
            }}
          />

          <motion.div
            className="flying-item"
            initial={{
              left: buttonPosition.x,
              top: buttonPosition.y,
              scale: initialScale,
              opacity: 1
            }}
            animate={{
              left: cartPosition.x,
              top: cartPosition.y,
              scale: finalScale,
              opacity: 0
            }}
            transition={{
              duration: duration,
              ease: [0.33, 0, 0.2, 1],
              delay: 0.1
            }}
            onAnimationComplete={onComplete}
            style={{
              position: 'fixed',
              marginLeft: '-60px',
              marginTop: '-60px',
              zIndex: 9999,
              pointerEvents: 'none',
              willChange: 'transform, opacity'
            }}
          >
            <motion.div
              className="flying-item-content"
              animate={{
                rotate: 360,
                scale: 1
              }}
              transition={{
                duration: duration,
                ease: 'linear',
                delay: 0.1
              }}
            >
              {itemIcon ? (
                <img src={itemIcon} alt="flying item" className="flying-item-icon" />
              ) : (
                <div className="flying-item-placeholder">
                  <Check size={16} strokeWidth={2.5} />
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Particle effects along the path */}
          <motion.div
            className="particle-trail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration, delay: 0.1 }}
            style={{
              position: 'fixed',
              left: `${buttonPosition.x}px`,
              top: `${buttonPosition.y}px`,
              zIndex: 9998
            }}
          >
            {[0, 0.2, 0.4, 0.6, 0.8].map((progress) => {
              const particleDeltaX = (cartPosition.x - buttonPosition.x) * progress
              const particleDeltaY = (cartPosition.y - buttonPosition.y) * progress - (arcHeight * progress * (1 - progress))
              
              return (
                <motion.div
                  key={progress}
                  className="particle"
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 1.2
                  }}
                  animate={{
                    x: particleDeltaX,
                    y: particleDeltaY,
                    opacity: 0,
                    scale: 0.3
                  }}
                  transition={{
                    duration: duration,
                    delay: 0.1 + (progress * (duration * 0.08)),
                    ease: [0.33, 0, 0.2, 1]
                  }}
                />
              )
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
