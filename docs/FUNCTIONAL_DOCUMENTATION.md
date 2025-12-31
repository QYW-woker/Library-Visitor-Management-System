# KFNLAI Visitor Management System
## Functional Documentation

**King Fahad National Library - AI-Powered Visitor Management System**

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Staff Portal (User-Facing)](#2-staff-portal-user-facing)
3. [Admin Management System](#3-admin-management-system)
4. [OCR Recognition Features](#4-ocr-recognition-features)
5. [Technical Specifications](#5-technical-specifications)

---

## 1. System Overview

### 1.1 Purpose

The KFNLAI Visitor Management System is designed to streamline visitor registration at King Fahad National Library. It provides efficient check-in processes for three categories of visitors:

- **Saudi National Visitors** - Quick registration with National ID/Iqama
- **Chinese Visitors** - Registration with Chinese ID card OCR
- **Foreign Visitors** - Registration with passport OCR

### 1.2 Key Features

- **Multi-language Support**: Arabic, English, and Chinese (Simplified)
- **AI-Powered OCR**: Automatic document recognition using Coze Workflow API
- **Real-time Statistics**: Live visitor tracking and analytics
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 1.3 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3)                      │
├─────────────────┬─────────────────┬─────────────────────┤
│  Staff Portal   │  Admin Portal   │   Shared Components │
├─────────────────┴─────────────────┴─────────────────────┤
│                    Pinia State Store                     │
├─────────────────────────────────────────────────────────┤
│              OCR Service (Coze Workflow API)            │
├─────────────────────────────────────────────────────────┤
│                  LocalStorage Persistence               │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Staff Portal (User-Facing)

### 2.1 Home Page (`/`)

The main entry point for staff to register visitors.

#### Features:
- **Three Registration Options**:
  - Saudi National Visitor (green card)
  - Chinese Visitor (red card)
  - Foreign Visitor (blue card)

- **Today's Statistics Panel**:
  - Total visitors count
  - Saudi visitors count
  - Chinese visitors count
  - Foreign visitors count

#### Navigation:
- Click on any visitor type card to proceed to the respective registration form

---

### 2.2 Saudi National Registration (`/saudi`)

Quick registration for Saudi nationals and residents.

#### Input Methods:

**A. Quick Entry Mode (Default)**
- Manual input of visitor information
- Fields:
  - Full Name (required)
  - Mobile Number (required, format: 5XX XXX XXXX)
  - National ID Number (optional, 10 digits)

**B. ID Card Scan Mode**
- Camera capture or image upload
- Automatic OCR recognition of Saudi National ID or Iqama (Residence Permit)
- Extracted fields:
  - Full Name (Arabic and English)
  - National ID / Iqama Number
  - Date of Birth
  - Expiry Date
  - Nationality

#### Supported Documents:
- Saudi National ID Card (بطاقة الهوية الوطنية)
- Residence Permit / Iqama (رخصة اقامة)

#### Validation Rules:
- Name: 2-100 characters
- Mobile: Saudi format (starts with 5, 9 digits after country code)
- National ID: 10 digits, starts with 1 or 2

---

### 2.3 Chinese Visitor Registration (`/chinese`)

Registration for visitors with Chinese ID cards.

#### Input Methods:

**A. ID Card Scan (Primary)**
- Camera capture or image upload
- Automatic OCR recognition of Chinese ID card
- Extracted fields:
  - Full Name (姓名)
  - ID Number (身份证号码)
  - Gender (性别)
  - Ethnicity (民族)
  - Date of Birth (出生日期)
  - Address (住址)

**B. Manual Entry**
- All fields can be manually entered or corrected after OCR

#### Form Fields:
| Field | Required | Format |
|-------|----------|--------|
| Full Name | Yes | Chinese characters |
| ID Number | Yes | 15-18 digits |
| Gender | No | Male/Female |
| Ethnicity | No | e.g., Han (汉族) |
| Date of Birth | No | YYYY-MM-DD |
| Address | No | Free text |
| Mobile Number | No | Any format |

#### Validation Rules:
- ID Number: 15-18 digits (with warning if not exactly 18)
- Standard 18-digit format: Region(6) + Birth(8) + Sequence(3) + Checksum(1)

---

### 2.4 Foreign Visitor Registration (`/foreign`)

Registration for international visitors with passports.

#### Input Methods:

**A. Passport Scan (Primary)**
- Camera capture or image upload
- Automatic OCR recognition supporting multiple passport formats:
  - Chinese Passport (中国护照)
  - US Passport / Passport Card
  - Other international passports
- MRZ (Machine Readable Zone) parsing support

**B. Manual Entry**
- All fields can be manually entered or corrected after OCR

#### Form Fields:
| Field | Required | Format |
|-------|----------|--------|
| Full Name | Yes | As shown on passport |
| Passport Number | Yes | Alphanumeric |
| Nationality | Yes | Select from dropdown |
| Date of Birth | No | YYYY-MM-DD |
| Gender | No | Male/Female |
| Passport Expiry | No | YYYY-MM-DD |
| Mobile Number | No | Any format |

#### Supported Nationalities:
- Saudi Arabia, UAE, Kuwait, Bahrain, Qatar, Oman
- USA, UK, Germany, France, Italy, Spain
- China, Japan, South Korea
- India, Pakistan, Philippines, Indonesia
- Malaysia, Singapore, Australia, Canada
- And more (25+ countries)

---

### 2.5 Registration Success Page (`/success`)

Displayed after successful visitor registration.

#### Features:
- Confirmation message
- Visitor name display
- Entry time timestamp
- Auto-redirect countdown (configurable)
- Quick actions:
  - "Next Visitor" - Return to home page
  - "Back to Home" - Return to home page

---

## 3. Admin Management System

### 3.1 Dashboard (`/admin`)

Central overview of visitor management.

#### Statistics Cards:
- **Total Visitors Today**: All visitor types combined
- **Saudi Visitors**: Saudi national count
- **Chinese Visitors**: Chinese visitor count
- **Foreign Visitors**: International visitor count
- **Currently In Library**: Active visitors (not exited)

#### Recent Visitors Table:
- Shows last 5 visitors
- Columns: Type, Name, Mobile, Entry Time, Status
- Quick link to full visitor list

#### Actions:
- **Reset Demo Data**: Clear all data and regenerate sample visitors
  - Confirmation required
  - Generates 13 demo visitors (5 Saudi, 3 Chinese, 5 Foreign)

---

### 3.2 Visitor Records (`/admin/visitors`)

Comprehensive visitor management interface.

#### Search & Filter:
- **Search Box**: Search by name, mobile number, or passport number
- **Type Filter**: All Types / Saudi / Chinese / Foreign
- **Date Range Filter**: From date to To date

#### Visitor Table:
| Column | Description |
|--------|-------------|
| Type | Visitor category with flag icon |
| Full Name | Visitor's name |
| Mobile | Phone number (if provided) |
| Entry Time | Check-in timestamp |
| Status | Active (In Library) / Exited / Cancelled |
| Actions | View details, Mark as exited |

#### Status Indicators:
- 🟢 **Active/In Library**: Currently inside the library
- ⚪ **Exited**: Has left the library
- 🔴 **Cancelled**: Registration cancelled

#### Visitor Details Modal:
- Full visitor information
- Document image (if captured)
- Registration ID
- Entry/Exit timestamps
- Mark as Exited action

#### Export Function:
- Export visitor records to file

---

### 3.3 Settings (`/admin/settings`)

System configuration options.

*(Future implementation)*

---

## 4. OCR Recognition Features

### 4.1 Supported Document Types

| Document | Recognition Rate | Key Fields |
|----------|-----------------|------------|
| Saudi National ID | High | Name, ID Number, DOB |
| Saudi Iqama | High | Name (AR/EN), ID, Nationality |
| Chinese ID Card | High | Name, ID, Gender, Address |
| Chinese Passport | High | Name, Passport No., Nationality |
| US Passport Card | Medium-High | Name, Passport No., Expiry |
| Other Passports | Medium | Via MRZ parsing |

### 4.2 OCR Workflow

```
1. Image Capture/Upload
        ↓
2. Base64 Encoding
        ↓
3. Coze Workflow API Call
        ↓
4. Text Extraction
        ↓
5. Field Parsing (Regex)
        ↓
6. Form Auto-fill
        ↓
7. Manual Review/Correction
```

### 4.3 Recognition Features

#### Saudi ID/Iqama:
- Bilingual name extraction (Arabic + English)
- Header text filtering (KINGDOM, MINISTRY, etc.)
- Hijri date format support (14xx)
- 10-digit ID validation

#### Chinese ID:
- Chinese character name extraction
- 18-digit ID number validation
- Birth date from ID number
- Address parsing

#### Passport:
- MRZ (Machine Readable Zone) parsing
- Multi-format date normalization
- ISO country code conversion (3-letter to 2-letter)
- Surname/Given name combination

---

## 5. Technical Specifications

### 5.1 Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend Framework | Vue 3 (Composition API) |
| Build Tool | Vite |
| State Management | Pinia |
| Routing | Vue Router 4 |
| Internationalization | Vue I18n |
| Styling | SCSS |
| OCR API | Coze Workflow API |
| Storage | LocalStorage |

### 5.2 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### 5.3 Device Support

- Desktop (1920x1080 and above)
- Tablet (768x1024)
- Mobile (375x667 and above)

### 5.4 Camera Requirements

- For OCR features, device must have camera access
- Minimum resolution: 720p recommended
- Alternatively, image upload is supported

### 5.5 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_COZE_WORKFLOW_ID` | Coze workflow identifier |
| `VITE_COZE_API_KEY` | Coze API authentication key |

### 5.6 Data Storage

- All visitor data stored in browser LocalStorage
- Data persists across sessions
- No server-side database required for demo

---

## Appendix A: Validation Rules Summary

| Field | Rule |
|-------|------|
| Saudi Mobile | 9 digits, starts with 5 |
| Saudi National ID | 10 digits, starts with 1 or 2 |
| Chinese ID | 15-18 digits |
| Passport Number | Alphanumeric, varies by country |
| Name | 2-100 characters |
| Date | YYYY-MM-DD format |

## Appendix B: Status Codes

| Status | Description |
|--------|-------------|
| ACTIVE | Visitor is currently in the library |
| EXITED | Visitor has left the library |
| CANCELLED | Registration was cancelled |

---

**Document Version**: 1.0
**Last Updated**: December 2024
**System Version**: KFNLAI VMS v1.0
