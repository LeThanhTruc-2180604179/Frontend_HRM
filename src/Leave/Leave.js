import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Leave.module.css'; // import CSS module

const API_URL = 'http://localhost:8080/api';

const Leave = () => {
  const role = localStorage.getItem('role') || '';

  // true = chế độ nhân viên, false = chế độ quản lý
  // Không còn sử dụng state isEmployeeMode vì sẽ xác định dựa trên role
  const isEmployee = role === 'EMPLOYEE';
  const isManagerOrAdmin = role === 'ADMIN' || role === 'MANAGER';

  // State cho nhân viên
  const [userId] = useState(() => localStorage.getItem('userId') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('ANNUAL_LEAVE');
  const [reason, setReason] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [remainingLeave, setRemainingLeave] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // State cho quản lý
  const [departmentId, setDepartmentId] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQueryPending, setSearchQueryPending] = useState('');
  const [filterEvidence, setFilterEvidence] = useState('Tất cả');
  const [filterLeaveType, setFilterLeaveType] = useState('Tất cả');

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [visibleEvidence, setVisibleEvidence] = useState({});

  const [managerTab, setManagerTab] = useState('pending'); 
  // tabs: 'pending', 'stats', 'rangeSearch', 'current', 'updateDays', 'revoke', 'exportByEmployee'
  
  // State cho thống kê phòng ban
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');
  const [departmentStats, setDepartmentStats] = useState(null);

  // State cho xuất báo cáo phòng ban
  const [exportedReportBase64, setExportedReportBase64] = useState(null);

  // State cho cập nhật ngày nghỉ
  const [updateUserId, setUpdateUserId] = useState('');
  const [updateDays, setUpdateDays] = useState('');

  // State cho tìm kiếm đơn theo khoảng thời gian
  const [searchRangeStart, setSearchRangeStart] = useState('');
  const [searchRangeEnd, setSearchRangeEnd] = useState('');
  const [searchRangeStatus, setSearchRangeStatus] = useState('');
  const [rangeLeaves, setRangeLeaves] = useState([]);

  // State cho thống kê theo loại nghỉ
  const [typeStats, setTypeStats] = useState({});

  // State cho danh sách nhân viên đang nghỉ
  const [currentLeaves, setCurrentLeaves] = useState([]);

  // State cho revoke (hủy duyệt)
  const [revokeLeaveId, setRevokeLeaveId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  // State cho xuất báo cáo theo nhân viên
  const [exportEmpId, setExportEmpId] = useState('');
  const [exportEmpStart, setExportEmpStart] = useState('');
  const [exportEmpEnd, setExportEmpEnd] = useState('');
  const [employeeReportBlob, setEmployeeReportBlob] = useState(null);

  const maxReasonLength = 160;

  const translateLeaveType = (type) => {
    switch (type) {
      case 'ANNUAL_LEAVE':
        return 'Nghỉ phép năm';
      case 'SICK_LEAVE':
        return 'Nghỉ ốm';
      case 'UNPAID_LEAVE':
        return 'Nghỉ không lương';
      default:
        return type;
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ duyệt';
      case 'APPROVED':
        return 'Đã phê duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'REVOKED':
        return 'Đã hủy duyệt';
      default:
        return status;
    }
  };

  const getMyRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/leave/my-requests`, {
        params: { userId },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMyRequests(res.data);
    } catch (error) {
      console.error('Lỗi lấy danh sách đơn nghỉ:', error);
    }
  };

  const getRemainingLeaveDays = async () => {
    try {
      const res = await axios.get(`${API_URL}/leave/remaining-days`, {
        params: { userId },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setRemainingLeave(res.data);
    } catch (error) {
      console.error('Lỗi lấy số ngày nghỉ còn lại:', error);
    }
  };

  const createLeaveRequest = async () => {
    if (!startDate || !endDate || !leaveType || !reason) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (reason.length > maxReasonLength) {
      alert(`Lý do không được vượt quá ${maxReasonLength} ký tự`);
      return;
    }

    const leaveData = {
      user: { id: userId },
      startDate: startDate,
      endDate: endDate,
      type: leaveType,
      reason: reason,
    };

    const formData = new FormData();
    formData.append('leave', new Blob([JSON.stringify(leaveData)], { type: 'application/json' }));
    if (evidenceFile) {
      formData.append('evidence', evidenceFile);
    }

    try {
      await axios.post(`${API_URL}/leave/request`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('Tạo đơn xin nghỉ thành công');
      setStartDate('');
      setEndDate('');
      setLeaveType('ANNUAL_LEAVE');
      setReason('');
      setEvidenceFile(null);
      getMyRequests();
      getRemainingLeaveDays();
    } catch (error) {
      console.error('Lỗi tạo đơn xin nghỉ:', error);
      if (error.response && error.response.data) {
        alert(`Lỗi: ${error.response.data}`);
      } else {
        alert('Tạo đơn xin nghỉ thất bại');
      }
    }
  };

  const cancelLeaveRequest = async (leaveId) => {
    try {
      await axios.post(`${API_URL}/leave/${leaveId}/cancel`, null, {
        headers: {
          'user-id': userId,
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('Hủy đơn nghỉ thành công');
      getMyRequests();
      getRemainingLeaveDays();
    } catch (error) {
      console.error('Lỗi hủy đơn:', error);
      alert('Hủy đơn thất bại');
    }
  };

  const getPendingLeavesByDepartment = async () => {
    if (!departmentId) return;
    try {
      const res = await axios.get(`${API_URL}/leave/manager/pending-requests`, {
        params: { departmentId },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setPendingRequests(res.data);
    } catch (error) {
      console.error('Lỗi lấy danh sách đơn chờ duyệt:', error);
    }
  };

  const approveLeaveRequest = async (leaveId, approved, comment = '') => {
    const approverId = userId;
    try {
      await axios.post(`${API_URL}/leave/manager/${leaveId}/approve`, null, {
        params: { approverId, approved, comment },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert(`Đã ${approved ? 'phê duyệt' : 'từ chối'} đơn nghỉ ID: ${leaveId}`);
      getPendingLeavesByDepartment();
      if (selectedRequest && selectedRequest.id === leaveId) {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Lỗi phê duyệt đơn nghỉ:', error);
      alert('Phê duyệt đơn thất bại');
    }
  };

  const fetchDepartmentId = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_URL}/user/user-department`, {
        params: { userId },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setDepartmentId(res.data);
    } catch (error) {
      console.error('Lỗi lấy ID Phòng Ban:', error);
    }
  };

  const viewEvidence = async (leaveId) => {
    try {
      const res = await axios.get(`${API_URL}/leave/manager/${leaveId}/evidence`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setVisibleEvidence(prevState => ({
        ...prevState,
        [leaveId]: res.data,
      }));
    } catch (error) {
      console.error('Lỗi lấy minh chứng:', error);
      alert('Lỗi lấy minh chứng');
    }
  };

  const getDepartmentStats = async () => {
    if (!statsStartDate || !statsEndDate || !departmentId) {
      alert('Nhập đủ phòng ban, ngày bắt đầu, ngày kết thúc');
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/leave/manager/department-stats`, {
        params: { 
          departmentId,
          startDate: statsStartDate,
          endDate: statsEndDate,
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setDepartmentStats(res.data);
    } catch (error) {
      console.error('Lỗi lấy thống kê phòng ban:', error);
      alert('Lỗi lấy thống kê');
    }
  };

  const exportDeptReport = async () => {
    if (!statsStartDate || !statsEndDate || !departmentId) {
      alert('Nhập đủ phòng ban, ngày bắt đầu, ngày kết thúc');
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/leave/manager/export`, {
        params: { 
          departmentId,
          startDate: statsStartDate,
          endDate: statsEndDate
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setExportedReportBase64(res.data);
    } catch (error) {
      console.error('Lỗi xuất báo cáo:', error);
      alert('Lỗi xuất báo cáo');
    }
  };

  const downloadDeptReport = () => {
    if (!exportedReportBase64) {
      alert('Chưa có báo cáo để tải');
      return;
    }
    const link = document.createElement('a');
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${exportedReportBase64}`;
    link.download = 'department_leave_report.xlsx';
    link.click();
  };

  const updateLeaveDays = async () => {
    if (!updateUserId || !updateDays) {
      alert('Nhập userId và số ngày nghỉ');
      return;
    }
    try {
      await axios.put(`${API_URL}/leave/manager/update-leave-days`, null, {
        params: { 
          userId: updateUserId,
          annualLeaveDays: updateDays
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('Cập nhật số ngày nghỉ thành công');
    } catch (error) {
      console.error('Lỗi cập nhật số ngày nghỉ:', error);
      alert('Cập nhật thất bại');
    }
  };

  const searchLeavesByRange = async () => {
    if (!searchRangeStart || !searchRangeEnd || !departmentId) {
      alert('Nhập đủ phòng ban, ngày bắt đầu, ngày kết thúc');
      return;
    }
    try {
      const params = {
        departmentId,
        startDate: searchRangeStart,
        endDate: searchRangeEnd,
      };
      if (searchRangeStatus) {
        params.status = searchRangeStatus;
      }

      const res = await axios.get(`${API_URL}/leave/manager/leaves`, {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setRangeLeaves(res.data);
    } catch (error) {
      console.error('Lỗi tìm kiếm đơn nghỉ:', error);
      alert('Lỗi tìm kiếm');
    }
  };

  const getTypeStats = async () => {
    if (!statsStartDate || !statsEndDate || !departmentId) {
      alert('Nhập đủ phòng ban, ngày bắt đầu, ngày kết thúc');
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/leave/manager/stats/by-type`, {
        params: {
          departmentId,
          startDate: statsStartDate,
          endDate: statsEndDate
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setTypeStats(res.data);
    } catch (error) {
      console.error('Lỗi lấy thống kê theo loại:', error);
      alert('Lỗi lấy thống kê loại nghỉ');
    }
  };

  const getCurrentLeaves = async () => {
    if (!departmentId) return;
    try {
      const res = await axios.get(`${API_URL}/leave/manager/current-leaves`, {
        params: { departmentId },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setCurrentLeaves(res.data);
    } catch (error) {
      console.error('Lỗi lấy danh sách đang nghỉ:', error);
      alert('Lỗi lấy danh sách');
    }
  };

  const revokeLeaveApproval = async () => {
    if (!revokeLeaveId || !revokeReason) {
      alert('Nhập ID đơn nghỉ và lý do hủy');
      return;
    }
    try {
      const params = {
        managerId: userId,
        reason: revokeReason
      };
      await axios.post(`${API_URL}/leave/manager/${revokeLeaveId}/revoke`, null, {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert(`Đã hủy duyệt đơn ${revokeLeaveId}`);
    } catch (error) {
      console.error('Lỗi hủy duyệt đơn:', error);
      alert('Hủy duyệt thất bại');
    }
  };

  const exportReportByEmployee = async () => {
    if (!exportEmpId || !exportEmpStart || !exportEmpEnd) {
      alert('Nhập đủ User, Ngày bắt đầu, Ngày kết thúc');
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/leave/manager/export/by-employee`, {
        params: {
          userId: exportEmpId,
          startDate: exportEmpStart,
          endDate: exportEmpEnd
        },
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      setEmployeeReportBlob(blob);
    } catch (error) {
      console.error('Lỗi xuất báo cáo theo nhân viên:', error);
      alert('Lỗi xuất báo cáo');
    }
  };

  const downloadEmployeeReport = () => {
    if (!employeeReportBlob) {
      alert('Chưa có báo cáo để tải');
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(employeeReportBlob);
    link.download = 'employee_leave_report.xlsx';
    link.click();
  };

  useEffect(() => {
    if (isEmployee) {
      getMyRequests();
      getRemainingLeaveDays();
    } else if (isManagerOrAdmin) {
      if (!departmentId) {
        fetchDepartmentId();
      } else {
        if (managerTab === 'pending') {
          getPendingLeavesByDepartment();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee, isManagerOrAdmin, departmentId, managerTab]);

  useEffect(() => {
    fetchDepartmentId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMyRequests = myRequests.filter(req =>
    translateLeaveType(req.type).toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toString().includes(searchQuery) ||
    translateStatus(req.status).toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingRequests = pendingRequests
    .filter(req => {
      if (filterEvidence === 'Có minh chứng' && !req.evidenceImage) return false;
      if (filterEvidence === 'Không minh chứng' && req.evidenceImage) return false;

      const viType = translateLeaveType(req.type);
      if (filterLeaveType !== 'Tất cả' && viType !== filterLeaveType) return false;

      return true;
    })
    .filter(req =>
      translateLeaveType(req.type).toLowerCase().includes(searchQueryPending.toLowerCase()) ||
      req.id.toString().includes(searchQueryPending) ||
      (req.user && req.user.id.toString().includes(searchQueryPending)) ||
      translateStatus(req.status).toLowerCase().includes(searchQueryPending.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchQueryPending.toLowerCase())
    );

  const handleViewRequest = (req) => {
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(null);
    } else {
      setSelectedRequest(req);
      if (req.evidenceImage) {
        viewEvidence(req.id);
      } else {
        setVisibleEvidence(prevState => {
          const newState = { ...prevState };
          delete newState[req.id];
          return newState;
        });
      }
    }
  };

  return (
    <div className={styles.container}>
      {isEmployee && (
        // Chế độ Nhân Viên
        <div className={styles.employeeWrapper}>
          <div className={styles.leftColumn}>
            <h2 className={styles.formTitle}>Tạo đơn xin nghỉ</h2>
            <div className={styles.formGroupRow}>
              <div className={styles.formGroup}>
                <label>Từ ngày</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Đến ngày</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>Loại nghỉ phép</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option value="ANNUAL_LEAVE">Nghỉ phép năm</option>
                <option value="SICK_LEAVE">Nghỉ ốm</option>
                <option value="UNPAID_LEAVE">Nghỉ không lương</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>Lý do</label>
              <textarea
                placeholder="Nhập lý do..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={maxReasonLength}
                className={styles.textarea}
              />
              <div className={styles.charCounter}>
                {reason.length}/{maxReasonLength} ký tự
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Nộp hình ảnh minh chứng (Nếu có):</label>
              <div className={styles.dropArea}>
                <input
                  type="file"
                  accept="image/*"
                  id="fileInput"
                  style={{display: 'none'}}
                  onChange={(e) => setEvidenceFile(e.target.files[0])}
                />
                <label htmlFor="fileInput" className={styles.fileLabel}>
                  {evidenceFile ? evidenceFile.name : 'Chọn hoặc kéo File ảnh minh chứng'}
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <button className={styles.submitButton} onClick={createLeaveRequest}>
                Gửi đơn xin nghỉ
              </button>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.remainInfo}>
              <div className={styles.infoRow}>
                <div className={styles.infoCol}>
                  <p>Nghỉ ốm còn lại</p>
                  <span className={`${styles.infoBadge} ${styles.badgeSick}`}>
                    {remainingLeave ? `${remainingLeave.sickLeaveRemaining} ngày` : '-'}
                  </span>
                </div>
                <div className={styles.infoCol}>
                  <p>Nghỉ phép năm còn lại</p>
                  <span className={`${styles.infoBadge} ${styles.badgeAnnual}`}>
                    {remainingLeave ? `${remainingLeave.annualLeaveRemaining} ngày` : '-'}
                  </span>
                </div>
                <div className={styles.infoCol}>
                  <p>Đơn đang chờ duyệt</p>
                  <span className={`${styles.infoBadge} ${styles.badgePending}`}>
                    {remainingLeave ? `${remainingLeave.pendingRequests} đơn` : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.requestListSection}>
              <h3>Danh sách đơn xin nghỉ</h3>
              <div className={styles.searchArea}>
                <input
                  type="text"
                  placeholder="Tìm kiếm đơn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {filteredMyRequests.length > 0 ? (
                <div className={styles.tableContainer}>
                  <table className={styles.requestTable}>
                    <thead>
                      <tr>
                        <th>Loại</th>
                        <th>ID</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMyRequests.map((req) => (
                        <tr key={req.id}>
                          <td>{translateLeaveType(req.type)}</td>
                          <td>{req.id}</td>
                          <td>
                            {new Date(req.startDate).toLocaleDateString('vi-VN')} - {new Date(req.endDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td>{translateStatus(req.status)}</td>
                          <td>
                            {req.status === 'PENDING' && (
                              <button className={styles.cancelButton} onClick={() => cancelLeaveRequest(req.id)}>HỦY</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.noRequests}>Chưa có đơn nghỉ</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isManagerOrAdmin && (
        // Chế độ Quản Lý
        <div className={styles.managerModeContainer}>
          <div className={styles.managerSidebar}>
            <h4>QUẢN LÝ</h4>
            <ul className={styles.navList}>
              <li className={managerTab === 'pending' ? styles.active : ''} onClick={() => setManagerTab('pending')}>Đơn chờ duyệt</li>
              <li className={managerTab === 'stats' ? styles.active : ''} onClick={() => setManagerTab('stats')}>Thống kê / Báo cáo</li>
              <li className={managerTab === 'rangeSearch' ? styles.active : ''} onClick={() => setManagerTab('rangeSearch')}>Tìm đơn theo thời gian</li>
              <li className={managerTab === 'current' ? styles.active : ''} onClick={() => {setManagerTab('current'); getCurrentLeaves();}}>Đang nghỉ</li>
              <li className={managerTab === 'updateDays' ? styles.active : ''} onClick={() => setManagerTab('updateDays')}>Cập nhật ngày nghỉ</li>
              <li className={managerTab === 'revoke' ? styles.active : ''} onClick={() => setManagerTab('revoke')}>Hủy duyệt</li>
              <li className={managerTab === 'exportByEmployee' ? styles.active : ''} onClick={() => setManagerTab('exportByEmployee')}>Báo cáo nhân viên</li>
            </ul>
          </div>

          <div className={styles.managerMainContent}>
            <h1 className={styles.managerTitle}>Quản lý nghỉ phép</h1>
            <p className={styles.departmentInfo}>ID PHÒNG BAN : {departmentId || '-'}</p>

            {managerTab === 'pending' && (
              <div className={styles.managerContent}>
                <div className={styles.leftPanel}>
                  <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                      <button className={styles.filterBtn}>{filterEvidence === 'Tất cả' ? 'Có minh chứng' : filterEvidence}</button>
                      <div className={styles.dropdown}>
                        <div onClick={() => setFilterEvidence('Tất cả')}>Tất cả</div>
                        <div onClick={() => setFilterEvidence('Có minh chứng')}>Có minh chứng</div>
                        <div onClick={() => setFilterEvidence('Không minh chứng')}>Không minh chứng</div>
                      </div>
                    </div>
                    <div className={styles.filterGroup}>
                      <button className={styles.filterBtn}>{filterLeaveType === 'Tất cả' ? 'Loại nghỉ phép' : filterLeaveType}</button>
                      <div className={styles.dropdown}>
                        <div onClick={() => setFilterLeaveType('Tất cả')}>Tất cả</div>
                        <div onClick={() => setFilterLeaveType('Nghỉ phép năm')}>Nghỉ phép năm</div>
                        <div onClick={() => setFilterLeaveType('Nghỉ ốm')}>Nghỉ ốm</div>
                        <div onClick={() => setFilterLeaveType('Nghỉ không lương')}>Nghỉ không lương</div>
                      </div>
                    </div>
                    <div className={styles.searchWrapper}>
                      <input
                        type="text"
                        placeholder="Tìm theo tên hoặc email"
                        value={searchQueryPending}
                        onChange={(e) => setSearchQueryPending(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <h3 className={styles.requestListTitle}>Danh sách đơn xin nghỉ</h3>
                  <div className={styles.tableContainer}>
                    <table className={styles.requestTableManager}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Nhân Viên</th>
                          <th>Loại</th>
                          <th>Thời gian</th>
                          <th>Lí do / minh chứng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPendingRequests.map((req) => {
                          const isSelected = selectedRequest && selectedRequest.id === req.id;
                          return (
                            <tr key={req.id}>
                              <td>{req.id}</td>
                              <td>{req.user ? req.user.id : 'N/A'}</td>
                              <td>{translateLeaveType(req.type)}</td>
                              <td>
                                {new Date(req.startDate).toLocaleString('vi-VN')} - {new Date(req.endDate).toLocaleString('vi-VN')}
                              </td>
                              <td>
                                <button className={styles.viewButton} onClick={() => handleViewRequest(req)}>
                                  {isSelected ? 'Hủy' : 'Xem'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.rightPanel}>
                  {selectedRequest ? (
                    <>
                      <div className={styles.employeeInfo}>
                        <span>Nhân viên : {selectedRequest.user ? selectedRequest.user.id : '-'}</span>
                        <div className={styles.actionButtons}>
                          <button className={styles.rejectBtn} onClick={() => approveLeaveRequest(selectedRequest.id, false)}>Từ chối</button>
                          <button className={styles.approveBtn} onClick={() => approveLeaveRequest(selectedRequest.id, true)}>Duyệt</button>
                        </div>
                      </div>
                      <div className={styles.reasonBox}>
                        <h4>Lí do</h4>
                        <p>{selectedRequest.reason}</p>
                      </div>
                      <div className={styles.evidenceBox}>
                        <h4>Ảnh minh chứng</h4>
                        {selectedRequest.evidenceImage ? (
                          visibleEvidence[selectedRequest.id] ? (
                            <img
                              src={`data:image/png;base64,${visibleEvidence[selectedRequest.id]}`}
                              alt="Minh chứng"
                              className={styles.evidenceImageManager}
                            />
                          ) : (
                            <p>Đang tải...</p>
                          )
                        ) : (
                          <p>Không có minh chứng</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className={styles.placeholderBox}>
                      <p>Chọn "Xem" từ danh sách để hiển thị thông tin</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {managerTab === 'stats' && (
              <div className={styles.managerAdvanced}>
                <h3>Thống kê & Báo cáo</h3>
                <div className={styles.formGroup}>
                  <label>Ngày bắt đầu (ISO):</label>
                  <input type="datetime-local" value={statsStartDate} onChange={(e) => setStatsStartDate(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Ngày kết thúc (ISO):</label>
                  <input type="datetime-local" value={statsEndDate} onChange={(e) => setStatsEndDate(e.target.value)} />
                </div>
                <div className={styles.buttonGroup}>
                  <button onClick={getDepartmentStats}>Xem Thống kê Phòng Ban</button>
                  <button onClick={getTypeStats}>Thống kê Theo Loại Nghỉ</button>
                  <button onClick={exportDeptReport}>Xuất Báo Cáo (Base64)</button>
                </div>
                {departmentStats && (
                  <div className={styles.statsResult}>
                    <h4>Kết quả Thống kê:</h4>
                    <p>Tổng nhân viên: {departmentStats.totalEmployees}</p>
                    <p>Số đơn đang nghỉ: {departmentStats.onLeaveCount}</p>
                    <p>Số đơn pending: {departmentStats.pendingCount}</p>
                    <p>Tổng ngày nghỉ: {departmentStats.totalLeaveDays}</p>
                    <p>Trung bình ngày nghỉ/người: {departmentStats.averageLeaveDays}</p>
                  </div>
                )}
                {Object.keys(typeStats).length > 0 && (
                  <div className={styles.statsResult}>
                    <h4>Thống kê theo loại nghỉ:</h4>
                    {Object.entries(typeStats).map(([t, count]) => (
                      <p key={t}>{translateLeaveType(t)}: {count} đơn</p>
                    ))}
                  </div>
                )}
                {exportedReportBase64 && (
                  <div className={styles.statsResult}>
                    <h4>Báo cáo Phòng Ban (Base64) đã sẵn sàng tải:</h4>
                    <button onClick={downloadDeptReport}>Tải xuống báo cáo</button>
                  </div>
                )}
              </div>
            )}

            {managerTab === 'rangeSearch' && (
              <div className={styles.managerAdvanced}>
                <h3>Tìm đơn nghỉ theo khoảng thời gian</h3>
                <div className={styles.formGroup}>
                  <label>Ngày bắt đầu (ISO):</label>
                  <input type="datetime-local" value={searchRangeStart} onChange={(e) => setSearchRangeStart(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Ngày kết thúc (ISO):</label>
                  <input type="datetime-local" value={searchRangeEnd} onChange={(e) => setSearchRangeEnd(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Trạng thái (tùy chọn):</label>
                  <select value={searchRangeStatus} onChange={(e) => setSearchRangeStatus(e.target.value)}>
                    <option value="">Tất cả</option>
                    <option value="PENDING">Đang chờ duyệt</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="REJECTED">Đã từ chối</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="REVOKED">Đã hủy duyệt</option>
                  </select>
                </div>
                <button onClick={searchLeavesByRange}>Tìm kiếm</button>
                {rangeLeaves.length > 0 && (
                  <div className={styles.tableContainer}>
                    <h4>Kết quả tìm kiếm:</h4>
                    <table className={styles.requestTable}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Nhân Viên</th>
                          <th>Loại</th>
                          <th>Thời gian</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rangeLeaves.map(leave => (
                          <tr key={leave.id}>
                            <td>{leave.id}</td>
                            <td>{leave.user ? leave.user.id : ''}</td>
                            <td>{translateLeaveType(leave.type)}</td>
                            <td>{new Date(leave.startDate).toLocaleString('vi-VN')} - {new Date(leave.endDate).toLocaleString('vi-VN')}</td>
                            <td>{translateStatus(leave.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {managerTab === 'current' && (
              <div className={styles.managerAdvanced}>
                <h3>Nhân viên đang nghỉ</h3>
                {currentLeaves.length > 0 ? (
                  <table className={styles.requestTable}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nhân Viên</th>
                        <th>Loại</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentLeaves.map(leave => (
                        <tr key={leave.id}>
                          <td>{leave.id}</td>
                          <td>{leave.user ? leave.user.id : ''}</td>
                          <td>{translateLeaveType(leave.type)}</td>
                          <td>{new Date(leave.startDate).toLocaleString('vi-VN')} - {new Date(leave.endDate).toLocaleString('vi-VN')}</td>
                          <td>{translateStatus(leave.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>Không có ai đang nghỉ</p>
                )}
              </div>
            )}

            {managerTab === 'updateDays' && (
              <div className={styles.managerAdvanced}>
                <h3>Cập nhật số ngày nghỉ</h3>
                <div className={styles.formGroup}>
                  <label>User ID:</label>
                  <input type="text" value={updateUserId} onChange={(e) => setUpdateUserId(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Số ngày nghỉ phép năm:</label>
                  <input type="number" value={updateDays} onChange={(e) => setUpdateDays(e.target.value)} />
                </div>
                <button onClick={updateLeaveDays}>Cập nhật</button>
              </div>
            )}

            {managerTab === 'revoke' && (
              <div className={styles.managerAdvanced}>
                <h3>Hủy duyệt đơn nghỉ</h3>
                <div className={styles.formGroup}>
                  <label>ID Đơn nghỉ:</label>
                  <input type="text" value={revokeLeaveId} onChange={(e) => setRevokeLeaveId(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Lý do hủy duyệt:</label>
                  <input type="text" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} />
                </div>
                <button onClick={revokeLeaveApproval}>Hủy duyệt</button>
              </div>
            )}

            {managerTab === 'exportByEmployee' && (
              <div className={styles.managerAdvanced}>
                <h3>Xuất báo cáo theo nhân viên</h3>
                <div className={styles.formGroup}>
                  <label>User ID:</label>
                  <input type="text" value={exportEmpId} onChange={(e) => setExportEmpId(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Ngày bắt đầu (ISO):</label>
                  <input type="datetime-local" value={exportEmpStart} onChange={(e) => setExportEmpStart(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Ngày kết thúc (ISO):</label>
                  <input type="datetime-local" value={exportEmpEnd} onChange={(e) => setExportEmpEnd(e.target.value)} />
                </div>
                <button onClick={exportReportByEmployee}>Xuất báo cáo</button>
                {employeeReportBlob && (
                  <div>
                    <button onClick={downloadEmployeeReport}>Tải xuống báo cáo nhân viên</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
