import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { motion, useAnimation } from 'motion/react'

export const EyeIcon = forwardRef(({ className = '', size = 20 }, ref) => {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  useImperativeHandle(
    ref,
    () => {
      isControlledRef.current = true
      return {
        startAnimation: () => controls.start('animate'),
        stopAnimation: () => controls.start('normal'),
      }
    },
    [controls]
  )

  const handleMouseEnter = useCallback(() => {
    if (!isControlledRef.current) {
      controls.start('animate')
    }
  }, [controls])

  const handleMouseLeave = useCallback(() => {
    if (!isControlledRef.current) {
      controls.start('normal')
    }
  }, [controls])

  return (
    <span
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
        aria-hidden="true"
      >
        <motion.path
          animate={controls}
          initial="normal"
          d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
          style={{ originY: '50%' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          variants={{
            normal: { scaleY: 1, opacity: 1 },
            animate: { scaleY: [1, 0.1, 1], opacity: [1, 0.3, 1] },
          }}
        />
        <motion.circle
          animate={controls}
          initial="normal"
          cx="12"
          cy="12"
          r="3"
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          variants={{
            normal: { scale: 1, opacity: 1 },
            animate: { scale: [1, 0.3, 1], opacity: [1, 0.3, 1] },
          }}
        />
      </svg>
    </span>
  )
})

EyeIcon.displayName = 'EyeIcon'

export const EyeOffIcon = forwardRef(({ className = '', size = 20 }, ref) => {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  useImperativeHandle(
    ref,
    () => {
      isControlledRef.current = true
      return {
        startAnimation: () => controls.start('animate'),
        stopAnimation: () => controls.start('normal'),
      }
    },
    [controls]
  )

  const handleMouseEnter = useCallback(() => {
    if (!isControlledRef.current) {
      controls.start('animate')
    }
  }, [controls])

  const handleMouseLeave = useCallback(() => {
    if (!isControlledRef.current) {
      controls.start('normal')
    }
  }, [controls])

  return (
    <span
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
        aria-hidden="true"
      >
        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
        <motion.path
          animate={controls}
          initial="normal"
          d="m2 2 20 20"
          variants={{
            normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
            animate: {
              pathLength: [0, 2],
              opacity: [0, 1],
              pathOffset: [0, 2],
              transition: { duration: 0.6 },
            },
          }}
        />
      </svg>
    </span>
  )
})

EyeOffIcon.displayName = 'EyeOffIcon'
