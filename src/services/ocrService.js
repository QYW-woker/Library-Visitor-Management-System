/**
 * OCR Service using Coze Workflow API
 * 扣子工作流OCR服务
 */

// Coze API configuration
const COZE_CONFIG = {
  // 扣子工作流API地址
  apiUrl: import.meta.env.VITE_COZE_API_URL || 'https://api.coze.cn/v1/workflow/run',
  // 工作流ID
  workflowId: import.meta.env.VITE_COZE_WORKFLOW_ID || '',
  // API密钥
  apiKey: import.meta.env.VITE_COZE_API_KEY || ''
}

/**
 * 将Base64图片发送到扣子工作流进行OCR识别
 * @param {string} base64Image - Base64编码的图片
 * @returns {Promise<object>} OCR识别结果
 */
export async function recognizeChineseId(base64Image) {
  if (!COZE_CONFIG.workflowId || !COZE_CONFIG.apiKey) {
    console.warn('Coze API not configured, using mock data')
    return mockOcrResult()
  }

  try {
    // 移除Base64前缀 (data:image/jpeg;base64,)
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '')

    const response = await fetch(COZE_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        workflow_id: COZE_CONFIG.workflowId,
        parameters: {
          image: imageData,
          // 或者如果扣子需要完整的data URL
          image_url: base64Image
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Coze API error: ${response.status}`)
    }

    const result = await response.json()

    // 解析扣子返回的结果
    return parseCozeResult(result)
  } catch (error) {
    console.error('OCR recognition failed:', error)
    return {
      success: false,
      error: error.message,
      fields: {}
    }
  }
}

/**
 * 解析扣子工作流返回的结果
 * @param {object} cozeResult - 扣子API返回的原始结果
 * @returns {object} 标准化的OCR结果
 */
function parseCozeResult(cozeResult) {
  try {
    // 扣子工作流的返回格式可能需要根据实际配置调整
    const data = cozeResult.data || cozeResult.output || cozeResult

    // 尝试解析JSON字符串（如果返回的是字符串）
    let parsed = data
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data)
      } catch {
        parsed = data
      }
    }

    // 映射字段 - 根据扣子工作流的实际输出调整
    return {
      success: true,
      confidence: parsed.confidence || parsed.score || 95,
      fields: {
        fullName: parsed.name || parsed.姓名 || parsed.fullName || '',
        idNumber: parsed.id_number || parsed.身份证号 || parsed.idNumber || parsed.公民身份号码 || '',
        gender: parseGender(parsed.gender || parsed.性别 || ''),
        ethnicity: parsed.ethnicity || parsed.民族 || '',
        dateOfBirth: parsed.birth || parsed.出生 || parsed.dateOfBirth || parsed.birthday || '',
        address: parsed.address || parsed.住址 || ''
      },
      rawData: cozeResult
    }
  } catch (error) {
    console.error('Failed to parse Coze result:', error)
    return {
      success: false,
      error: 'Failed to parse OCR result',
      fields: {}
    }
  }
}

/**
 * 解析性别字段
 */
function parseGender(gender) {
  if (!gender) return ''
  const g = gender.toString().toLowerCase()
  if (g === '男' || g === 'male' || g === 'm') return 'MALE'
  if (g === '女' || g === 'female' || g === 'f') return 'FEMALE'
  return ''
}

/**
 * Mock OCR result for testing when API is not configured
 */
function mockOcrResult() {
  return {
    success: true,
    confidence: 0,
    isMock: true,
    fields: {
      fullName: '',
      idNumber: '',
      gender: '',
      ethnicity: '',
      dateOfBirth: '',
      address: ''
    }
  }
}

/**
 * 检查OCR服务是否已配置
 */
export function isOcrConfigured() {
  return !!(COZE_CONFIG.workflowId && COZE_CONFIG.apiKey)
}

/**
 * 获取OCR配置状态
 */
export function getOcrStatus() {
  return {
    configured: isOcrConfigured(),
    provider: 'Coze',
    workflowId: COZE_CONFIG.workflowId ? '已配置' : '未配置',
    apiKey: COZE_CONFIG.apiKey ? '已配置' : '未配置'
  }
}
