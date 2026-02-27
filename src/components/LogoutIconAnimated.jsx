import { motion, useAnimation } from 'motion/react'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'

export const LogoutIconAnimated = forwardRef(
  ({ onMouseEnter, onMouseLeave, size = 24, ...props }, ref) => {
    const controls = useAnimation()
    const isControlledRef = useRef(false)

    const PATH_VARIANTS = {
      animate: {
        x: 2,
        translateX: [0, -3, 0],
        transition: {
          duration: 0.4,
        },
      },
    }

    useImperativeHandle(ref, () => {
      isControlledRef.current = true
      return {
        startAnimation: () => controls.start('animate'),
        stopAnimation: () => controls.start('normal'),
      }
    })

    const handleMouseEnter = useCallback(
      (e) => {
        if (!isControlledRef.current) {
          controls.start('animate')
        }
        onMouseEnter?.(e)
      },
      [controls, onMouseEnter]
    )

    const handleMouseLeave = useCallback(
      (e) => {
        if (!isControlledRef.current) {
          controls.start('normal')
        }
        onMouseLeave?.(e)
      },
      [controls, onMouseLeave]
    )

    return (
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <motion.polyline animate={controls} points="16 17 21 12 16 7" variants={PATH_VARIANTS} />
          <motion.line animate={controls} x1="21" x2="9" y1="12" y2="12" variants={PATH_VARIANTS} />
        </svg>
      </div>
    )
  }
)

LogoutIconAnimated.displayName = 'LogoutIconAnimated'
