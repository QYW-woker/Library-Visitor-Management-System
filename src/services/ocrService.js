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
 * 将Base64图片转换为Blob并上传到扣子
 */
async function uploadImageToCoze(base64Image) {
  // 去除data URL前缀
  let base64Data = base64Image
  if (base64Data.includes('base64,')) {
    base64Data = base64Data.split('base64,')[1]
  }

  // 转换为Blob
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'image/jpeg' })

  // 创建FormData
  const formData = new FormData()
  formData.append('file', blob, 'id_card.jpg')

  console.log('Uploading image to Coze, size:', blob.size, 'bytes')

  const response = await fetch('https://api.coze.cn/v1/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COZE_CONFIG.apiKey}`
    },
    body: formData
  })

  const result = await response.json()
  console.log('Coze file upload response:', result)

  if (result.code !== 0 || !result.data) {
    throw new Error(`File upload failed: ${result.msg || 'Unknown error'}`)
  }

  // 返回文件信息（包含URL和file_id）
  console.log('Uploaded file info:', result.data)
  return result.data
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
    // 处理base64图片 - 确保有完整的data URL格式
    let imageData = base64Image
    if (!imageData.startsWith('data:')) {
      imageData = `data:image/jpeg;base64,${imageData}`
    }

    console.log('Image data URL length:', imageData.length, 'chars')

    console.log('Calling workflow API with data URL...')

    // 直接传递data URL给input参数
    const requestBody = {
      workflow_id: COZE_CONFIG.workflowId,
      parameters: {
        input: imageData
      }
    }

    console.log('Workflow request body size:', JSON.stringify(requestBody).length, 'bytes')

    const response = await fetch(COZE_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_CONFIG.apiKey}`
      },
      body: JSON.stringify(requestBody)
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
 * 将Base64图片发送到扣子工作流进行沙特身份证OCR识别
 * @param {string} base64Image - Base64编码的图片
 * @returns {Promise<object>} OCR识别结果
 */
export async function recognizeSaudiId(base64Image) {
  if (!COZE_CONFIG.apiKey) {
    console.warn('Coze API not configured, using mock data')
    return mockSaudiOcrResult()
  }

  try {
    // 处理base64图片 - 确保有完整的data URL格式
    let imageData = base64Image
    if (!imageData.startsWith('data:')) {
      imageData = `data:image/jpeg;base64,${imageData}`
    }

    console.log('Saudi ID Image data URL length:', imageData.length, 'chars')
    console.log('Calling workflow API for Saudi ID...')

    // 直接传递data URL给input参数
    const requestBody = {
      workflow_id: COZE_CONFIG.workflowId,
      parameters: {
        input: imageData
      }
    }

    console.log('Workflow request body size:', JSON.stringify(requestBody).length, 'bytes')

    const response = await fetch(COZE_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_CONFIG.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Coze Workflow API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Coze API error response:', errorText)
      throw new Error(`Coze API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Coze Workflow API response for Saudi ID:', result)

    // 解析扣子返回的结果
    return parseSaudiCozeResult(result)
  } catch (error) {
    console.error('Saudi ID OCR recognition failed:', error)
    return {
      success: false,
      error: error.message,
      fields: {}
    }
  }
}

/**
 * 解析扣子工作流返回的沙特身份证结果
 * @param {object} cozeResult - 扣子API返回的原始结果
 * @returns {object} 标准化的OCR结果
 */
function parseSaudiCozeResult(cozeResult) {
  try {
    console.log('Parsing Saudi ID Coze result:', cozeResult)

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

    console.log('Saudi ID OCR text to parse:', outputText)

    // 解析沙特身份证文本格式
    const fields = parseSaudiIdText(outputText)

    return {
      success: true,
      confidence: 95,
      fields,
      rawData: cozeResult
    }
  } catch (error) {
    console.error('Failed to parse Saudi ID Coze result:', error)
    return {
      success: false,
      error: 'Failed to parse OCR result',
      fields: {}
    }
  }
}

/**
 * 解析沙特身份证OCR文本
 * 沙特身份证包含以下字段：
 * - 姓名 (阿拉伯语和英语)
 * - 身份证号 (10位数字，以1或2开头)
 * - 出生日期 (回历格式)
 * - 证件有效期 (回历格式)
 * - 国籍
 */
function parseSaudiIdText(text) {
  const fields = {
    fullName: '',
    fullNameAr: '',
    nationalId: '',
    dateOfBirth: '',
    expiryDate: '',
    nationality: ''
  }

  if (!text) return fields

  // 提取沙特身份证号 (10位数字，以1或2开头)
  const idMatch = text.match(/\b([12]\d{9})\b/)
  if (idMatch) {
    fields.nationalId = idMatch[1]
  }

  // 提取英文姓名 - 多种格式
  // 格式1: "Name: MOHAMMED ABDULLAH"
  // 格式2: "Full Name\nMOHAMMED ABDULLAH"
  // 格式3: 连续的英文大写字母名字
  let nameMatch = text.match(/(?:Name|Full\s*Name|الاسم)[:\s]*([A-Z][A-Za-z\s]+)/i)
  if (nameMatch) {
    fields.fullName = nameMatch[1].trim()
  } else {
    // 尝试匹配大写英文名字（至少两个单词）
    const englishNameMatch = text.match(/\b([A-Z]{2,}(?:\s+[A-Z]{2,})+)\b/)
    if (englishNameMatch) {
      fields.fullName = englishNameMatch[1].trim()
    }
  }

  // 提取阿拉伯语姓名
  const arabicNameMatch = text.match(/[\u0600-\u06FF\s]{4,}/)
  if (arabicNameMatch) {
    // 过滤掉常见的标签词
    const arabicName = arabicNameMatch[0].trim()
    if (!arabicName.includes('الاسم') && !arabicName.includes('تاريخ')) {
      fields.fullNameAr = arabicName
    }
  }

  // 如果没有提取到英文名，使用阿拉伯语名
  if (!fields.fullName && fields.fullNameAr) {
    fields.fullName = fields.fullNameAr
  }

  // 提取日期 - 回历格式 (DD/MM/YYYY 或 YYYY/MM/DD)
  const dateMatches = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/g) || []
  const hijriDateMatches = text.match(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g) || []

  const allDates = [...dateMatches, ...hijriDateMatches]

  // 尝试识别出生日期和有效期
  // 出生日期通常在 "Date of Birth" 或 "تاريخ الميلاد" 后面
  const dobMatch = text.match(/(?:Date\s*of\s*Birth|Birth\s*Date|تاريخ\s*الميلاد|الميلاد)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i)
  if (dobMatch) {
    fields.dateOfBirth = dobMatch[1]
  } else if (allDates.length > 0) {
    fields.dateOfBirth = allDates[0]
  }

  // 提取有效期
  const expiryMatch = text.match(/(?:Expiry|Expiration|انتهاء|تاريخ\s*الانتهاء|صالحة)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i)
  if (expiryMatch) {
    fields.expiryDate = expiryMatch[1]
  } else if (allDates.length > 1) {
    fields.expiryDate = allDates[1]
  }

  // 提取国籍
  const nationalityMatch = text.match(/(?:Nationality|الجنسية)[:\s]*([\u0600-\u06FFa-zA-Z\s]+)/i)
  if (nationalityMatch) {
    fields.nationality = nationalityMatch[1].trim()
  }

  console.log('Parsed Saudi ID fields:', fields)
  return fields
}

/**
 * Mock OCR result for Saudi ID testing when API is not configured
 */
function mockSaudiOcrResult() {
  return {
    success: true,
    confidence: 0,
    isMock: true,
    fields: {
      fullName: '',
      fullNameAr: '',
      nationalId: '',
      dateOfBirth: '',
      expiryDate: '',
      nationality: ''
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
