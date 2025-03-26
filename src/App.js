// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard/Dashboard';
import DashboardEmployee from './DashboardEmployee/DashboardEmployee';
import DanhSachNhanVien from './Employee/ListEmployees';
import DepartmentAdd from './Department/DepartmentAdd';
import DepartmentEdit from './Department/DepartmentEdit';
import DepartmentList from './Department/DepartmentList';
import EditUser from './Employee/EditUser';
import LoginContainer from './Login/LoginContainer';
import UserProfile from './Profile/UserProfile';
import Position from './Position/Position';
import DashboardManager from './DashboardManager/DashboardManager';
import Activity from './Activity/Activity';

const App = () => {
  // Cập nhật trạng thái userId từ localStorage nếu có
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);

  useEffect(() => {
    console.log('Current userId:', userId); // Thêm để kiểm tra
    // Khi có sự thay đổi ở userId, cập nhật lại localStorage
    if (userId) {
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('userId');
    }
  }, [userId]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginContainer setUserId={setUserId} />} />
        <Route
          path="/dashboard"
          element={userId ? <Dashboard userId={userId} /> : <Navigate to="/" />}
        />
        <Route
          path="/dashboardEmployee"
          element={userId ? <DashboardEmployee userId={userId} /> : <Navigate to="/" />}
        />
        <Route
          path="/dashboardManager"
          element={userId ? <DashboardManager userId={userId} /> : <Navigate to="/" />}
        />
        <Route path="/departments" element={<DepartmentList />} />
        <Route path="/department/add" element={<DepartmentAdd />} />
        <Route path="/department/edit/:id" element={<DepartmentEdit />} />
        <Route path="/edit-user/:id" element={<EditUser />} />
        
        {/* Nếu cần, thêm Route cho Activity với một đường dẫn khác */}
        {/* <Route path="/activity" element={<Activity />} /> */}
      </Routes>
    </Router>
  );
};

export default App;