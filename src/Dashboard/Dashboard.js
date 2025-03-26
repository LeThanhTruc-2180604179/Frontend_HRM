// Dashboard.js
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import DanhSachNhanVien from '../Employee/ListEmployees';
import DepartmentList from '../Department/DepartmentList';
import DepartmentAdd from '../Department/DepartmentAdd';
import DepartmentEdit from '../Department/DepartmentEdit';
import Content from './Content';
import styles from './Dashboard.module.css';
import UserProfile from '../Profile/UserProfile';
import EditUser from '../Employee/EditUser'; // Import EditUser
import Position from '../Position/Position';
import Evaluate from '../Evaluate/EvaluateComponent';
import Activity from '../Activity/Activity';
import Calender from '../Calender/Calender';
import Addtendance from '../Addtendance/Addtendance';
import Leave from '../Leave/Leave';



export default function BangDieuKhien({ userId }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [noiDung, setNoiDung] = useState('dashboard');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null); // Trạng thái để lưu id của nhân viên được chọn

  const doiTrangThaiSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const thayDoiNoiDung = (noiDungMoi, id = null) => {
    setNoiDung(noiDungMoi);
    if (noiDungMoi === 'editDepartment') {
      setSelectedDepartmentId(id); // Lưu id phòng ban khi cần chỉnh sửa
    } else if (noiDungMoi === 'editUser') {
      setSelectedUserId(id); // Lưu id nhân viên khi cần chỉnh sửa
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar isOpen={isSidebarOpen} onContentChange={thayDoiNoiDung} />
      <div className={`${styles.content} ${isSidebarOpen ? styles.open : styles.closed}`}>
        <Header toggleSidebar={doiTrangThaiSidebar} onContentChange={thayDoiNoiDung} />
        <main className={styles.mainContent}>
          {noiDung === 'dashboard' && <Content />}
          {noiDung === 'employee' && (
            <DanhSachNhanVien onContentChange={thayDoiNoiDung} /> // Truyền hàm thayDoiNoiDung vào DanhSachNhanVien
          )}
          {noiDung === 'department' && (
            <DepartmentList
              onAdd={() => thayDoiNoiDung('addDepartment')}
              onEdit={(id) => thayDoiNoiDung('editDepartment', id)}
            />
          )}
          {noiDung === 'addDepartment' && <DepartmentAdd onBack={() => thayDoiNoiDung('department')} />}
          {noiDung === 'editDepartment' && (
            <DepartmentEdit id={selectedDepartmentId} onBack={() => thayDoiNoiDung('department')} />
          )}
          {noiDung === 'Position' && <Position />}
          {noiDung === 'evaluate' && <Evaluate />}
          {noiDung === 'Activity' && <Activity />}
          {noiDung === 'Calender' && <Calender />}
          {noiDung === 'Addtendance' && <Addtendance/>}
          {noiDung === 'Leave' && <Leave/>}
       
          {noiDung === 'profile' && <UserProfile userId={userId} />}
          {noiDung === 'editUser' && <EditUser id={selectedUserId} />} {/* Hiển thị EditUser với id */}
        </main>
      </div>
    </div>
  );
}
