import { motion, useAnimation } from 'motion/react'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'

export const XIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, size = 24, ...props }, ref) => {
    const controls = useAnimation()
    const isControlledRef = useRef(false)

    const PATH_VARIANTS = {
      normal: { opacity: 1, pathLength: 1 },
      animate: { opacity: [0, 1], pathLength: [0, 1] },
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
          <motion.path animate={controls} d="M18 6 6 18" variants={PATH_VARIANTS} />
          <motion.path animate={controls} d="m6 6 12 12" variants={PATH_VARIANTS} transition={{ delay: 0.2 }} />
        </svg>
      </div>
    )
  }
)

XIcon.displayName = 'XIcon'
