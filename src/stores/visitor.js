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

  // Clear all data
  function clearAllData() {
    visitors.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  // Clear all data and regenerate demo data
  function resetWithDemoData() {
    const demoVisitors = generateDemoVisitors()
    visitors.value = demoVisitors
    saveToStorage(visitors.value)
    return demoVisitors.length
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
    initDemoData,
    clearAllData,
    resetWithDemoData
  }
})

/**
 * Generate demo visitors for testing
 */
function generateDemoVisitors() {
  const today = new Date().toISOString().split('T')[0]
  const visitors = []

  // Saudi visitors
  const saudiNames = [
    { name: 'محمد أحمد الغامدي', mobile: '501234567', id: '1087654321' },
    { name: 'عبدالله العتيبي', mobile: '551234567', id: '1098765432' },
    { name: 'فهد السعيد', mobile: '561234567', id: '1076543210' },
    { name: 'سارة الشمري', mobile: '541234567', id: '2087654321' },
    { name: 'نورة القحطاني', mobile: '591234567', id: '2098765432' }
  ]

  saudiNames.forEach((item, i) => {
    const visitor = createVisitorObject({
      visitorType: VisitorType.SAUDI,
      fullName: item.name,
      mobileNumber: `+966${item.mobile}`,
      nationalId: item.id
    })
    // Make some visitors already exited
    if (i >= 3) {
      visitor.status = VisitorStatus.EXITED
      visitor.exitTime = '16:30:00'
    }
    visitors.push(visitor)
  })

  // Chinese visitors
  const chineseVisitors = [
    { name: '张伟', id: '110101199003076543', gender: 'MALE' },
    { name: '李娜', id: '310101198812123456', gender: 'FEMALE' },
    { name: '王芳', id: '440106199505054321', gender: 'FEMALE' }
  ]

  chineseVisitors.forEach((item, i) => {
    const visitor = createVisitorObject({
      visitorType: VisitorType.CHINESE,
      fullName: item.name,
      chineseIdNumber: item.id,
      gender: item.gender,
      ocrUsed: true,
      ocrConfidence: 90 + Math.floor(Math.random() * 10)
    })
    if (i >= 2) {
      visitor.status = VisitorStatus.EXITED
      visitor.exitTime = '15:45:00'
    }
    visitors.push(visitor)
  })

  // Foreign visitors
  const foreignVisitors = [
    { name: 'John Smith', passport: 'US12345678', nationality: 'US', nationalityName: 'United States', gender: 'MALE' },
    { name: 'Emily Johnson', passport: 'GB87654321', nationality: 'GB', nationalityName: 'United Kingdom', gender: 'FEMALE' },
    { name: 'Yuki Tanaka', passport: 'JP98765432', nationality: 'JP', nationalityName: 'Japan', gender: 'FEMALE' },
    { name: 'Ahmed Hassan', passport: 'EG11223344', nationality: 'EG', nationalityName: 'Egypt', gender: 'MALE' },
    { name: 'Maria Garcia', passport: 'ES55667788', nationality: 'ES', nationalityName: 'Spain', gender: 'FEMALE' }
  ]

  foreignVisitors.forEach((item, i) => {
    const visitor = createVisitorObject({
      visitorType: VisitorType.FOREIGN,
      fullName: item.name,
      passportNumber: item.passport,
      nationality: item.nationality,
      nationalityName: item.nationalityName,
      gender: item.gender,
      ocrUsed: true,
      ocrConfidence: 85 + Math.floor(Math.random() * 15)
    })
    if (i >= 3) {
      visitor.status = VisitorStatus.EXITED
      visitor.exitTime = '17:00:00'
    }
    visitors.push(visitor)
  })

  return visitors
}
