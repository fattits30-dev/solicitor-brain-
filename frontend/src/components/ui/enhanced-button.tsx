import { ReactNode, ButtonHTMLAttributes } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  glow?: boolean
  pulse?: boolean
  children: ReactNode
}

type MotionButtonProps = HTMLMotionProps<"button"> & EnhancedButtonProps

export default function EnhancedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  glow = false,
  pulse = false,
  disabled,
  children,
  className = '',
  ...props
}: MotionButtonProps) {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-base rounded-lg gap-2',
    lg: 'px-6 py-3 text-lg rounded-xl gap-3'
  }
  
  const isDisabled = disabled || loading
  
  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${glow ? 'glow-animation' : ''}
        ${pulse && !loading ? 'animate-pulse' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {/* Glow effect */}
      {glow && !isDisabled && (
        <div className="absolute inset-0 rounded-lg bg-blue-500 opacity-20 blur-xl animate-pulse" />
      )}
      
      {/* Loading spinner or icon */}
      {loading ? (
        <Loader2 className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} animate-spin`} />
      ) : icon && iconPosition === 'left' ? (
        <motion.div
          initial={{ rotate: 0 }}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.div>
      ) : null}
      
      {/* Button text */}
      <span className={loading ? 'ml-2' : ''}>{children}</span>
      
      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && (
        <motion.div
          initial={{ x: 0 }}
          whileHover={{ x: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {icon}
        </motion.div>
      )}
      
      {/* Ripple effect on click */}
      {!isDisabled && (
        <motion.span
          className="absolute inset-0 rounded-lg"
          initial={{ opacity: 0 }}
          whileTap={{ 
            opacity: [0, 0.2, 0],
            scale: [1, 1.5, 1.5],
          }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
          }}
        />
      )}
    </motion.button>
  )
}