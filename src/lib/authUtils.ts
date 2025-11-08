export const authUtils = {
  // Get token with validation
  getValidToken: (): string | null => {
    try {
      const token = localStorage.getItem('token');
      if (!token || token.trim() === '') {
        return null;
      }
      
      // Basic JWT structure validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format');
        return null;
      }
      
      // Check if token is expired (basic check)
      try {
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.warn('Token expired');
          return null;
        }
      } catch (e) {
        console.warn('Cannot parse token payload');
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Clear session and redirect to login
  clearSessionAndRedirect: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return authUtils.getValidToken() !== null;
  },

  // Get user info from token
  getUserFromToken: (): any => {
    try {
      const token = authUtils.getValidToken();
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId,
        isAdmin: payload.isAdmin,
        email: payload.email
      };
    } catch (error) {
      console.error('Error parsing user from token:', error);
      return null;
    }
  }
};

export default authUtils;
