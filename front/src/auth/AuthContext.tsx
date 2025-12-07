import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authUtils } from './authUtils';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    authUtils.isAuthenticated()
  );

  useEffect(() => {
    setIsAuthenticated(authUtils.isAuthenticated());
  }, []);

  const login = (token: string) => {
    authUtils.setToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authUtils.removeToken();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
