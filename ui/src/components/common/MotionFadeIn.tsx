import { ReactNode } from 'react'
import { motion } from 'framer-motion'

type MotionFadeInProps = {
  children: ReactNode
  delay?: number
}

export function MotionFadeIn({ children, delay = 0 }: MotionFadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
    >
      {children}
    </motion.div>
  )
}

