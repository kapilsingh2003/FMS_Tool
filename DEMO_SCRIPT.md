# FMS Review Manager - Demo Script

## 🎬 Introduction (1-2 minutes)

### Opening Statement
> "Hello everyone! Today I'll be walking you through the **FMS Review Manager** - a comprehensive web portal designed to streamline the verification and modification process of FMS (Feature Management System) keys for Samsung Smart Monitors and TVs.

> This tool solves a critical business problem: managing over **1,300+ FMS keys across 26+ monitor models** requires a systematic approach for collaboration, tracking changes, and ensuring accuracy across product lines."

### Key Problems This Tool Solves
- **Before**: Manual spreadsheet-based tracking prone to errors
- **After**: Centralized, collaborative platform with audit trails
- **Before**: No visibility into who changed what and when
- **After**: Complete status tracking with color-coded workflow
- **Before**: Difficult to compare FMS keys across multiple branches/models
- **After**: Flexible 2-way, 3-way, and 4-way comparison support

---

## 🔐 Part 1: Authentication & User Management (3-4 minutes)

### 1.1 Login Page
**Navigate to**: `http://localhost:3000/login`

**Script**:
> "Let's start with the login page. The portal uses Knox ID authentication - Samsung's internal identity system.

> **Key Features of Login:**
> - Clean, modern UI with Samsung branding
> - Username (Knox ID) and password authentication
> - Password visibility toggle for user convenience
> - Form validation ensures data integrity before submission

> Let me log in as an **admin user** to demonstrate full capabilities."

**Demo**: Enter admin credentials and click "Sign In"

### 1.2 User Roles Explanation
> "The system has **role-based access control** with two primary roles:

> **Admin Role:**
> - Create and configure new projects
> - Manage project participants
> - Edit project configurations
> - Delete projects
> - Full access to all review features

> **User Role:**
> - View and participate in assigned projects
> - Review and update FMS key values
> - Add comments and track changes
> - Cannot create or delete projects

> This ensures proper governance while enabling team collaboration."

### 1.3 Sign Up Page (Optional Demo)
**Navigate to**: `http://localhost:3000/signup`

> "New users can register through the sign-up page. The registration includes:
> - Username (Knox ID) verification
> - Full name and department information
> - Password setup with strength requirements
> - OTP verification for added security"

---

## 📊 Part 2: Dashboard Overview (4-5 minutes)

### 2.1 Welcome Section
**Navigate to**: `http://localhost:3000/dashboard`

**Script**:
> "After login, users land on the main dashboard. Let me walk you through each section.

> **Welcome Card:**
> - Displays user's name and department
> - Shows their role and username
> - Quick access buttons based on permissions
> - Admins see 'Create Project' button here"

### 2.2 Navigation Tabs
> "The dashboard has two main tabs:

> **My Projects Tab:**
> - Shows all projects the user is involved with
> - Admins see 'Created by You' and 'Other Projects' sections
> - Regular users see 'Assigned Projects'

> **All Comments Tab:**
> - Aggregated view of all comments across projects
> - Helps track discussions and follow-ups
> - Searchable and filterable"

### 2.3 Project Cards
> "Each project is displayed as a card with essential information:

> **Project Card Elements:**
> - **Title**: Project name (limited to 30 characters for clean display)
> - **Description**: Brief project description
> - **Created by**: Shows the project admin
> - **Status Badge**: 
>   - 🟢 **Active** - Project is ready and synced
>   - 🔵 **Syncing** - Data synchronization in progress
>   - 🔴 **Sync Error** - Indicates sync failure
> - **Member count**: Number of participants
> - **Creation date**: When the project was created

> **Admin Actions on Project Cards:**
> - **Refresh button**: Re-sync project data from source
> - **Manage Users**: Add/remove project participants
> - **Edit Configuration**: Modify project settings
> - **Delete button**: Remove the project (with confirmation)"

### 2.4 Official Projects Section
> "Official projects have special features for formal review workflows:

> **Official Project Indicators:**
> - ⭐ **Official Badge**: Distinguishes from regular projects
> - **SWPLM Project Name**: Links to Samsung's project management system
> - **Project Lead (PL)**: Person responsible for the review
> - **Project Manager (PM)**: Approver for the project
> - **Days Remaining**: Countdown to target completion date

> **Approval Workflow:**
> 1. **Creation Approval**: PM must approve before project becomes accessible
> 2. **Review Phase**: Team reviews FMS keys
> 3. **Final Approval**: PL submits for PM approval when complete
> 4. **PM Decision**: Approve or reject with reasons"

### 2.5 Change Password Feature
**Demo**: Click "Change Password" button

> "Users can change their password directly from the dashboard:
> - Enter current password for verification
> - Set new password (minimum 6 characters)
> - Confirm new password
> - Immediate feedback on password strength and match"

---

## 🛠️ Part 3: Project Configuration (6-8 minutes)

### 3.1 Creating a New Project
**Navigate to**: Click "Create Project" button

**Script**:
> "Let's create a new project. The configuration uses a **multi-step wizard** for guided setup."

### 3.2 Step 1: Basic Settings
> "**Basic Settings include:**

> **Project Title** (Required):
> - Maximum 30 characters
> - Should be descriptive and unique
> - Example: 'SM_GameBar_25Y_Review'

> **Description** (Required):
> - Up to 500 characters
> - Explains the project's purpose
> - Example: 'Review of GameBar FMS keys for 2025 Smart Monitor lineup'

> **Refresh Schedule**:
> - **Daily**: For active development phases
> - **Weekly**: For stable review periods
> - **Monthly**: For maintenance projects
> - Controls how often data syncs with FMS source"

### 3.3 Official Project Toggle
> "When creating an **Official Project**, additional fields appear:

> **SWPLM Project Name**: Links to Samsung's project system for tracking
> **Project Lead**: Select from registered users - responsible for review completion
> **Project Manager**: Select from registered users - approves the final review
> **Target Completion Date**: Sets the deadline with countdown display"

### 3.4 Step 2: Group & Model Configuration
**Demo**: Click "Next" to proceed

> "This is where the real power of the tool shows. Let me explain the concept:

> **Why Groups?**
> - Different model families may need different branch comparisons
> - Groups allow flexible configuration within one project
> - Each group can have its own comparison type"

### 3.5 Creating a Group
**Demo**: Click "Add Group"

> "**Group Configuration:**

> **Group Name**: Descriptive identifier (e.g., 'Group_25Y_SM', 'Group_24Y_CTV')

> **Comparison Type**: This is crucial!
> - **2-Way**: Compare Target vs Reference (simple diff)
> - **3-Way**: Compare Target vs Reference1 vs Reference2
> - **4-Way**: Compare Target vs Ref1 vs Ref2 vs Ref3
> - **2-Way vs 2-Way**: Compare two target-reference pairs

> The comparison type determines:
> - How many branch dropdowns appear
> - How the comparison table is structured
> - What data gets synced"

### 3.6 Branch Selection
> "**Branch Selection** is context-aware:

> Branches represent different FMS code versions:
> - **Trunk branches**: Main development lines (e.g., 'Trunk_25_MonitorRC_MP_Prj')
> - **Feature branches**: Specific feature implementations
> - **Release branches**: Production-ready versions

> Select branches based on what you want to compare:
> - **Target**: The branch you're validating
> - **Reference(s)**: Branches to compare against"

### 3.7 Adding Models to Groups
**Demo**: Add models inline

> "**Model Addition:**

> Once branches are selected, the model dropdown shows only **compatible models** - those that exist in all selected branches.

> **Multi-select capability**: Add multiple models at once by selecting them from the dropdown. This saves time when adding many models.

> Models are added with their comparison columns pre-configured based on the group's comparison type."

### 3.8 Auto-Save Feature
> "Notice the **auto-save functionality**:
> - Configuration is saved to browser localStorage every second
> - If you accidentally close the browser, your progress is preserved
> - Clearing is done after successful project creation"

### 3.9 Project Creation
**Demo**: Click "Create Project"

> "When you click Create Project:
> 1. Configuration is validated
> 2. Project is created in the database
> 3. **Data sync begins automatically**
> 4. You're redirected to the dashboard
> 5. Project shows 'syncing' status until complete"

---

## 🔍 Part 4: FMS Key Review Interface (8-10 minutes)

### 4.1 Opening a Project
**Navigate to**: Click on a project card

**Script**:
> "This is the **heart of the application** - the Key Review Interface. This is where the actual FMS key review happens."

### 4.2 Interface Overview
> "Let me explain the interface layout:

> **Header Section:**
> - Project title and back button
> - Quick actions: Export, Settings
> - Project-level statistics

> **Key List Section:**
> - Collapsible list of all FMS keys
> - Each key shows summary information
> - Expandable to reveal group details"

### 4.3 Key Information Display
**Demo**: Expand a key

> "**Each FMS Key Card shows:**

> - **Key Name**: The FMS key identifier (e.g., 'com.samsung.display.brightness')
> - **Work Assignment**: The team/module responsible (e.g., 'TP_GameBar')
> - **Owner**: Person responsible for this key
> - **Status Summary**: Quick view of review progress

> **Expand to see:**
> - All groups this key appears in
> - Model-by-model comparison data"

### 4.4 Model Comparison Table
**Demo**: Expand a group within a key

> "**The Comparison Table** is the main work area:

> **Columns:**
> - **Model**: The device model name
> - **Target**: Value in the target branch
> - **Reference 1/2/3**: Values in reference branches (based on comparison type)
> - **Status**: Current review status
> - **KONA ID**: Link to Samsung's issue tracking
> - **CL (Change List)**: Code change reference
> - **Comment**: Notes and discussions

> **Color Coding for Status:**
> - ⚪ **Unreviewed**: Not yet looked at
> - 🟢 **Changes Made**: Value has been corrected
> - 🟠 **Pending Response**: Waiting for developer feedback
> - 🔵 **No Change Required**: Confirmed as correct
> - 🟣 **Internal Discussion**: Needs team discussion
> - 🔴 **Value Changed**: Recently modified

> This visual system allows reviewers to quickly scan and identify items needing attention."

### 4.5 Inline Editing
**Demo**: Click on a cell to edit

> "**Inline Editing** makes data entry fast:

> - Click any editable cell to modify
> - Changes are saved automatically
> - No need to open separate dialogs
> - Supports all fields: values, KONA IDs, CLs, comments

> **Status Update:**
> Click the status chip to change review status. This is how you mark items as reviewed."

### 4.6 Comments System
**Demo**: Click comment icon

> "**Comments are crucial for collaboration:**

> - Add comments to any model row
> - Comments support threading for discussions
> - Timestamp and author tracked automatically
> - Comment icon shows count for quick reference

> Use comments to:
> - Ask questions to developers
> - Document decisions
> - Track follow-ups"

### 4.7 Search and Filtering
**Demo**: Use search box

> "**Powerful Search & Filter capabilities:**

> - **Global Search**: Find keys by name, work assignment, or owner
> - **Status Filter**: Show only specific statuses
> - **Sort Options**: Sort by key name, status, or modification date
> - **Column Filters**: Filter within specific columns

> These tools help manage large datasets efficiently."

### 4.8 Export to Excel
**Demo**: Click Export button

> "**Export Feature:**

> - Exports all visible data to Excel format
> - Includes all columns and comments
> - Preserves status information
> - Great for reporting and offline review"

---

## 👥 Part 5: Project User Management (2-3 minutes)

### 5.1 Managing Participants
**Navigate to**: Dashboard → Click "Manage Users" on a project

**Script**:
> "Project admins can manage who has access to their projects:

> **Adding Participants:**
> - Search for users by name or username
> - Select and add multiple users at once
> - Users immediately gain access to the project

> **Removing Participants:**
> - Click remove icon next to a participant
> - Confirmation required before removal
> - Removed users lose access immediately

> **Why This Matters:**
> - Controls who can view and modify data
> - Maintains project security
> - Enables team scaling as needed"

---

## ⚙️ Part 6: System Management (Admin Only) (4-5 minutes)

### 6.1 Accessing System Management
**Script**:
> "System administrators (logged in as 'system' user) have access to backend data management."

**Navigate to**: Log in as 'system' user → System Management

### 6.2 Overview Dashboard
> "**System Management Dashboard shows:**

> - **Total Keys**: Count of all FMS keys in the system
> - **Total Models**: Count of all device models
> - **Total Branches**: Count of all code branches

> This gives administrators a quick health check of the data."

### 6.3 Keys Management Tab
**Demo**: Click on Keys tab

> "**Key Management:**

> - View all FMS keys in the system
> - Search by key name, work assignment, or owner
> - Filter by work assignment
> - See which keys have differences flagged

> **Sync Keys Button:**
> - Fetches latest keys from FMS source system
> - Updates key metadata (owner, description)
> - Identifies new keys or removed keys"

### 6.4 Models Management Tab
**Demo**: Click on Models tab

> "**Model Management:**

> - View all device models
> - Filter by product category (Smart Monitor, CTV, ENT_TV)
> - See model IDs and names

> **Sync Models Button:**
> - Updates model list from source
> - Adds new models
> - Updates product categories"

### 6.5 Branches Management Tab
**Demo**: Click on Branches tab

> "**Branch Management:**

> - View all code branches
> - Search by branch name

> **Sync Branches Button:**
> - Updates branch list
> - Ensures all available branches are accessible for projects"

---

## 📈 Part 7: KPI Dashboard (3-4 minutes)

### 7.1 Accessing KPI Dashboard
**Navigate to**: Click "KPI Dashboard" button (system user only)

**Script**:
> "The KPI Dashboard provides **analytics and insights** for portal administrators."

### 7.2 Overview Statistics
> "**Top-Level Stats Cards:**

> - **Total Users**: Count of registered users
> - **Total Projects**: Active projects in the system
> - **Total Comments**: Engagement metric
> - **Review Progress**: Percentage of reviewed items

> These provide a quick pulse check on portal usage."

### 7.3 User Activity Tab
**Demo**: Click on User Activity tab

> "**User Activity Tracking:**

> - See all users and their activity levels
> - Last login timestamps
> - Number of projects they're involved in
> - Review counts per user

> Useful for:
> - Identifying inactive users
> - Recognizing top contributors
> - Workload distribution analysis"

### 7.4 Project Statistics Tab
**Demo**: Click on Projects tab

> "**Project Analytics:**

> - Project completion rates
> - Status distribution across projects
> - Timeline trends
> - Group and model counts per project

> Charts include:
> - **Bar charts**: Compare metrics across projects
> - **Pie charts**: Status distributions
> - **Line charts**: Trend over time"

### 7.5 Activity Feed
> "**Recent Activity Feed:**

> - Shows latest actions across the portal
> - Who did what, and when
> - Helpful for auditing
> - Can filter by user or project"

---

## 🔄 Part 8: Official Project Workflow (3-4 minutes)

### 8.1 Official Project Lifecycle
**Script**:
> "Let me walk through the **complete lifecycle of an Official Project**:

> **Phase 1: Creation**
> 1. Admin creates project with 'Official' flag enabled
> 2. Sets SWPLM project name, PL, PM, and target date
> 3. Project created with 'Pending Creation Approval' status

> **Phase 2: Creation Approval**
> 4. PM sees project with 'Awaiting Creation Approval' badge
> 5. PM can **Approve** or **Reject** (with reason)
> 6. If approved, project becomes accessible to all participants
> 7. If rejected, creator sees rejection reason

> **Phase 3: Review Work**
> 8. Team reviews FMS keys, updates statuses
> 9. Days remaining countdown shows urgency
> 10. Comments and discussions happen

> **Phase 4: Final Approval**
> 11. PL clicks 'Send for PM Approval' when ready
> 12. Status changes to 'Awaiting PM Approval'
> 13. PM reviews and **Approves** or **Rejects**
> 14. Approved projects show 'Approved by PM' badge

> This workflow ensures proper oversight for formal reviews."

---

## 🎯 Part 9: Best Practices & Tips (2 minutes)

### 9.1 Efficiency Tips
> "**Tips for Efficient Use:**

> 1. **Use keyboard shortcuts**: Tab through cells for fast editing
> 2. **Set status as you go**: Don't leave items as 'Unreviewed'
> 3. **Add meaningful comments**: Future you will thank present you
> 4. **Use search filters**: Don't scroll through 1,300+ keys manually
> 5. **Export regularly**: Keep backups of your progress"

### 9.2 Collaboration Best Practices
> "**Collaboration Best Practices:**

> 1. **Assign clear ownership**: Each key should have one primary reviewer
> 2. **Use 'Pending Response' status**: When waiting for developer input
> 3. **Document decisions in comments**: Create audit trail
> 4. **Regular syncs**: Keep data fresh with manual refreshes
> 5. **Review All Comments tab daily**: Stay on top of discussions"

---

## 🏁 Conclusion (1 minute)

### Summary
> "To summarize, the **FMS Review Manager** provides:

> ✅ **Centralized Management**: All FMS keys in one place
> ✅ **Flexible Comparisons**: 2-way to 4-way comparisons
> ✅ **Role-Based Access**: Secure, controlled access
> ✅ **Status Tracking**: Visual workflow management
> ✅ **Collaboration Tools**: Comments and discussions
> ✅ **Official Workflows**: Formal approval processes
> ✅ **Analytics**: KPI dashboard for insights

> This tool transforms FMS key management from a manual, error-prone process into a streamlined, collaborative workflow."

### Call to Action
> "Questions? Feedback? Please reach out to the development team.

> Thank you for watching this demo!"

---

## 📋 Demo Checklist

### Before Demo:
- [ ] Ensure backend server is running (port 5000)
- [ ] Ensure frontend is running (port 3000)
- [ ] Have test admin account ready
- [ ] Have test system account ready (for KPI/System Management)
- [ ] Create a sample project with data for demonstration
- [ ] Clear browser cache if needed

### Login Credentials for Demo:
- **Admin User**: Any username containing 'admin' (e.g., 'admin.demo')
- **System User**: Username 'system' (for KPI and System Management)
- **Regular User**: Any other username

### Key URLs:
- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`
- Project Config: `http://localhost:3000/projects/configure`
- KPI Dashboard: `http://localhost:3000/kpi`
- System Management: `http://localhost:3000/system`

---

## 🕐 Total Demo Time: ~35-40 minutes

| Section | Duration |
|---------|----------|
| Introduction | 1-2 min |
| Authentication | 3-4 min |
| Dashboard Overview | 4-5 min |
| Project Configuration | 6-8 min |
| Key Review Interface | 8-10 min |
| User Management | 2-3 min |
| System Management | 4-5 min |
| KPI Dashboard | 3-4 min |
| Official Workflow | 3-4 min |
| Best Practices | 2 min |
| Conclusion | 1 min |

---

*Script Version: 1.0*
*Last Updated: January 27, 2026*
