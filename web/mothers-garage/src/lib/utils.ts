import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to readable string
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// Check if passwords match
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword
}

// Validate phone number
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic validation for international phone numbers
  // Accepts formats like +256700000000, +1-555-555-5555, etc.
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  return phoneRegex.test(phoneNumber)
}

// Format phone number
export function formatPhoneNumber(phoneNumber: string): string {
  // Basic formatting for display purposes
  if (!phoneNumber) return ""

  // Remove non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, "")

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
  }

  return phoneNumber
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

// Get initials from name
export function getInitials(name: string): string {
  if (!name) return ""

  const names = name.split(" ")
  if (names.length === 1) return names[0].charAt(0).toUpperCase()

  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
}

// Currency conversion rates
export const CURRENCY_CONVERSION_RATES = {
  Uganda: 3800, // 1 USD = 3800 UGX
  Canada: 1.39, // 1 USD = 1.39 CAD
  default: 1, // Default is USD
}

// Currency symbols
export const CURRENCY_SYMBOLS = {
  Uganda: "UGX",
  Canada: "CAD",
  default: "$",
}

// Format price based on country
export function formatPriceForCountry(priceUSD: number, country?: string): string {
  if (!country) return `$${priceUSD}`

  const rate =
    CURRENCY_CONVERSION_RATES[country as keyof typeof CURRENCY_CONVERSION_RATES] || CURRENCY_CONVERSION_RATES.default

  const symbol = CURRENCY_SYMBOLS[country as keyof typeof CURRENCY_SYMBOLS] || CURRENCY_SYMBOLS.default

  const convertedPrice = priceUSD * rate

  // Format with commas for thousands
  const formattedPrice = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: country === "Uganda" ? 0 : 2,
    maximumFractionDigits: country === "Uganda" ? 0 : 2,
  }).format(convertedPrice)

  return `${symbol} ${formattedPrice}`
}
