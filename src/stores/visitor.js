import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createVisitorObject, VisitorType, VisitorStatus } from '@/types/visitor'

const STORAGE_KEY = 'kfnlai_visitors'

/**
 * Load visitors from localStorage
 */
function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Save visitors to localStorage
 */
function saveToStorage(visitors) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visitors))
}

export const useVisitorStore = defineStore('visitor', () => {
  // State
  const visitors = ref(loadFromStorage())
  const isLoading = ref(false)

  // Getters
  const todayVisitors = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return visitors.value.filter(v => v.visitDate === today)
  })

  const todayStats = computed(() => {
    const today = todayVisitors.value
    return {
      totalVisitors: today.length,
      saudiVisitors: today.filter(v => v.visitorType === VisitorType.SAUDI).length,
      chineseVisitors: today.filter(v => v.visitorType === VisitorType.CHINESE).length,
      foreignVisitors: today.filter(v => v.visitorType === VisitorType.FOREIGN).length,
      currentlyInLibrary: today.filter(v => v.status === VisitorStatus.ACTIVE).length
    }
  })

  // Actions
  function createVisitor(data) {
    const visitor = createVisitorObject(data)
    visitors.value.unshift(visitor)
    saveToStorage(visitors.value)
    return visitor
  }

  function getVisitor(id) {
    return visitors.value.find(v => v.id === id) || null
  }

  function updateVisitor(id, updates) {
    const index = visitors.value.findIndex(v => v.id === id)
    if (index !== -1) {
      visitors.value[index] = {
        ...visitors.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveToStorage(visitors.value)
      return visitors.value[index]
    }
    return null
  }

  function markVisitorExited(id) {
    return updateVisitor(id, {
      status: VisitorStatus.EXITED,
      exitTime: new Date().toTimeString().split(' ')[0]
    })
  }

  function searchVisitors(query) {
    if (!query) return visitors.value

    const lowerQuery = query.toLowerCase()
    return visitors.value.filter(v => {
      return (
        v.fullName?.toLowerCase().includes(lowerQuery) ||
        v.mobileNumber?.includes(query) ||
        v.passportNumber?.toLowerCase().includes(lowerQuery) ||
        v.nationalId?.includes(query)
      )
    })
  }

  function filterVisitors({ type, dateFrom, dateTo, keyword }) {
    let result = visitors.value

    // Filter by type
    if (type && type !== 'ALL') {
      result = result.filter(v => v.visitorType === type)
    }

    // Filter by date range
    if (dateFrom) {
      result = result.filter(v => v.visitDate >= dateFrom)
    }
    if (dateTo) {
      result = result.filter(v => v.visitDate <= dateTo)
    }

    // Filter by keyword
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      result = result.filter(v => {
        return (
          v.fullName?.toLowerCase().includes(lowerKeyword) ||
          v.mobileNumber?.includes(keyword) ||
          v.passportNumber?.toLowerCase().includes(lowerKeyword) ||
          v.nationalId?.includes(keyword)
        )
      })
    }

    return result
  }

  function getRecentVisitors(limit = 10) {
    return visitors.value.slice(0, limit)
  }

  // Initialize with demo data if empty
  function initDemoData() {
    if (visitors.value.length === 0) {
      const demoVisitors = generateDemoVisitors()
      visitors.value = demoVisitors
      saveToStorage(visitors.value)
    }
  }

  return {
    // State
    visitors,
    isLoading,

    // Getters
    todayVisitors,
    todayStats,

    // Actions
    createVisitor,
    getVisitor,
    updateVisitor,
    markVisitorExited,
    searchVisitors,
    filterVisitors,
    getRecentVisitors,
    initDemoData
  }
})

/**
 * Generate demo visitors for testing
 */
function generateDemoVisitors() {
  const today = new Date().toISOString().split('T')[0]
  const names = {
    saudi: ['محمد أحمد', 'عبدالله العتيبي', 'فهد السعيد', 'سارة الشمري', 'نورة القحطاني'],
    foreign: ['John Smith', 'Maria Garcia', 'Ahmed Hassan', 'Li Wei', 'Yuki Tanaka']
  }

  const visitors = []

  // Add Saudi visitors
  names.saudi.forEach((name, i) => {
    visitors.push(createVisitorObject({
      visitorType: VisitorType.SAUDI,
      fullName: name,
      mobileNumber: `+9665${String(i + 1).padStart(8, '0')}`,
      nationalId: `1${String(Math.random()).slice(2, 11)}`
    }))
  })

  // Add Foreign visitors
  const nationalities = ['US', 'EG', 'CN', 'JP', 'GB']
  const nationalityNames = ['United States', 'Egypt', 'China', 'Japan', 'United Kingdom']

  names.foreign.forEach((name, i) => {
    visitors.push(createVisitorObject({
      visitorType: VisitorType.FOREIGN,
      fullName: name,
      passportNumber: `${nationalities[i]}${String(Math.random()).slice(2, 9)}`,
      nationality: nationalities[i],
      nationalityName: nationalityNames[i],
      gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
      ocrUsed: true,
      ocrConfidence: 85 + Math.floor(Math.random() * 15)
    }))
  })

  return visitors
}
