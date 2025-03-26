// src/Manager/ManagerDashboard.js
import React, { useState, useEffect } from 'react';
import styles from './ManagerDashboard.module.css';
import { getDepartmentStats, getUsersStats, getOvertimeStats, exportAttendanceReport } from '../service/managerService';

const ManagerDashboard = () => {
  const [departmentId, setDepartmentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentStats, setDepartmentStats] = useState(null);
  const [usersStats, setUsersStats] = useState([]);
  const [overtimeStats, setOvertimeStats] = useState([]);

  const handleGetStats = async () => {
    try {
      const deptRes = await getDepartmentStats(departmentId, startDate, endDate);
      setDepartmentStats(deptRes.data);

      const usersRes = await getUsersStats(departmentId, startDate, endDate);
      setUsersStats(usersRes.data);

      const overtimeRes = await getOvertimeStats(departmentId, startDate, endDate);
      setOvertimeStats(overtimeRes.data);
    } catch (error) {
      console.error('Error fetching manager stats:', error);
      alert('Lỗi khi lấy thống kê');
    }
  };

  const handleExportReport = async () => {
    try {
      const res = await exportAttendanceReport(departmentId, startDate, endDate);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_report.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Lỗi khi xuất báo cáo');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Dashboard Quản Lý Chấm Công</h1>

      <div className={styles.section}>
        <label>Department ID: </label>
        <input value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} />
      </div>

      <div className={styles.section}>
        <label>Từ ngày: </label>
        <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label>Đến ngày: </label>
        <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className={styles.section}>
        <button onClick={handleGetStats}>Lấy Thống Kê</button>
        <button onClick={handleExportReport}>Xuất Báo Cáo</button>
      </div>

      {departmentStats && (
        <div className={styles.stats}>
          <h2>Thống Kê Phòng Ban</h2>
          <p>Tổng số chấm công: {departmentStats.totalAttendance}</p>
          <p>Số lần đi đúng giờ: {departmentStats.onTimeCount}</p>
          <p>Số lần trễ: {departmentStats.lateCount}</p>
          <p>Số lần vắng mặt: {departmentStats.absentCount}</p>
          <p>Số giờ làm thêm: {departmentStats.overtimeCount}</p>
          <p>Tổng giờ làm việc: {departmentStats.totalWorkingHours}</p>
          {/* Hiển thị các thông tin thống kê khác */}
        </div>
      )}

      {usersStats.length > 0 && (
        <div className={styles.section}>
          <h2>Thống Kê Theo Nhân Viên</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Total Days</th>
                <th>Present Days</th>
                <th>Late Days</th>
                <th>Absent Days</th>
                <th>Overtime Days</th>
                <th>Working Hours</th>
                {/* Thêm các cột cần thiết */}
              </tr>
            </thead>
            <tbody>
              {usersStats.map((user) => (
                <tr key={user.userId}>
                  <td>{user.userId}</td>
                  <td>{user.userName}</td>
                  <td>{user.departmentName}</td>
                  <td>{user.position}</td>
                  <td>{user.totalDays}</td>
                  <td>{user.presentDays}</td>
                  <td>{user.lateDays}</td>
                  <td>{user.absentDays}</td>
                  <td>{user.overtimeDays}</td>
                  <td>{user.totalWorkingHours}</td>
                  {/* Thêm các ô cần thiết */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overtimeStats.length > 0 && (
        <div className={styles.section}>
          <h2>Thống Kê Làm Thêm Giờ</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Overtime Hours</th>
                <th>Overtime Days</th>
              </tr>
            </thead>
            <tbody>
              {overtimeStats.map((overtime) => (
                <tr key={overtime.userId}>
                  <td>{overtime.userId}</td>
                  <td>{overtime.userName}</td>
                  <td>{overtime.departmentName}</td>
                  <td>{overtime.overtimeHours}</td>
                  <td>{overtime.overtimeDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
