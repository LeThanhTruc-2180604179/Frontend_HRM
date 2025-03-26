// DashboardEmployee.js (ví dụ)
import React, { useState } from 'react';
import Header from './HeaderEmployee';
import Sidebar from './SidebarEmployee';
import DanhSachNhanVien from '../Employee/ListEmployees';
import DepartmentList from '../Department/DepartmentList';
import DepartmentAdd from '../Department/DepartmentAdd';
import DepartmentEdit from '../Department/DepartmentEdit';
import Content from './ContentEmployee';
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
import ResetPW from '../ResetPW/ResetPW';

export default function BangDieuKhien({ userId }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [noiDung, setNoiDung] = useState('dashboardEmployee');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  const doiTrangThaiSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const thayDoiNoiDung = (noiDungMoi, id = null) => {
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
      {/* Header cố định trên cùng */}
      <Header toggleSidebar={doiTrangThaiSidebar} onContentChange={thayDoiNoiDung} />

      <div className="d-flex flex-grow-1" style={{overflow: 'hidden'}}>
        {/* Sidebar bên trái */}
        <Sidebar isOpen={isSidebarOpen} onContentChange={thayDoiNoiDung} />

        {/* Khu vực nội dung chính */}
        <div className={`flex-grow-1 d-flex flex-column ${styles.content} ${isSidebarOpen ? styles.open : styles.closed}`} style={{overflowY: 'auto'}}>
          
          {/* Ví dụ: Thanh công cụ đặt dưới Header */}
          <div className="p-3 border-bottom">
            {/* Tùy biến chỗ đặt nút và dữ liệu để khác admin */}
            {noiDung === 'employee' && (
              <div className="d-flex justify-content-between align-items-center">
                <h4>Danh sách nhân viên</h4>
                {/* Giả sử có nút thêm nhân viên hoặc lọc danh sách */}
                <button className="btn btn-primary" onClick={() => thayDoiNoiDung('addEmployee')}>Thêm nhân viên</button>
              </div>
            )}

            {noiDung === 'department' && (
              <div className="d-flex justify-content-between align-items-center">
                <h4>Phòng ban</h4>
                <button className="btn btn-success" onClick={() => thayDoiNoiDung('addDepartment')}>Thêm phòng ban</button>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="p-4" style={{flexGrow: 1}}>
            {noiDung === 'dashboardEmployee' && <Content />}
            {noiDung === 'employee' && (
              <DanhSachNhanVien onContentChange={thayDoiNoiDung} />
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
            {noiDung === 'meet' && <Meet onContentChange={thayDoiNoiDung} />}
            {noiDung === 'profile' && <UserProfile userId={userId} />}
            {noiDung === 'editUser' && <EditUser id={selectedUserId} />}
            {noiDung === 'joinMeeting' && <JoinMeeting roomId={selectedMeetingId} />}
            {noiDung === 'Addtendance' && <Addtendance />}
            {noiDung === 'Leave' && <Leave />}
            {noiDung === 'ResetPW' && <ResetPW/>}
          </div>
        </div>
      </div>
    </div>
  );
}
