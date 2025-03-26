import React, { useState, useRef } from 'react';
import {
  FaUserFriends,
  FaProjectDiagram,
  FaTicketAlt,
  FaRocket,
  FaBuilding,
  FaHandshake,
  FaChartLine,
  FaCube,
  FaClock,
  FaUmbrellaBeach,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import styles from './Sidebar.module.css'; // Import CSS module

const Sidebar = ({ isOpen, onContentChange }) => {
  const sidebarRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeItem, setActiveItem] = useState('dashboardEmployee'); // Default active item

  const handleScroll = (e) => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      e.preventDefault();
      e.stopPropagation();
      sidebar.scrollTop += e.deltaY * 0.5;
    }
  };

  const handleItemClick = (id) => {
    onContentChange(id);
    setActiveItem(id);
    // If the clicked item has a submenu, toggle it
    if (id === 'employee') {
      setActiveMenu((prev) => (prev === 'employee' ? null : 'employee'));
    } else {
      setActiveMenu(null); // Close other submenus
    }
  };

  return (
    <div
      ref={sidebarRef}
      onWheel={handleScroll}
      className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
    >
      <ul className={styles.nav}>
        {/* Dashboard */}
        <li className={styles.navItem}>
          <div
            className={`${styles.navLink} ${activeItem === 'dashboardEmployee' ? styles.activeItem : ''}`}
            onClick={() => handleItemClick('dashboardEmployee')}
          >
            <FaCube className={styles.icon} />
            {isOpen && <span>Dashboard</span>}
          </div>
        </li>

        

        {/* Quản lý File */}
        <li className={styles.navItem}>
          <div
            className={`${styles.navLink} ${activeItem === 'Position' ? styles.activeItem : ''}`}
            onClick={() => handleItemClick('Position')}
          >
            <FaTicketAlt className={styles.icon} />
            {isOpen && <span>Quản lý File</span>}
          </div>
        </li>

        {/* Đánh giá */}
        <li className={styles.navItem}>
          <div
            className={`${styles.navLink} ${activeItem === 'evaluate' ? styles.activeItem : ''}`}
            onClick={() => handleItemClick('evaluate')}
          >
            <FaRocket className={styles.icon} />
            {isOpen && <span>Đánh giá</span>}
          </div>
        </li>

        {/* Hoạt động */}
        <li className={styles.navItem}>
          <div
            className={`${styles.navLink} ${activeItem === 'Activity' ? styles.activeItem : ''}`}
            onClick={() => handleItemClick('Activity')}
          >
            <FaBuilding className={styles.icon} />
            {isOpen && <span>Hoạt động</span>}
          </div>
        </li>

        {/* Lịch */}
        <li className={styles.navItem}>
          <div
            className={`${styles.navLink} ${activeItem === 'Calender' ? styles.activeItem : ''}`}
            onClick={() => handleItemClick('Calender')}
          >
            <FaHandshake className={styles.icon} />
            {isOpen && <span>Lịch</span>}
          </div>
        </li>

        {/* Meeting */}
        <li className={styles.navItem}>
          <div
            className={`${styles.navLink} ${activeItem === 'meet' ? styles.activeItem : ''}`}
            onClick={() => handleItemClick('meet')}
          >
            <FaChartLine className={styles.icon} />
            {isOpen && <span>Meeting</span>}
          </div>
        </li>

        {/* Xin nghỉ */}
        <li className={styles.navItem}>
          <div
            className={`${styles.navLink} ${activeItem === 'Leave' ? styles.activeItem : ''}`}
            onClick={() => handleItemClick('Leave')}
          >
            <FaUmbrellaBeach className={styles.icon} />
            {isOpen && <span>Xin nghỉ</span>}
          </div>
        </li>
         {/* Xin nghỉ */}
         <li className={styles.navItem}>
          <div
            className={`${styles.navLink} ${activeItem === 'Addtendance' ? styles.activeItem : ''}`}
            onClick={() => handleItemClick('Addtendance')}
          >
            <FaUmbrellaBeach className={styles.icon} />
            {isOpen && <span>Checkin</span>}
          </div>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
