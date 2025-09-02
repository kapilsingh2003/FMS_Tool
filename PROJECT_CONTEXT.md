# Samsung FMS Portal - Project Context

## 🎯 Project Overview
**Samsung FMS (Feature Management System) Key Management Portal** - A web application for managing and reviewing FMS keys across Samsung Smart Monitor and TV models.

### Core Purpose
- Streamline verification and modification of FMS key values across multiple monitor models
- Support collaborative review processes for feature configurations
- Manage 1,305+ FMS keys across 26+ monitor models (M80D, G95SC, G85SD, etc.)

## 🏗️ Architecture & Tech Stack

### Frontend (React 18)
- **Framework**: React 18.2.0 with Create React App
- **UI Library**: Material-UI 5.11.10 with custom Samsung theme
- **Routing**: React Router 6.8.1 with protected routes
- **State Management**: React Context API (AuthContext)
- **Forms**: Formik 2.2.9 + Yup 1.0.0 validation
- **HTTP Client**: Axios 1.3.4
- **Notifications**: React Toastify 9.1.1
- **Auth**: Cookie-based persistent sessions (js-cookie)

### Backend (Node.js)
- **Framework**: Express.js server on port 5000
- **Data Storage**: JSON files in `/backend/data/` (projects.json, users.json, models.csv, branches.csv)
- **Routes**: `/api/auth`, `/api/users`, `/api/projects`, `/api/reference`
- **CORS**: Configured for localhost:3000

### Development Setup
```bash
# Frontend (port 3000)
npm start

# Backend (port 5000) 
cd backend && node server.js

# Proxy configured in package.json: "proxy": "http://localhost:5000"
```

## 🔐 Authentication & Authorization

### User Roles (Hierarchical)
1. **Admin** (Level 3) - Full access
   - Create/configure projects
   - Manage users and permissions
   - Configure comparison methods (2-way, 3-way, 4-way)
   - Add/remove models and FMS keys

2. **Reviewer** (Level 2) - Review & modify
   - Review and modify FMS key values
   - Add comments and color coding
   - Participate in collaborative reviews

3. **Viewer** (Level 1) - Read-only
   - View FMS key data and comparisons
   - View project configurations
   - Export data for analysis

### Authentication Implementation
- **Knox ID System**: Uses Samsung internal Knox ID (username format) instead of email
- **OTP Verification**: Simulated OTP verification during signup process
- **Role Assignment**: Automatic role assignment based on username patterns during login
- **Team-based Organization**: Users assigned to teams (ENT_SM, CTV, ENT_TV)

### Demo Credentials
- **Admin**: Username contains "admin" (e.g., "admin.user", "john.admin")
- **Reviewer**: Username contains "reviewer" (e.g., "reviewer1", "jane.reviewer")
- **Viewer**: Any other username format

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.js           # Knox ID login with Samsung branding
│   │   └── Signup.js          # OTP-verified user registration
│   ├── admin/
│   │   ├── AdminSettings.js   # Admin-only settings
│   │   └── UserManagement.js  # User management panel
│   ├── common/
│   │   └── LoadingSpinner.js  # Reusable loading component
│   ├── dashboard/
│   │   └── Dashboard.js       # Project-based dashboard with role filtering
│   └── projects/
│       ├── KeyReview.js           # ✅ Advanced FMS key review interface
│       ├── ProjectConfiguration.js # ✅ Multi-step project creation
│       └── ProjectUserManagement.js # Project-specific user management
├── contexts/
│   └── AuthContext.js         # Enhanced authentication with role management
├── services/
│   └── api.js                 # API service functions with mock data
└── utils/                     # Utility functions

backend/
├── data/
│   ├── projects.json          # Project configurations
│   ├── users.json             # User data
│   ├── models.csv             # Monitor models (M80D, G95SC, G85SD)
│   └── branches.csv           # Version branches (24Y, 23Y, 25Y, OSU)
├── routes/
│   ├── auth.js               # Authentication endpoints
│   ├── projects.js           # Project management
│   ├── reference.js          # Reference data
│   └── users.js              # User management
└── server.js                 # Express server setup
```

## 🎨 UI/UX Design

### Samsung Theme & Branding
- **Primary Color**: #1976d2 (Samsung blue), #0d459c (headings)
- **Secondary Color**: #ff6f00 (Samsung orange accent)
- **Typography**: "Poppins" (primary), "Inter", "Arial" (fallbacks)
- **Branding**: "SAMSUNG FMS Portal" (all caps) with solid color styling
- **Components**: Material-UI with custom Samsung styling

### Key UI Improvements
- **Responsive Design**: Optimized for various screen sizes
- **Samsung Branding**: Consistent use of Samsung colors and typography
- **Role-based UI**: Components show/hide based on user permissions
- **Interactive Tables**: Advanced table features with sorting, filtering, search
- **Color-coded Status**: Visual status indicators for different states
- **Progressive Forms**: Step-by-step workflows for complex operations

## 📊 Data Model & Workflow

### Project Configuration Workflow
1. **Basic Settings**:
   - Project title (50 char limit)
   - Description (200 char limit)
   - FMS Comparison Type (2-way, 3-way, 4-way, 2-way vs 2-way)
   - Refresh Schedule (Daily, Weekly, Monthly)

2. **Group Configuration**:
   - Create groups with custom names
   - Configure branches per group (Target, Reference 1, Reference 2, etc.)
   - Support for different branch configurations per group

3. **Model Management**:
   - Add models to specific groups
   - Searchable model selection with autocomplete
   - Flexible model assignment (models can be repeated across groups)

### FMS Key Review Structure
```javascript
// Key hierarchy: Project > Keys > Groups > Models
{
  keyName: "com.samsung.key_1",
  workAssignment: "TP_GameBar",
  owner: "John Smith",
  groups: [
    {
      groupName: "Group_25Y_SM",
      models: [
        {
          model: "M80D",
          target: "True",
          reference1: "False", 
          reference2: "True",
          comment: "Value is correct",
          kona: "RQ250607-0239",
          cl: "1980283",
          status: "reviewed" // green, orange, blue, yellow
        }
      ]
    }
  ]
}
```

### Status Color Coding
- **Green (Reviewed)**: Changed and reviewed, approved
- **Orange (Pending)**: Awaiting developer response
- **Blue (No Change)**: Reviewed, no change needed
- **Yellow (Discussion)**: Requires internal team discussion

### Projects
```json
{
  "id": 1752548852175,
  "title": "SM_GameBar_Keys_Review",
  "description": "Review of gaming FMS keys",
  "adminName": "John Kim",
  "adminId": "john.kim",
  "comparisonType": "3-way",
  "groups": [
    {
      "name": "Group_25Y_SM",
      "branches": {
        "target": "Trunk_25_MonitorRC_MP_Prj",
        "reference1": "SmartMonitor_2025_MP_Prj",
        "reference2": "Feature_GameBar_2025"
      },
      "models": ["M80D", "M70D", "G95SD"]
    }
  ],
  "participants": ["reviewer", "sarah.lee"],
  "createdDate": "2025-07-15T03:07:32.175Z"
}
```

### FMS Keys Examples
- `com.samsung.key_1`: Gaming-related FMS key with boolean values
- `com.samsung.key_2`: Power save mode with numeric values (1, 2, 3)
- `com.samsung.key_3`: Display brightness auto adjustment
- Format: Work assignments like "TP_GameBar", "TP_PowerSave", "TP_Sound"

### Monitor Models & Branches
- **Models**: M50C, M70C, M80C, G95SC, G95SD, S90PC, G97NC, M50D, M70D, etc.
- **Branches**: Trunk_25_MonitorRC_MP_Prj, SmartMonitor_2025_MP_Prj, OSU_2025_SM_TV_Ready_MP_Prj
- **Product Categories**: Smart Monitors, CTV, ENT_TV

## 🔧 Advanced Features Implemented

### Key Review Interface (KeyReview.js)
- **Hierarchical Display**: Collapsible keys containing collapsible groups
- **Advanced Filtering**: Search, sort, and filter at both key and model levels
- **Inline Editing**: Click-to-edit for values, comments, KONA IDs, and Change Lists
- **Column Management**: Per-column sorting, filtering, and search within tables
- **Status Management**: Visual status indicators with edit capabilities
- **Real-time Updates**: Immediate UI updates with optimistic updates

### Project Configuration (ProjectConfiguration.js)
- **Multi-step Wizard**: 3-step process (Basic Settings > Groups > Models)
- **Dynamic Branch Configuration**: Branch options change based on comparison type
- **Group-based Model Management**: Flexible grouping with different branch configs
- **Form Validation**: Comprehensive validation at each step
- **Progress Tracking**: Visual progress through configuration steps

### Authentication Enhancements
- **Knox ID Integration**: Samsung-specific username format
- **OTP Verification**: Simulated email OTP verification during signup
- **Progressive Form Fields**: Fields unlock after verification steps
- **Role-based Access**: Different UI/features based on user role

## 🚀 Available Routes

### Public Routes
- `/login` - Knox ID authentication with Samsung branding
- `/signup` - OTP-verified user registration

### Protected Routes (All Users)
- `/dashboard` - Project-based dashboard with role filtering
- `/projects/:projectId/review` - Advanced FMS key review interface

### Admin-Only Routes (AdminRoute component)
- `/projects/configure` - Multi-step project creation wizard
- `/projects/:projectId/users` - Project user management
- `/admin/settings` - Global admin settings
- `/admin/users` - User management panel

## 🛠️ Development Commands

```bash
# Frontend development
npm start                  # Start dev server (port 3000)
npm build                  # Production build
npm test                   # Run tests

# Project setup
npm install               # Install dependencies
powershell -ExecutionPolicy Bypass -Command "npm install"  # Windows bypass

# Common PowerShell issues
# If script execution is disabled, use the bypass command above
```

## 📝 Current Development Status

### ✅ Completed Features
- **Authentication System**: Knox ID login, OTP verification, role-based access
- **Samsung UI Theme**: Custom Material-UI theme with Samsung branding
- **Project Management**: Complete project creation workflow with groups
- **Key Review Interface**: Advanced hierarchical key review with editing
- **Dashboard**: Role-based project filtering and management
- **Advanced Table Features**: Sorting, filtering, search, column management
- **Status Management**: Color-coded status system with inline editing
- **Responsive Design**: Mobile-friendly UI with proper spacing

### 🔄 Areas for Future Development
- **Real FMS Key Data**: Integration with actual Samsung FMS databases
- **Backend APIs**: Replace mock data with real backend services
- **Advanced Collaboration**: Real-time multi-user editing and comments
- **Export Features**: Excel/CSV export with filtered data
- **Audit Trail**: Track all changes and modifications
- **Email Notifications**: Real OTP and project notifications
- **Performance Optimization**: Virtual scrolling for large datasets
- **Advanced Search**: Full-text search across all FMS keys

### 🐛 Known Issues & Considerations
- **Mock Data**: Currently using simulated data for development
- **PowerShell Execution**: May need execution policy bypass for npm commands
- **OTP Simulation**: OTP verification is simulated (always accepts "123456")
- **Role Assignment**: Based on username patterns for demo purposes

## 🎯 Usage Notes for AI Assistants

### When Starting a New Chat Session:
1. **Read this file first** to understand the complete project context
2. **Check KeyReview.js** for the latest advanced table implementation
3. **Review ProjectConfiguration.js** for the multi-step wizard pattern
4. **Understand the role-based system** in AuthContext.js
5. **Note Samsung branding requirements** throughout the UI

### Key Context Points:
- **Samsung Internal Tool**: Corporate branding and UI standards are critical
- **Role-based Security**: Always consider user permissions in features
- **Knox ID System**: Uses Samsung internal identity format
- **Group-based Configuration**: Projects support flexible group structures
- **Advanced Table Features**: Rich interaction patterns for data management
- **Mock Data Architecture**: Well-structured mock data for realistic development

### Common Development Patterns:
- **Hierarchical Components**: Keys > Groups > Models structure
- **Inline Editing**: Click-to-edit pattern with validation
- **Progressive Enhancement**: Features unlock based on user actions
- **Status-driven UI**: Color coding and visual feedback systems
- **Responsive Design**: Mobile-first with Samsung design standards

### Recent Major Implementations:
1. **KeyReview Component**: Complete FMS key review interface with advanced features
2. **Project Grouping**: Flexible group-based project configuration
3. **Advanced Filtering**: Multi-level search, sort, and filter capabilities
4. **Status Management**: Comprehensive status system with visual indicators
5. **Authentication Flow**: Knox ID + OTP verification workflow

---
*Last Updated: January 2024 - Comprehensive update after implementing KeyReview interface and advanced project management features* 