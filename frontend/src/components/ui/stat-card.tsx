import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  icon: ReactNode
  value: string | number
  label: string
  trend?: {
    value: number
    type: 'up' | 'down' | 'neutral'
  }
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red'
  delay?: number
  onClick?: () => void
}

export default function StatCard({ 
  icon, 
  value, 
  label, 
  trend, 
  color = 'blue',
  delay = 0,
  onClick
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  }
  
  const trendIcon = trend?.type === 'up' ? TrendingUp : 
                    trend?.type === 'down' ? TrendingDown : Minus
  
  const trendColor = trend?.type === 'up' ? 'text-emerald-400' : 
                     trend?.type === 'down' ? 'text-red-400' : 'text-gray-400'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`card-modern glass p-6 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className={`p-3 rounded-xl ${colorClasses[color]} bg-opacity-10`}
        >
          <div className={`${colorClasses[color].replace('bg-', 'text-')}`}>
            {icon}
          </div>
        </motion.div>
        
        {trend && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
            className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}
          >
            {React.createElement(trendIcon, { className: 'h-4 w-4' })}
            <span>{Math.abs(trend.value)}%</span>
          </motion.div>
        )}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.1 }}
        className="text-3xl font-bold tracking-tight mb-1"
      >
        {value}
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
        className="text-sm text-gray-500 font-medium"
      >
        {label}
      </motion.div>
    </motion.div>
  )
}