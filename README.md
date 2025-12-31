# KFNLAI Visitor Management System

King Fahad National Library - Staff-operated H5 Visitor Management System

## Features

- **Staff H5 App**: Mobile-first visitor registration for library staff
  - Quick Saudi National registration (name + mobile only)
  - Foreign visitor passport scanning with OCR
  - Multi-language support (Arabic, English, Chinese)
  - RTL layout support for Arabic

- **Admin Dashboard**: Web-based management console
  - Today's visitor statistics
  - Visitor records list with search & filter
  - Multi-language interface

## Tech Stack

- **Frontend**: Vue 3 + Vite
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **i18n**: Vue I18n 9
- **Styling**: SCSS with RTL support

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── assets/styles/     # SCSS styles
├── components/        # Shared components
├── i18n/             # Multi-language files
├── router/           # Route configuration
├── stores/           # Pinia stores
├── types/            # Type definitions
├── utils/            # Utility functions
└── views/
    ├── staff/        # Staff H5 pages
    └── admin/        # Admin dashboard pages
```

## Routes

### Staff App
- `/` - Home (Quick action panel)
- `/saudi` - Saudi National registration
- `/foreign` - Foreign visitor registration
- `/success/:id` - Registration success

### Admin
- `/admin` - Dashboard
- `/admin/visitors` - Visitor records

## Language Support

- Arabic (العربية) - Default for Staff app, RTL
- English - Default for Admin
- Chinese (简体中文)

## License

Proprietary - King Fahad National Library
