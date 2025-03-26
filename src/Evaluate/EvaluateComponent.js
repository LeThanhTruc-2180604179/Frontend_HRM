import React, { useState, useEffect } from 'react';
import EvaluateTab from './EvaluateTab';
import QuestionTab from './QuestionTab';
import QuestionSetTab from './QuestionSetTab';
import TimeEvaluateRoleTab from './TimeEvaluateRoleTab';
import UserEvaluateTab from './UserEvaluateTab';
import styles from './EvaluateComponent.module.css';

const EvaluateComponent = () => {
  const role = localStorage.getItem('role'); // 'EMPLOYEE', 'ADMIN', hoặc 'MANAGER'

  // Chỉnh sửa hàm getAvailableTabs
  const getAvailableTabs = (role) => {
    if (role === 'EMPLOYEE') {
      return [];
    } else if (role === 'MANAGER') {
      // Chỉ hiển thị tab "Bài đánh giá"
      return [
        { key: 'evaluate', label: 'Bài đánh giá' },
      ];
    } else if (role === 'ADMIN') {
      return [
        { key: 'evaluate', label: 'Bài đánh giá' },
        { key: 'question', label: 'Câu hỏi' },
        { key: 'questionSet', label: 'Bộ câu hỏi' },
        { key: 'timeEvaluateRole', label: 'Thời gian/Role' },
        { key: 'userEvaluate', label: 'Người tham gia' },
      ];
    } else {
      return [];
    }
  };

  const availableTabs = getAvailableTabs(role);
  const isEmployee = role === 'EMPLOYEE';

  // Nếu mảng availableTabs trống, mình set defaultTab là 'userEvaluate',
  // nhưng do MANAGER bây giờ chỉ có "Bài đánh giá" nên mặc định sẽ là 'evaluate'.
  const [currentTab, setCurrentTab] = useState(availableTabs[0]?.key || 'userEvaluate');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Kiểm tra xem tab hiện tại còn trong danh sách availableTabs không
  // nếu không thì set lại tab đầu tiên (hoặc 'userEvaluate')
  useEffect(() => {
    if (!availableTabs.find(tab => tab.key === currentTab)) {
      setCurrentTab(availableTabs[0]?.key || 'userEvaluate');
    }
  }, [availableTabs, currentTab]);

  // Cập nhật đồng hồ hiển thị thời gian thực
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className={styles.mainContainer}>
      {/* Hiển thị thanh tab nếu không phải EMPLOYEE và có ít nhất 1 tab */}
      {!isEmployee && availableTabs.length > 0 && (
        <div className={styles.tabBar}>
          <div className={styles.tabButtons}>
            {availableTabs.map(tab => (
              <button
                key={tab.key}
                className={`${styles.tabButton} ${currentTab === tab.key ? styles.activeTab : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={styles.timeDisplay}>{formatTime(currentTime)}</div>
        </div>
      )}

      <div className={styles.tabContent}>
        {/* Nếu là EMPLOYEE, luôn hiện UserEvaluateTab */}
        {isEmployee ? (
          <UserEvaluateTab />
        ) : (
          <>
            {currentTab === 'evaluate' && <EvaluateTab />}
            {currentTab === 'question' && <QuestionTab />}
            {currentTab === 'questionSet' && <QuestionSetTab />}
            {currentTab === 'timeEvaluateRole' && <TimeEvaluateRoleTab />}
            {currentTab === 'userEvaluate' && <UserEvaluateTab />}
          </>
        )}
      </div>
    </div>
  );
};

export default EvaluateComponent;
