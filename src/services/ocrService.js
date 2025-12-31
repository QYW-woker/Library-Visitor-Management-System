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
  // 首先尝试严格匹配18位标准格式
  let idMatch = text.match(/([1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx])/i)
  if (idMatch) {
    fields.idNumber = idMatch[1].toUpperCase()
  } else {
    // 备用方案：匹配"身份证号码"后面的15-18位数字（OCR可能漏识别部分数字）
    const fallbackMatch = text.match(/(?:身份证号码?|公民身份证)[^\d]*(\d{15,18}[\dXx]?)/i)
    if (fallbackMatch) {
      fields.idNumber = fallbackMatch[1].toUpperCase()
      console.log('Using fallback ID match:', fields.idNumber)
    } else {
      // 最后尝试：匹配任何连续的15-18位数字
      const anyIdMatch = text.match(/\b(\d{15,18})\b/)
      if (anyIdMatch) {
        fields.idNumber = anyIdMatch[1]
        console.log('Using any digit sequence match:', fields.idNumber)
      }
    }
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
 * 将Base64图片发送到扣子工作流进行护照OCR识别
 * 支持多语言护照识别
 * @param {string} base64Image - Base64编码的图片
 * @returns {Promise<object>} OCR识别结果
 */
export async function recognizePassport(base64Image) {
  if (!COZE_CONFIG.apiKey) {
    console.warn('Coze API not configured, using mock data')
    return mockPassportOcrResult()
  }

  try {
    // 处理base64图片 - 确保有完整的data URL格式
    let imageData = base64Image
    if (!imageData.startsWith('data:')) {
      imageData = `data:image/jpeg;base64,${imageData}`
    }

    console.log('Passport Image data URL length:', imageData.length, 'chars')
    console.log('Calling workflow API for Passport...')

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
    console.log('Coze Workflow API response for Passport:', result)

    // 解析扣子返回的结果
    return parsePassportCozeResult(result)
  } catch (error) {
    console.error('Passport OCR recognition failed:', error)
    return {
      success: false,
      error: error.message,
      fields: {}
    }
  }
}

/**
 * 解析扣子工作流返回的护照结果
 * @param {object} cozeResult - 扣子API返回的原始结果
 * @returns {object} 标准化的OCR结果
 */
function parsePassportCozeResult(cozeResult) {
  try {
    console.log('Parsing Passport Coze result:', cozeResult)

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

    console.log('Passport OCR text to parse:', outputText)

    // 解析护照文本格式
    const fields = parsePassportText(outputText)

    return {
      success: true,
      confidence: 90,
      fields,
      rawData: cozeResult
    }
  } catch (error) {
    console.error('Failed to parse Passport Coze result:', error)
    return {
      success: false,
      error: 'Failed to parse OCR result',
      fields: {}
    }
  }
}

/**
 * 解析护照OCR文本
 * 护照包含以下标准字段：
 * - 姓名 (多语言)
 * - 护照号码
 * - 国籍
 * - 出生日期
 * - 性别
 * - 有效期
 * - MRZ (机器可读区)
 */
function parsePassportText(text) {
  const fields = {
    fullName: '',
    passportNumber: '',
    nationality: '',
    dateOfBirth: '',
    gender: '',
    passportExpiry: '',
    mrz: ''
  }

  if (!text) return fields

  // 提取MRZ区域 (护照底部的两行机器可读代码)
  // MRZ格式: P<国籍代码姓<<名<<<...  第二行包含护照号、出生日期等
  const mrzMatch = text.match(/P[<A-Z]{1,4}[A-Z]+<<[A-Z<]+[\r\n]+[A-Z0-9<]{30,44}/i)
  if (mrzMatch) {
    fields.mrz = mrzMatch[0]
    // 从MRZ提取信息
    const mrzFields = parseMRZ(mrzMatch[0])
    Object.assign(fields, mrzFields)
    console.log('Parsed from MRZ:', mrzFields)
  }

  // 中国护照特定格式: "姓名/Name" 后面跟着中文名和英文名
  // 格式: 姓名/Name\n中文名\n英文名 或 姓名/Name\n中文名\nENGLISH, NAME
  if (!fields.fullName) {
    const chineseNameMatch = text.match(/姓名\/Name[\s\S]*?[\n\r]+([^\n\r]+)[\n\r]+([A-Z][A-Z\s,]+)/i)
    if (chineseNameMatch) {
      // 优先使用英文名
      fields.fullName = chineseNameMatch[2].trim()
      console.log('Matched Chinese passport name format:', fields.fullName)
    }
  }

  // 提取护照号码 - 中国护照格式: 护照号码/Passport No.\nEF1260892
  if (!fields.passportNumber) {
    const passportPatterns = [
      /(?:护照号码?|Passport\s*No\.?)[\/\s\n\r]*([A-Z]{1,2}\d{6,9})/i,
      /(?:Passport\s*(?:No|Number|#)?)[:\s]*([A-Z]{1,2}\d{6,8})/i,
      /\b([A-Z]{1,2}\d{7,8})\b/  // 常见格式如 EF1260892
    ]
    for (const pattern of passportPatterns) {
      const match = text.match(pattern)
      if (match) {
        fields.passportNumber = match[1].toUpperCase()
        break
      }
    }
  }

  // 提取国籍 - 中国护照格式: 国籍/Nationality\n中国/CHINESE 或 Country Code\nCHN
  if (!fields.nationality) {
    const nationalityPatterns = [
      /(?:国籍|Nationality)[\/\s\n\r]*(?:中国\/)?([A-Z]{2,10})/i,
      /(?:Country\s*Code)[\/\s\n\r]*([A-Z]{2,3})/i,
      /国家\/Country\s*Code[\s\n\r]+([A-Z]{2,3})/i
    ]
    for (const pattern of nationalityPatterns) {
      const match = text.match(pattern)
      if (match) {
        let nat = match[1].trim().toUpperCase()
        // 转换为2位国家代码
        nat = convertToIso2(nat)
        fields.nationality = nat
        break
      }
    }
  }

  // 如果从MRZ获取的国籍是3位代码，也要转换
  if (fields.nationality && fields.nationality.length === 3) {
    fields.nationality = convertToIso2(fields.nationality)
  }

  // 提取出生日期 - 格式: 出生日期/Date of birth\n20 MAR 1985
  if (!fields.dateOfBirth) {
    const dobPatterns = [
      /(?:出生日期|Date\s*of\s*birth)[\/\s\n\r]*(\d{1,2}\s*[A-Z]{3}\s*\d{4})/i,
      /(?:出生日期|Date\s*of\s*birth)[\/\s\n\r]*(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i,
      /(?:出生日期|Date\s*of\s*birth)[\/\s\n\r]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(?:DOB|Birth)[:\s]*(\d{1,2}\s*[A-Z]{3}\s*\d{4})/i
    ]
    for (const pattern of dobPatterns) {
      const match = text.match(pattern)
      if (match) {
        fields.dateOfBirth = normalizeDate(match[1])
        break
      }
    }
  }

  // 提取性别 - 格式: 性别/Sex\n女/F 或 男/M
  if (!fields.gender) {
    const genderPatterns = [
      /(?:性别|Sex)[\/\s\n\r]*(女|男|F|M)(?:\/[FM])?/i,
      /(?:Gender)[:\s]*(Male|Female|M|F)/i
    ]
    for (const pattern of genderPatterns) {
      const match = text.match(pattern)
      if (match) {
        const g = match[1].toUpperCase()
        fields.gender = (g === 'M' || g === 'MALE' || g === '男') ? 'MALE' : 'FEMALE'
        break
      }
    }
  }

  // 提取有效期 - 格式: 有效期限/Date of expiry\n17 1月/JAN 2029
  if (!fields.passportExpiry) {
    const expiryPatterns = [
      /(?:有效期限?|Date\s*of\s*expiry)[\/\s\n\r]*(\d{1,2})\s*(?:\d{1,2}月\/)?([A-Z]{3})\s*(\d{4})/i,
      /(?:有效期限?|Date\s*of\s*expiry)[\/\s\n\r]*(\d{1,2}\s*[A-Z]{3}\s*\d{4})/i,
      /(?:有效期限?|Date\s*of\s*expiry)[\/\s\n\r]*(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i,
      /(?:Expiry|Valid\s*Until)[:\s]*(\d{1,2}\s*[A-Z]{3}\s*\d{4})/i
    ]
    for (const pattern of expiryPatterns) {
      const match = text.match(pattern)
      if (match) {
        if (match[3]) {
          // 格式: 17 1月/JAN 2029 -> 17 JAN 2029
          fields.passportExpiry = normalizeDate(`${match[1]} ${match[2]} ${match[3]}`)
        } else {
          fields.passportExpiry = normalizeDate(match[1])
        }
        break
      }
    }
  }

  // 如果仍然没有提取到姓名，尝试其他模式
  if (!fields.fullName) {
    // 尝试从文本中匹配 SURNAME, GIVENNAME 格式
    const nameMatch = text.match(/\b([A-Z]{2,}),\s*([A-Z]{2,})\b/)
    if (nameMatch) {
      fields.fullName = `${nameMatch[1]}, ${nameMatch[2]}`
    }
  }

  console.log('Parsed Passport fields:', fields)
  return fields
}

/**
 * 解析MRZ (机器可读区)
 * MRZ第一行: P<国籍姓<<名<<<...
 * MRZ第二行: 护照号<校验位国籍出生日期校验位性别有效期...
 */
function parseMRZ(mrz) {
  const fields = {}
  const lines = mrz.split(/[\r\n]+/)

  if (lines.length >= 2) {
    const line1 = lines[0].replace(/\s/g, '')
    const line2 = lines[1].replace(/\s/g, '')

    // 第一行: P<国籍代码姓<<名
    if (line1.length >= 44) {
      // 国籍 (位置3-5)
      fields.nationality = line1.substring(2, 5).replace(/</g, '')

      // 姓名 (位置6-44)
      const namePart = line1.substring(5).replace(/</g, ' ').trim()
      const nameParts = namePart.split(/\s{2,}/)
      if (nameParts.length >= 2) {
        fields.fullName = `${nameParts[0]} ${nameParts[1]}`.trim()
      } else {
        fields.fullName = namePart.replace(/\s+/g, ' ').trim()
      }
    }

    // 第二行: 护照号(9位)+校验位+国籍(3位)+出生日期(YYMMDD)+校验位+性别+有效期(YYMMDD)+...
    if (line2.length >= 44) {
      // 护照号 (位置1-9)
      fields.passportNumber = line2.substring(0, 9).replace(/</g, '')

      // 出生日期 (位置14-19, YYMMDD格式)
      const dobYY = line2.substring(13, 15)
      const dobMM = line2.substring(15, 17)
      const dobDD = line2.substring(17, 19)
      const year = parseInt(dobYY) > 30 ? `19${dobYY}` : `20${dobYY}`
      fields.dateOfBirth = `${year}-${dobMM}-${dobDD}`

      // 性别 (位置21)
      const sex = line2.charAt(20)
      fields.gender = sex === 'M' ? 'MALE' : sex === 'F' ? 'FEMALE' : ''

      // 有效期 (位置22-27, YYMMDD格式)
      const expYY = line2.substring(21, 23)
      const expMM = line2.substring(23, 25)
      const expDD = line2.substring(25, 27)
      const expYear = parseInt(expYY) > 30 ? `19${expYY}` : `20${expYY}`
      fields.passportExpiry = `${expYear}-${expMM}-${expDD}`
    }
  }

  return fields
}

/**
 * 标准化日期格式为 YYYY-MM-DD
 */
function normalizeDate(dateStr) {
  if (!dateStr) return ''

  // 处理 DD MON YYYY 格式 (如 15 JAN 1990)
  const monthNames = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
  }
  const monMatch = dateStr.match(/(\d{1,2})\s*([A-Z]{3})\s*(\d{4})/i)
  if (monMatch) {
    const day = monMatch[1].padStart(2, '0')
    const month = monthNames[monMatch[2].toUpperCase()] || '01'
    return `${monMatch[3]}-${month}-${day}`
  }

  // 处理其他日期格式
  const parts = dateStr.split(/[\/\-\.]/)
  if (parts.length === 3) {
    let year, month, day
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      [year, month, day] = parts
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY 或 MM-DD-YYYY
      // 假设是 DD-MM-YYYY (更常见的国际格式)
      [day, month, year] = parts
    } else {
      // YY-MM-DD
      year = parseInt(parts[0]) > 30 ? `19${parts[0]}` : `20${parts[0]}`
      month = parts[1]
      day = parts[2]
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return dateStr
}

/**
 * 将3位ISO国家代码转换为2位代码
 * 护照MRZ使用3位代码，但表单下拉框使用2位代码
 */
function convertToIso2(code) {
  if (!code) return ''

  // 常见国家代码映射 (ISO 3166-1 alpha-3 to alpha-2)
  const iso3ToIso2 = {
    'CHN': 'CN',  // 中国
    'USA': 'US',  // 美国
    'GBR': 'GB',  // 英国
    'DEU': 'DE',  // 德国
    'FRA': 'FR',  // 法国
    'JPN': 'JP',  // 日本
    'KOR': 'KR',  // 韩国
    'AUS': 'AU',  // 澳大利亚
    'CAN': 'CA',  // 加拿大
    'IND': 'IN',  // 印度
    'PAK': 'PK',  // 巴基斯坦
    'PHL': 'PH',  // 菲律宾
    'IDN': 'ID',  // 印度尼西亚
    'MYS': 'MY',  // 马来西亚
    'SGP': 'SG',  // 新加坡
    'TUR': 'TR',  // 土耳其
    'ITA': 'IT',  // 意大利
    'ESP': 'ES',  // 西班牙
    'SAU': 'SA',  // 沙特阿拉伯
    'ARE': 'AE',  // 阿联酋
    'KWT': 'KW',  // 科威特
    'BHR': 'BH',  // 巴林
    'QAT': 'QA',  // 卡塔尔
    'OMN': 'OM',  // 阿曼
    'EGY': 'EG',  // 埃及
    'JOR': 'JO',  // 约旦
    'RUS': 'RU',  // 俄罗斯
    'BRA': 'BR',  // 巴西
    'MEX': 'MX',  // 墨西哥
    'THA': 'TH',  // 泰国
    'VNM': 'VN',  // 越南
    'NLD': 'NL',  // 荷兰
    'BEL': 'BE',  // 比利时
    'CHE': 'CH',  // 瑞士
    'SWE': 'SE',  // 瑞典
    'NOR': 'NO',  // 挪威
    'DNK': 'DK',  // 丹麦
    'FIN': 'FI',  // 芬兰
    'POL': 'PL',  // 波兰
    'NZL': 'NZ',  // 新西兰
    'ZAF': 'ZA',  // 南非
    'CHINESE': 'CN',
    'CHINA': 'CN'
  }

  const upperCode = code.toUpperCase()
  return iso3ToIso2[upperCode] || (upperCode.length === 2 ? upperCode : 'OTHER')
}

/**
 * Mock OCR result for Passport testing when API is not configured
 */
function mockPassportOcrResult() {
  return {
    success: true,
    confidence: 0,
    isMock: true,
    fields: {
      fullName: '',
      passportNumber: '',
      nationality: '',
      dateOfBirth: '',
      gender: '',
      passportExpiry: ''
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
