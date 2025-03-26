import React, { useState, useEffect, useRef } from 'react';
import {
  FaBars,
  FaBell,
  FaCommentDots,
  FaSearch,
  FaCaretDown,
  FaCaretUp,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios'; // Thêm axios để thực hiện các yêu cầu HTTP
import styles from './Header.module.css'; 

const Header = ({ toggleSidebar, onContentChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [userAvatar, setUserAvatar] = useState(''); // Cập nhật lại để có thể thay đổi giá trị
  const [userName, setUserName] = useState(''); // Thêm state để lưu tên người dùng nếu cần
  const dropdownRef = useRef(null); 
  const navigate = useNavigate(); 

  const handleMenuClick = (e) => {
    e.preventDefault();
    setIsMenuOpen(!isMenuOpen);
    toggleSidebar();
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    navigate('/');
  };

  // Hàm lấy thông tin người dùng
  const fetchUserInfo = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/user/profile?id=${userId}`
      );
      setUserName(response.data.name);

      const imageResponse = await axios.get(
        `http://localhost:8080/api/user/${userId}/image`
      );
      setUserAvatar(
        imageResponse.data
          ? `data:image/jpeg;base64,${imageResponse.data}`
          : ''
      );
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng hoặc ảnh:', error);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchUserInfo(userId);
    }
  }, []);

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${styles.customHeader}`}>
      <div className="container-fluid d-flex justify-content-between align-items-center">
          {/* Logo và nút mở sidebar */}
          <div className="d-flex align-items-center">
            <div className={`navbar-brand d-flex align-items-center ${styles.customLogo}`}>
              <span className={styles.brandText}>Mini HR</span>
              <FaBars
                className={`${styles.menuIcon} ${isMenuOpen ? styles.menuOpen : ''}`}
                onClick={handleMenuClick}
              />
            </div>
          </div>

        {/* Tìm kiếm */}
        {/* Bạn có thể thêm phần tìm kiếm tại đây nếu cần */}

        {/* Biểu tượng thông báo và dropdown */}
        <div className={`d-flex align-items-center ${styles.notificationGroup}`}>
        
          {/* Dropdown menu */}
          <div className="dropdown" ref={dropdownRef}>
            <a
              href="/"
              className={`d-flex align-items-center ${styles.userMenuLink}`}
              onClick={toggleDropdown}
              style={{ textDecoration: 'none' }}
            >
              <img
                src={userAvatar || './img/user.png'}
                alt="User Avatar"
                className={styles.userAvatar}
              />
              <span className={styles.adminText}>{userName || 'Menu'}</span>
              {isDropdownOpen ? (
                <FaCaretUp className={styles.iconDropdown} />
              ) : (
                <FaCaretDown className={styles.iconDropdown} />
              )}
            </a>

            {isDropdownOpen && (
              <ul className={`dropdown-menu show ${styles.dropdownMenu}`}>
                <li
                  className="dropdown-item"
                  onClick={() => onContentChange('profile')}
                >
                  My Profile
                </li>
                <li
                  className="dropdown-item"
                  onClick={() => onContentChange('ResetPW')}
                >
                  Đổi mật khẩu
                </li>
                <li
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  Logout
                </li>
              
                
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
