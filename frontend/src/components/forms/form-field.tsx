'use client'

import { forwardRef } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
  label?: string
  description?: string
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ name, label, description, className, ...props }, ref) => {
    const { control, formState: { errors } } = useFormContext()
    const error = errors[name]

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            {label && (
              <Label htmlFor={name} className="text-sm font-medium">
                {label}
              </Label>
            )}
            <Input
              {...field}
              {...props}
              ref={ref}
              id={name}
              className={cn(
                error && 'border-red-500 focus:ring-red-500',
                className
              )}
            />
            {description && !error && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
            {error && (
              <p className="text-sm text-red-500">{error.message?.toString()}</p>
            )}
          </div>
        )}
      />
    )
  }
)

FormField.displayName = 'FormField'