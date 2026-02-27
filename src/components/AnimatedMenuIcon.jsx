import { forwardRef, useCallback, useImperativeHandle, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import './AnimatedMenuIcon.css';

const LINE_VARIANTS = {
  normal: {
    rotate: 0,
    y: 0,
    opacity: 1,
  },
  animate: (custom) => ({
    rotate: custom === 1 ? 45 : custom === 3 ? -45 : 0,
    y: custom === 1 ? 6 : custom === 3 ? -6 : 0,
    opacity: custom === 2 ? 0 : 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  }),
};

export const AnimatedMenuIcon = forwardRef(({ onClick, className = '' }, ref) => {
  const controls = useAnimation();
  const isControlledRef = useRef(false);

  // Initialize to normal state on mount
  useEffect(() => {
    controls.set('normal');
  }, [controls]);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;
    
    return {
      startAnimation: () => {
        return controls.start('animate');
      },
      stopAnimation: () => {
        return controls.start('normal');
      },
    };
  });

  const handleClick = useCallback(
    (e) => {
      onClick?.(e);
    },
    [onClick]
  );

  return (
    <button
      className={`animated-menu-button ${className}`}
      onClick={handleClick}
      aria-label="Toggle menu"
      type="button"
    >
      <svg
        fill="none"
        height="28"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="28"
        xmlns="http://www.w3.org/2000/svg"
        className="animated-menu-icon"
      >
        {/* Top line - rotates */}
        <motion.line
          animate={controls}
          initial="normal"
          custom={1}
          variants={LINE_VARIANTS}
          x1="4"
          x2="20"
          y1="6"
          y2="6"
        />
        {/* Middle line - fades out */}
        <motion.line
          animate={controls}
          initial="normal"
          custom={2}
          variants={LINE_VARIANTS}
          x1="4"
          x2="20"
          y1="12"
          y2="12"
        />
        {/* Bottom line - rotates inversely */}
        <motion.line
          animate={controls}
          initial="normal"
          custom={3}
          variants={LINE_VARIANTS}
          x1="4"
          x2="20"
          y1="18"
          y2="18"
        />
      </svg>
    </button>
  );
});

AnimatedMenuIcon.displayName = 'AnimatedMenuIcon';
