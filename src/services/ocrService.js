/**
 * OCR Service using Coze Workflow API
 * 扣子工作流OCR服务
 */

// Coze Workflow API configuration
const COZE_CONFIG = {
  // 扣子工作流API地址
  apiUrl: 'https://api.coze.cn/v1/workflow/run',
  // 工作流ID
  workflowId: import.meta.env.VITE_COZE_WORKFLOW_ID || '7589912153117851683',
  // API密钥
  apiKey: import.meta.env.VITE_COZE_API_KEY || ''
}

/**
 * 将Base64图片发送到扣子工作流进行OCR识别
 * @param {string} base64Image - Base64编码的图片
 * @returns {Promise<object>} OCR识别结果
 */
export async function recognizeChineseId(base64Image) {
  if (!COZE_CONFIG.apiKey) {
    console.warn('Coze API not configured, using mock data')
    return mockOcrResult()
  }

  try {
    console.log('Sending request to Coze Workflow API...')

    const response = await fetch(COZE_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        workflow_id: COZE_CONFIG.workflowId,
        parameters: {
          input: base64Image
        }
      })
    })

    console.log('Coze Workflow API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Coze API error response:', errorText)
      throw new Error(`Coze API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Coze Workflow API response:', result)

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
    console.log('Parsing Coze result:', cozeResult)

    // 获取输出数据 - 工作流返回格式
    let outputText = ''

    // 工作流API返回格式: { code: 0, data: "..." } 或 { code: 0, data: { output: "..." } }
    if (cozeResult.code === 0 && cozeResult.data) {
      const data = cozeResult.data

      if (typeof data === 'string') {
        // 尝试解析JSON字符串
        try {
          const parsed = JSON.parse(data)
          outputText = parsed.output || parsed.text || data
        } catch {
          outputText = data
        }
      } else if (typeof data === 'object') {
        outputText = data.output || data.text || JSON.stringify(data)
      }
    } else if (cozeResult.data) {
      outputText = typeof cozeResult.data === 'string' ? cozeResult.data : JSON.stringify(cozeResult.data)
    }

    console.log('OCR text to parse:', outputText)

    // 解析身份证文本格式
    const fields = parseChineseIdText(outputText)

    return {
      success: true,
      confidence: 95,
      fields,
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
 * 解析中国身份证OCR文本
 * 格式示例：
 * "公民身份证号码\n4414222000020619\n住址 广东省...\n出生 2000年2月6日\n性别 男\n民族 汉\n姓名 丘文文"
 */
function parseChineseIdText(text) {
  const fields = {
    fullName: '',
    idNumber: '',
    gender: '',
    ethnicity: '',
    dateOfBirth: '',
    address: ''
  }

  if (!text) return fields

  // 提取姓名
  const nameMatch = text.match(/姓名\s*[:：]?\s*([^\n\r,，]+)/i)
  if (nameMatch) {
    fields.fullName = nameMatch[1].trim()
  }

  // 提取身份证号码 (18位数字，最后一位可能是X)
  const idMatch = text.match(/([1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx])/i)
  if (idMatch) {
    fields.idNumber = idMatch[1].toUpperCase()
  }

  // 提取性别
  const genderMatch = text.match(/性别\s*[:：]?\s*(男|女)/i)
  if (genderMatch) {
    fields.gender = genderMatch[1] === '男' ? 'MALE' : 'FEMALE'
  }

  // 提取民族
  const ethnicityMatch = text.match(/民族\s*[:：]?\s*([^\n\r\s,，]+)/i)
  if (ethnicityMatch) {
    fields.ethnicity = ethnicityMatch[1].trim()
  }

  // 提取出生日期 - 多种格式
  let birthMatch = text.match(/出生\s*[:：]?\s*(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/i)
  if (birthMatch) {
    const year = birthMatch[1]
    const month = birthMatch[2].padStart(2, '0')
    const day = birthMatch[3].padStart(2, '0')
    fields.dateOfBirth = `${year}-${month}-${day}`
  } else {
    // 尝试 YYYY-MM-DD 或 YYYY/MM/DD 格式
    birthMatch = text.match(/出生[日期]*\s*[:：]?\s*(\d{4})[-/](\d{1,2})[-/](\d{1,2})/i)
    if (birthMatch) {
      fields.dateOfBirth = `${birthMatch[1]}-${birthMatch[2].padStart(2, '0')}-${birthMatch[3].padStart(2, '0')}`
    }
  }

  // 提取住址
  const addressMatch = text.match(/住址\s*[:：]?\s*([^\n\r]+)/i)
  if (addressMatch) {
    fields.address = addressMatch[1].trim()
  }

  console.log('Parsed fields:', fields)
  return fields
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
  return !!COZE_CONFIG.apiKey
}

/**
 * 获取OCR配置状态
 */
export function getOcrStatus() {
  return {
    configured: isOcrConfigured(),
    provider: 'Coze Workflow',
    workflowId: COZE_CONFIG.workflowId ? '已配置' : '未配置',
    apiKey: COZE_CONFIG.apiKey ? '已配置' : '未配置'
  }
}
