import { forwardRef, useImperativeHandle } from 'react'
import { motion, useAnimation } from 'motion/react'

// Animation presets inspired by animate-ui.com
const ANIMATIONS = {
  default: {
    scale: [1, 1.08, 1],
    rotate: [0, -7, 7, 0],
    transition: { duration: 0.45, ease: 'easeInOut' }
  },
  bounce: {
    y: [0, -8, 0, -4, 0],
    transition: { duration: 0.6, ease: 'easeOut' }
  },
  spin: {
    rotate: [0, 360],
    transition: { duration: 0.6, ease: 'easeInOut' }
  },
  pulse: {
    scale: [1, 1.15, 1, 1.1, 1],
    transition: { duration: 0.7, ease: 'easeInOut' }
  },
  shake: {
    x: [0, -8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.5, ease: 'easeInOut' }
  },
  wiggle: {
    rotate: [0, -10, 10, -8, 8, -5, 5, 0],
    transition: { duration: 0.6, ease: 'easeInOut' }
  },
  float: {
    y: [0, -6, 0],
    transition: { duration: 1.2, ease: 'easeInOut' }
  },
  swing: {
    rotate: [0, 15, -15, 10, -10, 5, -5, 0],
    transition: { duration: 0.8, ease: 'easeInOut' }
  },
  flip: {
    rotateY: [0, 180],
    transition: { duration: 0.6, ease: 'easeInOut' }
  },
  zoom: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  slide: {
    x: [0, 8, 0],
    transition: { duration: 0.5, ease: 'easeInOut' }
  }
}

const AnimatedLucideIcon = forwardRef(function AnimatedLucideIcon(
  {
    icon: Icon,
    size = 22,
    className = '',
    strokeWidth = 2,
    animateOnHover = true,
    animateOnTap = true,
    animation = 'default',
    loop = false,
    ...props
  },
  ref
) {
  const controls = useAnimation()

  const startAnimation = () => {
    const animConfig = ANIMATIONS[animation] || ANIMATIONS.default
    controls.start({
      ...animConfig,
      transition: {
        ...animConfig.transition,
        repeat: loop ? Infinity : 0,
      }
    })
  }

  const stopAnimation = () => {
    controls.start({
      scale: 1,
      rotate: 0,
      rotateY: 0,
      x: 0,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' },
    })
  }

  useImperativeHandle(ref, () => ({
    startAnimation,
    stopAnimation,
  }))

  return (
    <motion.span
      className={className}
      animate={controls}
      initial={{ scale: 1, rotate: 0 }}
      whileHover={animateOnHover ? { scale: 1.08, y: -1 } : undefined}
      whileTap={animateOnTap ? { scale: 0.96 } : undefined}
      onMouseEnter={animateOnHover ? startAnimation : undefined}
      onMouseLeave={animateOnHover ? stopAnimation : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      {...props}
    >
      {Icon ? <Icon size={size} strokeWidth={strokeWidth} /> : null}
    </motion.span>
  )
})

export default AnimatedLucideIcon
