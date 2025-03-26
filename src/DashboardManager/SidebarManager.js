import React, { useState, useRef } from 'react';
import {
  FaUserFriends,
  FaTicketAlt,
  FaRocket,
  FaBuilding,
  FaHandshake,
  FaChartLine,
  FaCube,
  FaClock,             // New Icon for Attendance
  FaPlane,            // New Icon for Leave
  FaUsers,            // Alternative Icon for Meeting
} from 'react-icons/fa';
import styles from './Sidebar.module.css'; // Reuse the same CSS module or create another

const SidebarManager = ({ isOpen, onContentChange }) => {
  const sidebarRef = useRef(null); 
  const [activeMenu, setActiveMenu] = useState(null); 
  const [activeItem, setActiveItem] = useState('DashboardManager'); // đặt giá trị mặc định

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

  const handleItemClick = (id) => {
    onContentChange(id);
    setActiveItem(id);
  };

  const menuItems = [
    { id: 'DashboardManager', icon: <FaCube />, label: 'Dashboard' },
    { id: 'Position', icon: <FaTicketAlt />, label: 'Quản lý File' },
    { id: 'evaluate', icon: <FaRocket />, label: 'Đánh giá' },
    { id: 'Activity', icon: <FaBuilding />, label: 'Hoạt động' },
    { id: 'Calender', icon: <FaHandshake />, label: 'Lịch' },
    { 
      id: 'meet', 
      icon: <FaUsers />,       // Updated Icon for Meeting
      label: 'Meeting' 
    },
    { 
      id: 'Leave', 
      icon: <FaPlane />,       // Updated Icon for Leave
      label: ' Quản lý Xin nghỉ' 
    },

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
              className={`${styles.navLink} ${activeItem === item.id ? styles.activeItem : ''}`}
              onClick={() => {
                if (item.subMenu) {
                  toggleMenu(item.id);
                } else {
                  handleItemClick(item.id);
                }
              }}
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
                    onClick={subItem.onClick}
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

export default SidebarManager;
