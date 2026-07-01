import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/signin', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      }));
    }
    return response.data;
  },

  register: async (username, email, password) => {
    const response = await api.post('/auth/signup', { username, email, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;
