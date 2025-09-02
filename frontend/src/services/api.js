import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth headers if needed
api.interceptors.request.use(
    (config) => {
        // Add any request interceptors here (auth tokens, etc.)
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (username, password) => {
        try {
            const response = await api.post('/api/auth/login', { username, password });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    },

    signup: async (userData) => {
        try {
            const response = await api.post('/api/auth/signup', userData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Signup failed'
            };
        }
    }
};

// Projects API
export const projectsAPI = {
    getAllProjects: async () => {
        try {
            const response = await api.get('/api/projects');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    getProject: async (projectId) => {
        try {
            const response = await api.get(`/api/projects/${projectId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    createProject: async (projectData) => {
        try {
            const response = await api.post('/api/projects', projectData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    updateProject: async (projectId, projectData) => {
        try {
            const response = await api.put(`/api/projects/${projectId}`, projectData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    deleteProject: async (projectId) => {
        try {
            const response = await api.delete(`/api/projects/${projectId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    }
};

// Reference API
export const referenceAPI = {
    getModels: async () => {
        try {
            const response = await api.get('/api/reference/models');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch models'
            };
        }
    },

    getBranches: async () => {
        try {
            const response = await api.get('/api/reference/branches');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch branches'
            };
        }
    }
};

// Users API (Admin only)
export const usersAPI = {
    getAllUsers: async () => {
        try {
            const response = await api.get('/api/users');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    getUser: async (username) => {
        try {
            const response = await api.get(`/api/users/${username}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    updateUser: async (username, userData) => {
        try {
            const response = await api.put(`/api/users/${username}`, userData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    deleteUser: async (username) => {
        try {
            const response = await api.delete(`/api/users/${username}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    addUserToProject: async (username, projectId) => {
        try {
            const response = await api.post(`/api/users/${username}/projects/${projectId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    removeUserFromProject: async (username, projectId) => {
        try {
            const response = await api.delete(`/api/users/${username}/projects/${projectId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    getUserProjects: async (username) => {
        try {
            const response = await api.get(`/api/users/${username}/projects`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    }
};

export default api; 