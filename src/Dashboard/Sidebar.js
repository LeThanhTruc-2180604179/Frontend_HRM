import React, { useState, useRef } from 'react';
import {
  FaUserFriends,
  FaTicketAlt,
  FaRocket,
  FaBuilding,
  FaHandshake,
  FaChartLine,
  FaCube,
} from 'react-icons/fa';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen, onContentChange }) => {
  const sidebarRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeItem, setActiveItem] = useState('dashboard'); // Thêm state quản lý item active

  const handleScroll = (e) => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      e.preventDefault();
      e.stopPropagation();
      sidebar.scrollTop += e.deltaY * 0.5;
    }
  };

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleItemClick = (item) => {
    if (item.subMenu) {
      toggleMenu(item.id);
    } else {
      onContentChange(item.id);
    }
    setActiveItem(item.id);
  };

  const menuItems = [
    { id: 'dashboard', icon: <FaCube />, label: 'Dashboard' },
    {
      id: 'employee',
      icon: <FaUserFriends />,
      label: 'Nhân viên',
      subMenu: [
        { label: 'Danh sách', onClick: () => onContentChange('employee') },
        { label: 'Phòng ban', onClick: () => onContentChange('department') },
      ],
    },
    { id: 'Position', icon: <FaTicketAlt />, label: 'Quản lý File' },
    { id: 'evaluate', icon: <FaRocket />, label: 'Đánh giá' },
    { id: 'Activity', icon: <FaBuilding />, label: 'Hoạt động' },
  ];

  return (
    <div
      ref={sidebarRef}
      onWheel={handleScroll}
      className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
    >
      <ul className={styles.nav}>
        {menuItems.map((item, index) => (
          <li
            key={item.id}
            className={styles.navItem}
            style={{ '--nav-item-index': index }}
          >
            <div
              className={`${styles.navLink} ${
                activeItem === item.id ? styles.activeItem : ''
              }`}
              onClick={() => handleItemClick(item)}
            >
              {item.icon}
              {isOpen && <span>{item.label}</span>}
              {item.subMenu && isOpen && (
                <span className={styles.arrow}>
                  {activeMenu === item.id ? '▲' : '▼'}
                </span>
              )}
            </div>
            {item.subMenu && (isOpen || activeMenu === item.id) && (
              <ul
                className={`${styles.subMenu} ${
                  !isOpen ? styles.subMenuClosed : ''
                } ${activeMenu === item.id ? styles.subMenuOpen : ''}`}
              >
                {item.subMenu.map((subItem, subIndex) => (
                  <li
                    key={subIndex}
                    className={styles.subMenuItem}
                    onClick={() => {
                      subItem.onClick();
                      setActiveItem(item.id);
                    }}
                  >
                    {subItem.label}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
