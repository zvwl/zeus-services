import { motion } from 'motion/react'

export default function AnimatedBurgerIcon({ isOpen, size = 28 }) {
  const strokeWidth = 2.5
  const spacing = 7
  const lineLength = size - 8

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        {/* Top line */}
        <motion.line
          x1={-lineLength / 2}
          x2={lineLength / 2}
          y1={0}
          y2={0}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={false}
          animate={
            isOpen
              ? {
                  y: 0,
                  rotate: 45,
                }
              : {
                  y: -spacing,
                  rotate: 0,
                }
          }
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />

        {/* Middle line */}
        <motion.line
          x1={-lineLength / 2}
          x2={lineLength / 2}
          y1={0}
          y2={0}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={false}
          animate={
            isOpen
              ? {
                  opacity: 0,
                  scaleX: 0,
                }
              : {
                  opacity: 1,
                  scaleX: 1,
                }
          }
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />

        {/* Bottom line */}
        <motion.line
          x1={-lineLength / 2}
          x2={lineLength / 2}
          y1={0}
          y2={0}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={false}
          animate={
            isOpen
              ? {
                  y: 0,
                  rotate: -45,
                }
              : {
                  y: spacing,
                  rotate: 0,
                }
          }
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </g>
    </svg>
  )
}
