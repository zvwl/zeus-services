import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { motion, useAnimation } from 'motion/react'

// ==================== DOLLAR SIGN ICON ====================
const DOLLAR_MAIN_VARIANTS = {
  normal: { opacity: 1, pathLength: 1, transition: { duration: 0.4, opacity: { duration: 0.1 } } },
  animate: { opacity: [0, 1], pathLength: [0, 1], transition: { duration: 0.6, opacity: { duration: 0.1 } } },
}

const DOLLAR_SECONDARY_VARIANTS = {
  normal: { opacity: 1, pathLength: 1, pathOffset: 0, transition: { delay: 0.3, duration: 0.3, opacity: { duration: 0.1, delay: 0.3 } } },
  animate: { opacity: [0, 1], pathLength: [0, 1], pathOffset: [1, 0], transition: { delay: 0.5, duration: 0.4, opacity: { duration: 0.1, delay: 0.5 } } },
}

export const DollarSignIcon = forwardRef(({ className = '', size = 20 }, ref) => {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  useImperativeHandle(ref, () => {
    isControlledRef.current = true
    return {
      startAnimation: () => controls.start('animate'),
      stopAnimation: () => controls.start('normal'),
    }
  }, [controls])

  const handleMouseEnter = useCallback(() => {
    if (!isControlledRef.current) controls.start('animate')
  }, [controls])

  const handleMouseLeave = useCallback(() => {
    if (!isControlledRef.current) controls.start('normal')
  }, [controls])

  return (
    <span className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <svg fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <motion.path animate={controls} initial="normal" d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" variants={DOLLAR_MAIN_VARIANTS} />
        <motion.path animate={controls} initial="normal" d="M12 22 L12 2" variants={DOLLAR_SECONDARY_VARIANTS} />
      </svg>
    </span>
  )
})

DollarSignIcon.displayName = 'DollarSignIcon'

// ==================== EURO ICON ====================
const EURO_MAIN_VARIANTS = {
  normal: { opacity: 1, pathLength: 1, transition: { duration: 0.4, opacity: { duration: 0.1 } } },
  animate: { opacity: [0, 1], pathLength: [0, 1], transition: { duration: 0.6, opacity: { duration: 0.1 } } },
}

const EURO_SECONDARY_VARIANTS = {
  normal: { opacity: 1, pathLength: 1, pathOffset: 0, transition: { delay: 0.3, duration: 0.3, opacity: { duration: 0.1, delay: 0.3 } } },
  animate: { opacity: [0, 1], pathLength: [0, 1], pathOffset: [1, 0], transition: { delay: 0.5, duration: 0.4, opacity: { duration: 0.1, delay: 0.5 } } },
}

export const EuroIcon = forwardRef(({ className = '', size = 20 }, ref) => {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  useImperativeHandle(ref, () => {
    isControlledRef.current = true
    return {
      startAnimation: () => controls.start('animate'),
      stopAnimation: () => controls.start('normal'),
    }
  }, [controls])

  const handleMouseEnter = useCallback(() => {
    if (!isControlledRef.current) controls.start('animate')
  }, [controls])

  const handleMouseLeave = useCallback(() => {
    if (!isControlledRef.current) controls.start('normal')
  }, [controls])

  return (
    <span className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <svg fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <motion.path animate={controls} initial="normal" d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" variants={EURO_MAIN_VARIANTS} />
        <motion.path animate={controls} initial="normal" d="M16 10h-12" variants={EURO_SECONDARY_VARIANTS} />
        <motion.path animate={controls} initial="normal" d="M13 14h-9" variants={EURO_SECONDARY_VARIANTS} />
      </svg>
    </span>
  )
})

EuroIcon.displayName = 'EuroIcon'

// ==================== POUND STERLING ICON ====================
const POUND_MAIN_VARIANTS = {
  normal: { opacity: 1, pathLength: 1, transition: { duration: 0.4, opacity: { duration: 0.1 } } },
  animate: { opacity: [0, 1], pathLength: [0, 1], transition: { duration: 0.6, opacity: { duration: 0.1 } } },
}

const POUND_SECONDARY_VARIANTS = {
  normal: { opacity: 1, pathLength: 1, pathOffset: 0, transition: { delay: 0.3, duration: 0.3, opacity: { duration: 0.1, delay: 0.3 } } },
  animate: { opacity: [0, 1], pathLength: [0, 1], pathOffset: [1, 0], transition: { delay: 0.5, duration: 0.4, opacity: { duration: 0.1, delay: 0.5 } } },
}

export const PoundSterlingIcon = forwardRef(({ className = '', size = 20 }, ref) => {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  useImperativeHandle(ref, () => {
    isControlledRef.current = true
    return {
      startAnimation: () => controls.start('animate'),
      stopAnimation: () => controls.start('normal'),
    }
  }, [controls])

  const handleMouseEnter = useCallback(() => {
    if (!isControlledRef.current) controls.start('animate')
  }, [controls])

  const handleMouseLeave = useCallback(() => {
    if (!isControlledRef.current) controls.start('normal')
  }, [controls])

  return (
    <span className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <svg fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <motion.path animate={controls} initial="normal" d="M18 7c0-5.333-8-5.333-8 0" variants={POUND_MAIN_VARIANTS} />
        <motion.path animate={controls} initial="normal" d="M10 7v14" variants={POUND_MAIN_VARIANTS} />
        <motion.path animate={controls} initial="normal" d="M18 21h-12" variants={POUND_SECONDARY_VARIANTS} />
        <motion.path animate={controls} initial="normal" d="M16 13h-10" variants={POUND_SECONDARY_VARIANTS} />
      </svg>
    </span>
  )
})

PoundSterlingIcon.displayName = 'PoundSterlingIcon'
