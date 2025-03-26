// DashboardManager.js
import React, { useState, useEffect } from 'react';
import HeaderManager from './HeaderManager';
import SidebarManager from './SidebarManager';
import DanhSachNhanVien from '../Employee/ListEmployees';
import DepartmentList from '../Department/DepartmentList';
import DepartmentAdd from '../Department/DepartmentAdd';
import DepartmentEdit from '../Department/DepartmentEdit';
import ContentManager from './ContentManager';
import styles from './Dashboard.module.css';
import UserProfile from '../Profile/UserProfile';
import EditUser from '../Employee/EditUser';
import Position from '../Position/Position';
import Evaluate from '../Evaluate/EvaluateComponent';
import Calender from '../Calender/Calender';
import Activity from '../Activity/Activity';
import Meet from '../Meet/meet';
import JoinMeeting from '../Meet/JoinMeeting';
import Addtendance from '../Addtendance/Addtendance';
import Leave from '../Leave/Leave';
import ManagerAddtendance from '../Addtendance/ManagerAddtendance';
export default function DashboardManager({ userId }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [noiDung, setNoiDung] = useState('DashboardManager');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  useEffect(() => {
    console.log('Nội dung hiện tại:', noiDung);
  }, [noiDung]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const changeContent = (noiDungMoi, id = null) => {
    console.log('Đổi nội dung sang:', noiDungMoi);
    setNoiDung(noiDungMoi);
    if (noiDungMoi === 'editDepartment') {
      setSelectedDepartmentId(id);
    } else if (noiDungMoi === 'editUser') {
      setSelectedUserId(id);
    } else if (noiDungMoi === 'joinMeeting') {
      setSelectedMeetingId(id);
    }
  };

  return (
    <div className={`${styles.dashboardContainer} d-flex flex-column`} style={{height: '100vh'}}>
      {/* HeaderManager cố định trên cùng */}
      <HeaderManager toggleSidebar={toggleSidebar} onContentChange={changeContent} />

      {/* Khu vực bên dưới header: sidebar và nội dung */}
      <div className="d-flex flex-grow-1" style={{overflow: 'hidden', marginTop: '60px'}}>
        <SidebarManager isOpen={isSidebarOpen} onContentChange={changeContent} />
        <div className={`${styles.content} ${isSidebarOpen ? styles.open : styles.closed} flex-grow-1`} style={{overflowY: 'auto'}}>
          <main className="container py-4">
            {noiDung === 'DashboardManager' && <ContentManager />}
            {noiDung === 'employee' && <DanhSachNhanVien onContentChange={changeContent} />}
            {noiDung === 'department' && (
              <DepartmentList
                onAdd={() => changeContent('addDepartment')}
                onEdit={(id) => changeContent('editDepartment', id)}
              />
            )}
            {noiDung === 'addDepartment' && <DepartmentAdd onBack={() => changeContent('department')} />}
            {noiDung === 'editDepartment' && (
              <DepartmentEdit id={selectedDepartmentId} onBack={() => changeContent('department')} />
            )}
            {noiDung === 'Position' && <Position />}
            {noiDung === 'evaluate' && <Evaluate />}
            {noiDung === 'Activity' && <Activity />}
            {noiDung === 'Calender' && <Calender />}
            {noiDung === 'Addtendance' && <Addtendance />}
            {noiDung === 'Leave' && <Leave />}
            {noiDung === 'meet' && <Meet onContentChange={changeContent} />}
            {noiDung === 'joinMeeting' && <JoinMeeting roomId={selectedMeetingId} />}
            {noiDung === 'profile' && <UserProfile userId={userId} />}
            {noiDung === 'editUser' && <EditUser id={selectedUserId} />}
            {noiDung === 'ManagerAddtendance' && <ManagerAddtendance />}


            
          </main>
        </div>
      </div>
    </div>
  );
}
