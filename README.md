# Samsung FMS Portal

A web portal for managing FMS (Feature Management System) keys for Samsung Smart Monitors and TVs. This portal streamlines the verification and modification process of FMS key values across multiple monitor models.

## Features

- **Role-based Authentication**: Admin, Reviewer, and Viewer roles with hierarchical permissions
- **Modern UI**: Built with React and Material-UI for a professional Samsung-inspired design
- **Project Management**: Create and configure comparison projects for different product categories
- **Multi-model Comparison**: Support for 2-way, 3-way, and 4-way model comparisons
- **Interactive Tables**: View, edit, and modify FMS key values with real-time validation
- **Collaboration Tools**: Add comments and color coding to key values for team collaboration

## Tech Stack

- **Frontend**: React 18, Material-UI, React Router, Formik, Yup
- **Authentication**: Role-based with persistent sessions
- **State Management**: React Context API
- **Styling**: Material-UI with custom Samsung theme
- **Form Handling**: Formik with Yup validation
- **Notifications**: React Toastify

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd samsung-fms-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Demo Login Credentials

The application includes demo authentication for testing different user roles:

- **Admin**: `admin@samsung.com` (any password 6+ characters)
- **Reviewer**: `reviewer@samsung.com` (any password 6+ characters)  
- **Viewer**: `viewer@samsung.com` (any password 6+ characters)

## User Roles

### Admin
- Full access to create and configure projects
- Manage user permissions and project settings
- Configure comparison methods (2-way, 3-way, 4-way)
- Add/remove models and FMS keys

### Reviewer
- Review and modify FMS key values within assigned projects
- Add comments and color coding to key values
- Participate in collaborative review processes

### Viewer
- Read-only access to view FMS key data and comparisons
- View project configurations and model comparisons
- Export data for analysis

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.js          # Login page component
│   │   └── Signup.js         # Signup page component
│   ├── common/
│   │   └── LoadingSpinner.js # Loading indicator component
│   └── dashboard/
│       └── Dashboard.js      # Main dashboard component
├── contexts/
│   └── AuthContext.js        # Authentication context provider
├── App.js                    # Main application component
└── index.js                  # Application entry point
```

## FMS Key Management

The portal is designed to handle:

- **26 Monitor Models**: M80D, G95SC, G85SD, etc.
- **1,305 FMS Keys per Model**: Various feature configurations
- **Product Categories**: Smart Monitors, CTV, ENT_TV
- **Comparison Methods**: 2-way, 3-way, 4-way model comparisons

### Example FMS Keys
- `hdmi.port.numvalue`: Number of HDMI ports (e.g., 2 for M80D, 1 for G95SC)
- `gamebar.responsetime`: Gaming response time feature (True/False)
- `display.resolution`: Screen resolution specifications
- `smart.features`: Smart TV/Monitor capabilities

## Development Workflow

1. **Project Creation**: Admins create projects and configure comparison settings
2. **Model Selection**: Choose which models to include in the comparison
3. **Key Review**: Reviewers analyze FMS key differences across models
4. **Three-way Comparison**: Compare target model (OSU) with references (24Y, 23Y, 25Y)
5. **Collaboration**: Add comments and color coding for key values
6. **Validation**: Confirm key values with key owners when differences are found

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm eject`: Ejects from Create React App (one-way operation)

## Future Enhancements

- SQL database integration for FMS key storage
- Advanced table features with nested/collapsible rows
- Data export functionality (Excel, CSV)
- Real-time collaboration features
- Advanced filtering and search capabilities
- Audit trail for key modifications
- Integration with Samsung's internal systems

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is proprietary to Samsung Electronics and is intended for internal use only. 