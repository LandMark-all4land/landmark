import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      login(token);
      navigate('/map');
    } else {
      navigate('/');
    }
  }, [searchParams, login, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontSize: '1.2rem',
      color: '#666'
    }}>
      로그인 중...
    </div>
  );
};

export default OAuthCallback;
