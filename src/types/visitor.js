/**
 * Visitor Types and Constants
 */

export const VisitorType = {
  SAUDI: 'SAUDI',
  FOREIGN: 'FOREIGN'
}

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE'
}

export const VisitorStatus = {
  ACTIVE: 'ACTIVE',
  EXITED: 'EXITED',
  CANCELLED: 'CANCELLED'
}

/**
 * Countries list with flags
 */
export const COUNTRIES = [
  { code: 'SA', flag: '🇸🇦' },
  { code: 'AE', flag: '🇦🇪' },
  { code: 'KW', flag: '🇰🇼' },
  { code: 'BH', flag: '🇧🇭' },
  { code: 'QA', flag: '🇶🇦' },
  { code: 'OM', flag: '🇴🇲' },
  { code: 'EG', flag: '🇪🇬' },
  { code: 'JO', flag: '🇯🇴' },
  { code: 'US', flag: '🇺🇸' },
  { code: 'GB', flag: '🇬🇧' },
  { code: 'DE', flag: '🇩🇪' },
  { code: 'FR', flag: '🇫🇷' },
  { code: 'IT', flag: '🇮🇹' },
  { code: 'ES', flag: '🇪🇸' },
  { code: 'TR', flag: '🇹🇷' },
  { code: 'IN', flag: '🇮🇳' },
  { code: 'PK', flag: '🇵🇰' },
  { code: 'PH', flag: '🇵🇭' },
  { code: 'ID', flag: '🇮🇩' },
  { code: 'MY', flag: '🇲🇾' },
  { code: 'SG', flag: '🇸🇬' },
  { code: 'CN', flag: '🇨🇳' },
  { code: 'JP', flag: '🇯🇵' },
  { code: 'KR', flag: '🇰🇷' },
  { code: 'AU', flag: '🇦🇺' },
  { code: 'CA', flag: '🇨🇦' },
  { code: 'OTHER', flag: '🌍' }
]

/**
 * Get country flag by code
 */
export function getCountryFlag(code) {
  const country = COUNTRIES.find(c => c.code === code)
  return country ? country.flag : '🌍'
}

/**
 * Create a new visitor object with defaults
 */
export function createVisitorObject(data) {
  const now = new Date()
  const visitDate = now.toISOString().split('T')[0]
  const entryTime = now.toTimeString().split(' ')[0]

  return {
    id: generateId(),
    visitorType: data.visitorType,
    fullName: data.fullName,
    mobileNumber: data.mobileNumber || null,

    // Saudi fields
    nationalId: data.nationalId || null,
    nationalIdScanned: data.nationalIdScanned || false,
    nationalIdImage: data.nationalIdImage || null,

    // Foreign fields
    passportNumber: data.passportNumber || null,
    nationality: data.nationality || null,
    nationalityName: data.nationalityName || null,
    dateOfBirth: data.dateOfBirth || null,
    gender: data.gender || null,
    passportExpiry: data.passportExpiry || null,
    passportImageUrl: data.passportImageUrl || null,

    // OCR fields
    ocrUsed: data.ocrUsed || false,
    ocrConfidence: data.ocrConfidence || null,
    ocrRawData: data.ocrRawData || null,

    // System fields
    visitDate,
    entryTime,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: null,

    // Status
    status: VisitorStatus.ACTIVE,
    exitTime: null,
    notes: null
  }
}

/**
 * Generate a simple unique ID
 */
function generateId() {
  return 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
