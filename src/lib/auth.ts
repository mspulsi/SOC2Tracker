import { api } from './api';

export async function checkAuth(): Promise<{
  isAuthenticated: boolean;
  hasIntake: boolean;
}> {
  const token = api.getAccessToken();
  
  if (!token) {
    return { isAuthenticated: false, hasIntake: false };
  }

  try {
    const response = await api.getIntake();
    
    if (response.error?.code === 'authentication_error') {
      // Token is invalid/expired
      api.setAccessToken(null);
      return { isAuthenticated: false, hasIntake: false };
    }

    return {
      isAuthenticated: true,
      hasIntake: !!response.data,
    };
  } catch {
    return { isAuthenticated: false, hasIntake: false };
  }
}

export function logout() {
  api.logout();
  window.location.href = '/';
}
