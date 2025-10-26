// Form validation utilities

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean
  message?: string
}

export interface ValidationErrors {
  [key: string]: string
}

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone validation (Malaysian format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean
  strength: 'weak' | 'medium' | 'strong'
  issues: string[]
} => {
  const issues: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*]/.test(password)) {
    issues.push('Password must contain at least one special character (!@#$%^&*)')
  }

  const issueCount = issues.length
  if (issueCount === 0) {
    strength = 'strong'
  } else if (issueCount <= 2) {
    strength = 'medium'
  }

  return {
    isValid: issues.length === 0,
    strength,
    issues
  }
}

// Generic field validator
export const validateField = (
  value: any,
  rules: ValidationRule
): string | null => {
  if (rules.required && (!value || value.toString().trim() === '')) {
    return rules.message || 'This field is required'
  }

  if (value && rules.minLength && value.toString().length < rules.minLength) {
    return rules.message || `Minimum length is ${rules.minLength} characters`
  }

  if (value && rules.maxLength && value.toString().length > rules.maxLength) {
    return rules.message || `Maximum length is ${rules.maxLength} characters`
  }

  if (value && rules.pattern && !rules.pattern.test(value.toString())) {
    return rules.message || 'Invalid format'
  }

  if (value && rules.custom && !rules.custom(value)) {
    return rules.message || 'Invalid value'
  }

  return null
}

// Validate entire form
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): { isValid: boolean; errors: ValidationErrors } => {
  const errors: ValidationErrors = {}

  Object.keys(rules).forEach(field => {
    const error = validateField(data[field], rules[field])
    if (error) {
      errors[field] = error
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Sanitize input (prevent XSS)
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Validation rules presets
export const commonRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  phone: {
    required: true,
    pattern: /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/,
    message: 'Please enter a valid Malaysian phone number'
  },
  password: {
    required: true,
    minLength: 8,
    message: 'Password must be at least 8 characters long'
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
  },
  required: {
    required: true,
    message: 'This field is required'
  }
}

// React hook for form validation
import { useState } from 'react'

export const useFormValidation = (
  initialData: Record<string, any>,
  validationRules: Record<string, ValidationRule>
) => {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleChange = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))

    // Validate on change if field was touched
    if (touched[field]) {
      const error = validateField(value, validationRules[field] || {})
      setErrors(prev => ({
        ...prev,
        [field]: error || ''
      }))
    }
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(data[field], validationRules[field] || {})
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }))
  }

  const validate = (): boolean => {
    const { isValid, errors: validationErrors } = validateForm(data, validationRules)
    setErrors(validationErrors)

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {}
    Object.keys(validationRules).forEach(field => {
      allTouched[field] = true
    })
    setTouched(allTouched)

    return isValid
  }

  const reset = () => {
    setData(initialData)
    setErrors({})
    setTouched({})
  }

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    isValid: Object.keys(errors).every(key => !errors[key])
  }
}
