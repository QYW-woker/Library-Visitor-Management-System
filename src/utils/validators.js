/**
 * Validation utilities for visitor forms
 */

// Saudi mobile: starts with 05, total 10 digits
export const REGEX_SAUDI_MOBILE = /^(05|5)\d{8}$/

// Saudi National ID: starts with 1 or 2, 10 digits
export const REGEX_SAUDI_NATIONAL_ID = /^[12]\d{9}$/

// Passport: 6-9 alphanumeric characters
export const REGEX_PASSPORT = /^[A-Z0-9]{6,9}$/i

// Name: 2-100 chars, supports Arabic, English, Chinese
export const REGEX_NAME = /^[\u0600-\u06FF\u4e00-\u9fa5A-Za-z\s\-'.]{2,100}$/

// Date: YYYY-MM-DD format
export const REGEX_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validate Saudi mobile number
 * @param {string} mobile - Mobile number (with or without +966)
 * @returns {boolean}
 */
export function validateSaudiMobile(mobile) {
  if (!mobile) return false
  // Remove spaces, dashes, and country code
  const cleaned = mobile.replace(/[\s\-]/g, '').replace(/^\+?966/, '')
  return REGEX_SAUDI_MOBILE.test(cleaned)
}

/**
 * Validate Saudi National ID
 * @param {string} id - National ID number
 * @returns {boolean}
 */
export function validateNationalId(id) {
  if (!id) return false
  return REGEX_SAUDI_NATIONAL_ID.test(id.trim())
}

/**
 * Validate passport number
 * @param {string} passport - Passport number
 * @returns {boolean}
 */
export function validatePassport(passport) {
  if (!passport) return false
  return REGEX_PASSPORT.test(passport.trim())
}

/**
 * Validate name
 * @param {string} name - Full name
 * @returns {boolean}
 */
export function validateName(name) {
  if (!name) return false
  return REGEX_NAME.test(name.trim())
}

/**
 * Validate date format
 * @param {string} date - Date string
 * @returns {boolean}
 */
export function validateDate(date) {
  if (!date) return false
  if (!REGEX_DATE.test(date)) return false

  const parsed = new Date(date)
  return !isNaN(parsed.getTime())
}

/**
 * Check if passport is expired
 * @param {string} expiryDate - Expiry date (YYYY-MM-DD)
 * @returns {boolean}
 */
export function isPassportExpired(expiryDate) {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date()
}

/**
 * Format Saudi mobile for display
 * @param {string} mobile - Raw mobile number
 * @returns {string} - Formatted: 5XX XXX XXXX
 */
export function formatMobileDisplay(mobile) {
  if (!mobile) return ''
  const cleaned = mobile.replace(/[\s\-]/g, '').replace(/^\+?966/, '')
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
  }
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  return cleaned
}

/**
 * Format mobile for storage (with country code)
 * @param {string} mobile - Mobile input
 * @returns {string} - +966XXXXXXXXX
 */
export function formatMobileStorage(mobile) {
  if (!mobile) return ''
  const cleaned = mobile.replace(/[\s\-]/g, '').replace(/^\+?966/, '').replace(/^0/, '')
  return `+966${cleaned}`
}
