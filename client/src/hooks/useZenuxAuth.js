import { useContext } from 'react';
import { AuthContext } from '../components/auth/AuthContext';

export default function useZenuxAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useZenuxAuth must be used within an AuthProvider');
  }
  return context;
}