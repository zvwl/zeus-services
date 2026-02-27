import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { motion, useAnimation } from 'motion/react'

// ==================== HOME ICON ====================
const HOME_VARIANTS = {
  normal: { pathLength: 1, opacity: 1 },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: { duration: 0.6, opacity: { duration: 0.2 } },
  },
}

export const HomeIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <motion.path animate={controls} initial="normal" d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" variants={HOME_VARIANTS} />
      </svg>
    </span>
  )
})

export const BoostIcon = forwardRef(({ className = '', size = 20 }, ref) => {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  const VARIANTS = {
    normal: { x: 0, y: 0 },
    animate: {
      x: [0, 0, -3, 2, -2, 1, -1, 0],
      y: [0, -3, 0, -2, -3, -1, -2, 0],
      transition: {
        duration: 6,
        ease: 'easeInOut',
        repeat: Number.POSITIVE_INFINITY,
        repeatType: 'reverse',
        times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
      },
    },
  }

  const FIRE_VARIANTS = {
    normal: {
      d: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
    },
    animate: {
      d: [
        'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
        'M4.5 16.5c-1.5 1.26-3 5.5-3 5.5s4.74-1 6-2.5c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
        'M4.5 16.5c-1.5 1.26-2.2 4.8-2.2 4.8s3.94-0.3 5.2-1.8c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
        'M4.5 16.5c-1.5 1.26-2.8 5.2-2.8 5.2s4.54-0.7 5.8-2.2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
        'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
      ],
      transition: {
        duration: 2,
        ease: [0.4, 0, 0.2, 1],
        repeat: Number.POSITIVE_INFINITY,
        times: [0, 0.2, 0.5, 0.8, 1],
      },
    },
  }

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
      <motion.svg
        animate={controls}
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        variants={VARIANTS}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <motion.path animate={controls} d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" variants={FIRE_VARIANTS} />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </motion.svg>
    </span>
  )
})

// ==================== TOPUP / DOLLAR ICON ====================
const DOLLAR_MAIN_VARIANTS = {
  normal: { opacity: 1, pathLength: 1, transition: { duration: 0.4, opacity: { duration: 0.1 } } },
  animate: { opacity: [0, 1], pathLength: [0, 1], transition: { duration: 0.6, opacity: { duration: 0.1 } } },
}

const DOLLAR_SECONDARY_VARIANTS = {
  normal: { opacity: 1, pathLength: 1, pathOffset: 0, transition: { delay: 0.3, duration: 0.3, opacity: { duration: 0.1, delay: 0.3 } } },
  animate: { opacity: [0, 1], pathLength: [0, 1], pathOffset: [1, 0], transition: { delay: 0.5, duration: 0.4, opacity: { duration: 0.1, delay: 0.5 } } },
}

export const TopupIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <circle cx="12" cy="12" r="8" />
        <motion.path animate={controls} initial="normal" d="M9 10.5c0-1 1-2 3-2s3 1 3 2-1 1.5-3 2-3 1-3 2 1 2 3 2 3-1 3-2" variants={DOLLAR_MAIN_VARIANTS} />
        <motion.path animate={controls} initial="normal" d="M12 7v10" variants={DOLLAR_SECONDARY_VARIANTS} />
      </svg>
    </span>
  )
})

// ==================== ACCOUNTS / BOX ICON ====================
export const AccountsIcon = forwardRef(({ className = '', size = 20 }, ref) => {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  const PATH_VARIANTS = {
    normal: { translateX: 0, transition: { type: 'spring', stiffness: 200, damping: 13 } },
    animate: {
      translateX: [-6, 0],
      transition: { delay: 0.1, type: 'spring', stiffness: 200, damping: 13 },
    },
  }

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
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <motion.path animate={controls} d="M22 21v-2a4 4 0 0 0-3-3.87" variants={PATH_VARIANTS} />
        <motion.path animate={controls} d="M16 3.13a4 4 0 0 1 0 7.75" variants={PATH_VARIANTS} />
      </svg>
    </span>
  )
})

// ==================== STAR ICON (REVIEWS) ====================
export const ReviewsIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <motion.polygon animate={controls} initial="normal" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.8 } } }} />
      </svg>
    </span>
  )
})

// ==================== CART ICON ====================
export const CartMenuIcon = forwardRef(({ className = '', size = 20 }, ref) => {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  const CART_VARIANTS = {
    normal: { scale: 1 },
    animate: {
      scale: 1.1,
      y: [0, -5, 0],
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
        y: { repeat: 1, delay: 0.1, duration: 0.4 },
      },
    },
  }

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
      <motion.svg
        animate={controls}
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        transition={{ duration: 0.2 }}
        variants={CART_VARIANTS}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z" />
      </motion.svg>
    </span>
  )
})


// ==================== FAQ / HELP ICON ====================
export const FaqIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <circle cx="12" cy="12" r="10" />
        <motion.path animate={controls} initial="normal" d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.6 } } }} />
        <motion.path animate={controls} initial="normal" d="M12 17h.01" variants={{ normal: { scale: 1 }, animate: { scale: [0, 1.3, 1], transition: { delay: 0.6, duration: 0.3 } } }} />
      </svg>
    </span>
  )
})

// ==================== PROCESS / MAP PIN ICON ====================
export const ProcessIcon = forwardRef(({ className = '', size = 20 }, ref) => {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  const SVG_VARIANTS = {
    normal: { y: 0 },
    animate: {
      y: [0, -5, -3],
      transition: {
        duration: 0.5,
        times: [0, 0.6, 1],
      },
    },
  }

  const CIRCLE_VARIANTS = {
    normal: { opacity: 1 },
    animate: {
      opacity: [0, 1],
      pathLength: [0, 1],
      pathOffset: [0.5, 0],
      transition: {
        delay: 0.3,
        duration: 0.5,
        opacity: { duration: 0.1, delay: 0.3 },
      },
    },
  }

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
      <motion.svg
        animate={controls}
        fill="none"
        height={size}
        initial="normal"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        variants={SVG_VARIANTS}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <motion.circle animate={controls} cx="12" cy="10" initial="normal" r="3" variants={CIRCLE_VARIANTS} />
      </motion.svg>
    </span>
  )
})

// ==================== COMPARISON / BALANCE ICON ====================
export const ComparisonIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <motion.path animate={controls} initial="normal" d="M12 3v18" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.5 } } }} />
        <motion.path animate={controls} initial="normal" d="M6 7h12" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.3, duration: 0.4 } } }} />
        <motion.path animate={controls} initial="normal" d="M4 7l-2 4h4l-2-4Z" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.5, duration: 0.3 } } }} />
        <motion.path animate={controls} initial="normal" d="M20 7l-2 4h4l-2-4Z" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.5, duration: 0.3 } } }} />
      </svg>
    </span>
  )
})

// ==================== SAFETY / SHIELD ICON ====================
export const SafetyIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3Z" />
        <motion.path animate={controls} initial="normal" d="m9 12 2 2 4-4" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.3, duration: 0.5 } } }} />
      </svg>
    </span>
  )
})

// ==================== TRUST / CHECK CIRCLE ICON ====================
export const TrustIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <circle cx="12" cy="12" r="9" />
        <motion.path animate={controls} initial="normal" d="m9 12 2 2 4-4" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.2, duration: 0.5 } } }} />
      </svg>
    </span>
  )
})

// ==================== ORDERS / DOCUMENT ICON ====================
export const OrdersIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <motion.path animate={controls} initial="normal" d="M9 8h6" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.2, duration: 0.3 } } }} />
        <motion.path animate={controls} initial="normal" d="M9 12h6" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.4, duration: 0.3 } } }} />
        <motion.path animate={controls} initial="normal" d="M9 16h4" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.6, duration: 0.3 } } }} />
      </svg>
    </span>
  )
})


// ==================== ADMIN ORDERS ICON ====================
export const AdminOrdersIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <motion.path animate={controls} initial="normal" d="m9 11 2 2 4-4" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.3, duration: 0.5 } } }} />
      </svg>
    </span>
  )
})

// ==================== ADMIN ITEMS ICON ====================
export const AdminItemsIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <motion.path animate={controls} initial="normal" d="M3.3 7 12 12l8.7-5" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.2, duration: 0.4 } } }} />
      </svg>
    </span>
  )
})

// ==================== ADMIN GAMES / GAMEPAD ICON ====================
export const AdminGamesIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <rect x="3" y="9" width="18" height="10" rx="5" />
        <motion.path animate={controls} initial="normal" d="M8 14h4" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.3, duration: 0.3 } } }} />
        <motion.path animate={controls} initial="normal" d="M10 12v4" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.5, duration: 0.3 } } }} />
        <motion.circle animate={controls} initial="normal" cx="16" cy="13" r="1" variants={{ normal: { scale: 1 }, animate: { scale: [0, 1.3, 1], transition: { delay: 0.6, duration: 0.2 } } }} />
        <motion.circle animate={controls} initial="normal" cx="18" cy="15" r="1" variants={{ normal: { scale: 1 }, animate: { scale: [0, 1.3, 1], transition: { delay: 0.7, duration: 0.2 } } }} />
      </svg>
    </span>
  )
})

// ==================== ACTIVITY / CHART ICON ====================
export const ActivityIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <motion.path animate={controls} initial="normal" d="M3 3v18h18" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.5 } } }} />
        <motion.path animate={controls} initial="normal" d="m7 14 3-3 3 2 4-5" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.4, duration: 0.6 } } }} />
      </svg>
    </span>
  )
})

// ==================== LOGIN ICON ====================
export const LoginIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <motion.polyline animate={controls} points="16 17 21 12 16 7" variants={PATH_VARIANTS} />
        <motion.line animate={controls} x1="21" x2="9" y1="12" y2="12" variants={PATH_VARIANTS} />
      </svg>
    </span>
  )
})

// ==================== SIGNUP ICON ====================
export const SignupIcon = forwardRef(({ className = '', size = 20 }, ref) => {
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
        <motion.path animate={controls} initial="normal" d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.5 } } }} />
        <motion.circle animate={controls} initial="normal" cx="8.5" cy="7" r="4" variants={{ normal: { scale: 1, opacity: 1 }, animate: { scale: [0, 1], opacity: [0, 1], transition: { delay: 0.3, duration: 0.4 } } }} />
        <motion.path animate={controls} initial="normal" d="M20 8v6" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.5, duration: 0.3 } } }} />
        <motion.path animate={controls} initial="normal" d="M23 11h-6" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: 0.7, duration: 0.3 } } }} />
      </svg>
    </span>
  )
})

const SETTINGS_VARIANTS = {
  normal: { rotate: 0 },
  animate: { rotate: 180 },
}

export const AnimatedSettingsIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className = '', size = 20, ...props }, ref) => {
    const controls = useAnimation()
    const isControlledRef = useRef(false)

    useImperativeHandle(ref, () => {
      isControlledRef.current = true
      return {
        startAnimation: () => controls.start('animate'),
        stopAnimation: () => controls.start('normal'),
      }
    }, [controls])

    const handleMouseEnter = useCallback(
      (e) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e)
        } else {
          controls.start('animate')
        }
      },
      [controls, onMouseEnter]
    )

    const handleMouseLeave = useCallback(
      (e) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e)
        } else {
          controls.start('normal')
        }
      },
      [controls, onMouseLeave]
    )

    return (
      <span
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          animate={controls}
          initial="normal"
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          transition={{ type: 'spring', stiffness: 50, damping: 10 }}
          variants={SETTINGS_VARIANTS}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </motion.svg>
      </span>
    )
  }
)

AnimatedSettingsIcon.displayName = 'AnimatedSettingsIcon'

const LOGOUT_VARIANTS = {
  animate: {
    x: 2,
    translateX: [0, -3, 0],
    transition: {
      duration: 0.4,
    },
  },
}

export const AnimatedLogoutIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className = '', size = 20, ...props }, ref) => {
    const controls = useAnimation()
    const isControlledRef = useRef(false)

    useImperativeHandle(ref, () => {
      isControlledRef.current = true
      return {
        startAnimation: () => controls.start('animate'),
        stopAnimation: () => controls.start('normal'),
      }
    }, [controls])

    const handleMouseEnter = useCallback(
      (e) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e)
        } else {
          controls.start('animate')
        }
      },
      [controls, onMouseEnter]
    )

    const handleMouseLeave = useCallback(
      (e) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e)
        } else {
          controls.start('normal')
        }
      },
      [controls, onMouseLeave]
    )

    return (
      <span
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
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
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <motion.polyline animate={controls} initial="normal" points="16 17 21 12 16 7" variants={LOGOUT_VARIANTS} />
          <motion.line animate={controls} initial="normal" variants={LOGOUT_VARIANTS} x1="21" x2="9" y1="12" y2="12" />
        </svg>
      </span>
    )
  }
)

AnimatedLogoutIcon.displayName = 'AnimatedLogoutIcon'
