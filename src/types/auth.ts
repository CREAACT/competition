export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  register: (userData: Omit<User, 'id' | 'status'> & { password: string }) => void;
  logout: () => void;
}