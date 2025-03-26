// src/components/Login2.js
import React, { useState, useEffect } from 'react';
import { 
  FaUserLock, 
  FaExclamationCircle, 
  FaUser, 
  FaLock, 
  FaSignInAlt, 
  FaEye, 
  FaEyeSlash, 
  FaHome 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styles from './Login2.module.css';

const Login2 = ({ setUserId, onBackClick }) => {
  const [identifier, setIdentifier] = useState(''); // Sử dụng identifier thay vì email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isButtonActive, setIsButtonActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsButtonActive(identifier.trim() !== '' && password.trim() !== '');
  }, [identifier, password]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isButtonActive) return;

    const loginData = {
      identifier: identifier,  
      password: password,
    };

    fetch('http://localhost:8080/api/auth/login', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',  
      },
      body: JSON.stringify(loginData),  
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid credentials');
          } else if (response.status === 404) {
            throw new Error('User not found');
          } else {
            throw new Error('Authentication failed');
          }
        }
        return response.json(); 
      })
      .then((data) => {
        console.log('Role received from backend:', data.role); // Kiểm tra giá trị role
        console.log('Type of role:', typeof data.role); // Kiểu dữ liệu role
        console.log('User ID received:', data.userId); // Kiểm tra giá trị userId

        const role = typeof data.role === 'string' ? data.role.trim().toUpperCase() : '';
        console.log('Normalized role:', role);

        if (data.accessToken) {  
          localStorage.setItem('token', data.accessToken); 
          localStorage.setItem('userIdentifier', identifier); 
          localStorage.setItem('role', role); 
          localStorage.setItem('userId', data.userId); // Lưu userId vào localStorage

          setUserId(data.userId); // Cập nhật state userId trong App.js
              
          // Điều hướng dựa trên vai trò người dùng
          switch (role) { 
            case 'ADMIN':
              navigate('/dashboard');
              console.log('Navigating to /dashboard');
              break;
            case 'EMPLOYEE':
              navigate('/dashboardEmployee');
              console.log('Navigating to /dashboardEmployee');
              break;
            case 'MANAGER':
              navigate('/dashboardManager');
              console.log('Navigating to /dashboardManager');
              break;
            default:
              setError('Vai trò không hợp lệ.');
              console.error('Unhandled role:', role);
          }
        } else {
          setError('Login failed! Please check your account or password.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Unable to login. Please try again later.');
      });
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.leftContainer}>
        <video autoPlay muted loop className={styles.videoBackground}>
          <source src="/videos/as.mp4" type="video/mp4" />
        </video>
        <div className={styles.overlayText}>
          <h2>Welcome Back!</h2>
          <p>Enter your personal details and start your journey with us</p>
          <button onClick={onBackClick} className={styles.backButton}>
            <FaHome className={styles.icon} /> Home
          </button>
        </div>
      </div>

      <div className={styles.rightContainer}>
        <h1 className={styles.title}>
          <FaUserLock className={styles.iconLarge} /> Login
        </h1>

        {error && (
          <div className={styles.errorBox}>
            <FaExclamationCircle className={styles.errorIcon} />
            <div>
              <p>{error}</p>
              <a href="/forgot-password" className={styles.recoverLink}>
                Forgot Password?
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.singleInputWrapper}>
            <FaUser className={styles.iconInside} />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder=" "
            />
            <label>Identifier (Email or ID)</label> {/* Cập nhật label */}
          </div>

          <div className={styles.singleInputWrapper}>
            <FaLock className={styles.iconInside} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=" "
            />
            <label>Password</label>
            {password && (
              <span 
                className={styles.eyeIcon} 
                onClick={() => setShowPassword(!showPassword)}
                role="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setShowPassword(!showPassword);
                  }
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            )}
          </div>

          <div className={styles.buttonContainer}>
            <button
              type="submit"
              className={`${styles.loginButton} ${isButtonActive ? styles.active : ''}`}
              disabled={!isButtonActive}
            >
              { /* Hiển thị icon và text */ }
              <FaSignInAlt className={styles.icon} /> LOGIN
            </button>
          </div>
          <a href="/forgot-password" className={styles.forgotPasswordRight}>
            Forgot your password?
          </a>
        </form>

        {/* Button tạm thời để kiểm tra navigate */}
        {/* <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button> */}
      </div>
    </div>
  );
};

export default Login2;
