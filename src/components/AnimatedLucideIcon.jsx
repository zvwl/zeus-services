import { forwardRef, useImperativeHandle } from 'react'
import { motion, useAnimation } from 'motion/react'

const AnimatedLucideIcon = forwardRef(function AnimatedLucideIcon(
  {
    icon: Icon,
    size = 22,
    className = '',
    strokeWidth = 2,
    animateOnHover = true,
    animateOnTap = true,
    loop = false,
    ...props
  },
  ref
) {
  const controls = useAnimation()

  const startAnimation = () => {
    controls.start({
      scale: [1, 1.08, 1],
      rotate: [0, -7, 7, 0],
      transition: {
        duration: 0.45,
        ease: 'easeInOut',
        repeat: loop ? Infinity : 0,
      },
    })
  }

  const stopAnimation = () => {
    controls.start({
      scale: 1,
      rotate: 0,
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
