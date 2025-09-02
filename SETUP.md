# Samsung FMS Portal - Setup Guide

This guide will help you set up the Samsung FMS Portal project on a new machine.

## Prerequisites
- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

## Quick Setup

### Method 1: Copy Project Folder
1. Copy the entire project folder to your new machine
2. Open terminal/command prompt in the project directory
3. Run the following commands:

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Method 2: Using Setup Script (Windows)
1. Copy the entire project folder to your new machine
2. Double-click `setup.bat` to automatically install dependencies
3. Run `npm start` to start the server

## Project Dependencies
This project uses the following main libraries:
- **React** 18.2.0 - Frontend framework
- **Material-UI** 5.11.10 - UI components
- **React Router** 6.8.1 - Navigation
- **Formik** 2.2.9 - Form handling
- **Yup** 1.0.0 - Form validation
- **Axios** 1.3.4 - HTTP requests
- **React Toastify** 9.1.1 - Notifications

## Available Scripts
- `npm start` - Runs the development server
- `npm build` - Builds the project for production
- `npm test` - Runs tests
- `npm eject` - Ejects from Create React App (not recommended)

## Troubleshooting
If you encounter issues:
1. Make sure Node.js is installed: `node --version`
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json`, then run `npm install`

## Development Server
After setup, the application will be available at:
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000

The page will automatically reload when you make changes. 