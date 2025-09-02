# Samsung FMS Portal - Project Structure

## 📁 Directory Structure

```
LearningProj - Copy/
├── backend/                     # Original Node.js backend
│   ├── data/                   # JSON/CSV data files
│   ├── routes/                 # Express.js routes
│   ├── server.js               # Node.js server
│   └── package.json            # Node.js dependencies
│
├── backend_python/             # New Python Flask backend
│   ├── data/                   # JSON/CSV data files (copied)
│   ├── routes/                 # Flask routes
│   ├── utils/                  # Python utilities
│   ├── app.py                  # Flask application
│   ├── start.py                # Startup script
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React frontend application
│   ├── public/                 # Static files
│   ├── src/                    # React source code
│   │   ├── components/         # React components
│   │   ├── contexts/           # React contexts
│   │   ├── services/           # API services
│   │   └── utils/              # Frontend utilities
│   ├── package.json            # Frontend dependencies
│   └── node_modules/           # Installed packages
│
├── start_frontend.bat          # Start React frontend
├── start_backend_python.bat    # Start Python backend
├── start_backend_node.bat      # Start Node.js backend
├── PROJECT_CONTEXT.md          # Detailed project documentation
└── README.md                   # Project overview
```

## 🚀 How to Run

### Option 1: Python Backend + React Frontend (Recommended)

1. **Start Python Backend:**
   ```bash
   # Double-click or run in terminal:
   start_backend_python.bat
   ```
   Backend will be available at: http://localhost:5000

2. **Start React Frontend:**
   ```bash
   # Double-click or run in terminal:
   start_frontend.bat
   ```
   Frontend will be available at: http://localhost:3000

### Option 2: Node.js Backend + React Frontend

1. **Start Node.js Backend:**
   ```bash
   # Double-click or run in terminal:
   start_backend_node.bat
   ```
   Backend will be available at: http://localhost:5000

2. **Start React Frontend:**
   ```bash
   # Double-click or run in terminal:
   start_frontend.bat
   ```
   Frontend will be available at: http://localhost:3000

## 🔧 Manual Setup

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Python Backend Setup
```bash
cd backend_python
pip install -r requirements.txt
python start.py
```

### Node.js Backend Setup
```bash
cd backend
npm install
node server.js
```

## 📋 API Endpoints

Both backends (Node.js and Python) provide the same API:

- **Authentication**
  - `POST /api/auth/login` - User login
  - `POST /api/auth/signup` - User registration

- **Projects**
  - `GET /api/projects` - Get all projects
  - `GET /api/projects/:id` - Get specific project
  - `POST /api/projects` - Create new project

- **Users**
  - `GET /api/users` - Get all users (admin only)
  - `GET /api/users/:username` - Get specific user
  - `PUT /api/users/:username` - Update user
  - `DELETE /api/users/:username` - Delete user
  - User-project management endpoints

- **Reference Data**
  - `GET /api/reference/models` - Get monitor models
  - `GET /api/reference/branches` - Get version branches

## 🎯 Key Features

- **Dual Backend Support**: Choose between Node.js and Python
- **Samsung Branding**: Custom UI theme with Samsung colors
- **Role-based Access**: Admin, Reviewer, Viewer roles
- **FMS Key Management**: Hierarchical key review system
- **Project Configuration**: Multi-step project setup wizard
- **Advanced Tables**: Sorting, filtering, search capabilities

## 📝 Development Notes

- Both backends serve the same API and use identical data structures
- Frontend is fully compatible with both backend implementations
- Data files are shared between both backends
- All configurations maintain the same port structure (frontend: 3000, backend: 5000)

## 🔄 Migration Status

✅ **Completed:**
- Python backend implementation
- Project structure reorganization
- Frontend moved to dedicated folder
- Startup scripts created
- API compatibility maintained

The project now supports both Node.js and Python backends with a clean, organized structure.
