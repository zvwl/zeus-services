import { useState, cloneElement } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import './Accordion.css'

export function Accordion({ children, className = '' }) {
  return <div className={`accordion ${className}`}>{children}</div>
}

export function AccordionItem({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const childArray = Array.isArray(children) ? children : [children]
  const button = childArray.find(child => child?.type === AccordionButton)
  const panel = childArray.find(child => child?.type === AccordionPanel)

  return (
    <div className="accordion-item">
      {button && cloneElement(button, { isOpen, onClick: () => setIsOpen(!isOpen) })}
      <AnimatePresence initial={false}>
        {isOpen && panel}
      </AnimatePresence>
    </div>
  )
}

export function AccordionButton({ children, showArrow = true, isOpen, onClick }) {
  return (
    <button className="accordion-button" type="button" onClick={onClick}>
      <span className="accordion-button-text">{children}</span>
      {showArrow && (
        <motion.span
          className="accordion-arrow"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          ▼
        </motion.span>
      )}
    </button>
  )
}

export function AccordionPanel({ children, keepRendered = false, transition = { type: 'spring', stiffness: 150, damping: 22 } }) {
  return (
    <motion.div
      className="accordion-panel"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={transition}
      style={{ overflow: 'hidden' }}
    >
      <div className="accordion-panel-content">{children}</div>
    </motion.div>
  )
}
