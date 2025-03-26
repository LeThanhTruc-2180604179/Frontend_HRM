// Content.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FaSearch, 
  FaSort, 
  FaChevronLeft, 
  FaChevronRight, 
  FaUsers, 
  FaHourglassHalf, // Updated Icon
  FaTasks, 
  FaCity, 
  FaBuilding
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './Content.module.css';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartTooltip, Legend, ChartDataLabels);

export default function Content() {
  // State variables
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  // Removed positions-related states
  const [activities, setActivities] = useState([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  // Removed positionCount
  const [activityCount, setActivityCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  const [currentDateDisplay, setCurrentDateDisplay] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 7;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDepartments, setEmployeeDepartments] = useState([]);

  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const [userDepartments, setUserDepartments] = useState([]);

  // State for Department Leave Stats
  const [departmentLeaveStats, setDepartmentLeaveStats] = useState([]);
  
  // New state for Pending Leave Requests (computed)
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchUserInfo(userId);
    }
    fetchAllData();

    const date = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setCurrentDateDisplay(date.toLocaleDateString('vi-VN', options));
    setCurrentDate(date);
  }, []);

  useEffect(() => {
    if (userDepartments.length > 0) {
      fetchEmployeesForUserDepartments(userDepartments);
      fetchDepartmentLeaveStats(userDepartments);
    }
    setCurrentPage(1);
  }, [userDepartments]);

  const fetchAllData = () => {
    fetchDepartments();
    fetchActivities();
    // Không fetchEmployees trực tiếp vì ta lấy theo phòng ban người dùng
  };

  const fetchUserInfo = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/user/profile?id=${userId}`
      );
      setUserName(response.data.name);

      const imageResponse = await axios.get(
        `http://localhost:8080/api/user/${userId}/image`
      );
      setUserAvatar(
        imageResponse.data
          ? `data:image/jpeg;base64,${imageResponse.data}`
          : ''
      );

      await fetchUserDepartments(userId);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng hoặc ảnh:', error);
    }
  };

  const fetchUserDepartments = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/department/listDepartmentUser?id=${userId}`
      );
      setUserDepartments(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách phòng ban của người dùng:', error);
    }
  };

  const fetchEmployeesForUserDepartments = async (departments) => {
    try {
      const statsPromises = departments.map(dept => 
        axios.get(`http://localhost:8080/api/department/listUser?id=${dept.id}`)
      );
      const statsResponses = await Promise.all(statsPromises);
      const allEmployees = statsResponses.flatMap(res => res.data);

      const uniqueEmployees = Array.from(new Map(allEmployees.map(emp => [emp.id, emp])).values());

      const employeesWithImages = await Promise.all(
        uniqueEmployees.map(async (employee) => {
          try {
            const imageResponse = await axios.get(
              `http://localhost:8080/api/user/${employee.id}/image`
            );
            return {
              ...employee,
              image: imageResponse.data
                ? `data:image/jpeg;base64,${imageResponse.data}`
                : null,
            };
          } catch (error) {
            console.error(`Lỗi khi tải ảnh cho id ${employee.id}:`, error);
            return { ...employee, image: null };
          }
        })
      );

      setEmployees(employeesWithImages);
      setEmployeeCount(employeesWithImages.length);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách nhân viên theo phòng ban người dùng:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/department/listDepartment'
      );
      const departmentsData = response.data;

      const departmentsWithCounts = await Promise.all(
        departmentsData.map(async (department) => {
          const employeeCount = await fetchEmployeeCount(department.id);
          return {
            ...department,
            employeeCount,
          };
        })
      );

      setDepartments(departmentsWithCounts);
      setDepartmentCount(departmentsWithCounts.length);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách phòng ban:', error);
    }
  };

  const fetchEmployeeCount = async (departmentId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/department/listUser?id=${departmentId}`
      );
      return response.data.length;
    } catch (error) {
      console.error('Lỗi khi lấy số lượng nhân viên:', error);
      return 0;
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/activities');
      setActivities(response.data);
      setActivityCount(response.data.length);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách hoạt động:', error);
    }
  };

  const fetchDepartmentLeaveStats = async (departments) => {
    try {
      // Giả sử backend trả về các trường: onLeaveCount, pendingCount, totalLeaveDays
      const statsPromises = departments.map(dept => 
        axios.get(`http://localhost:8080/api/leave/manager/department-stats`, {
          params: {
            departmentId: dept.id,
            startDate: '2024-01-01T00:00:00',
            endDate: '2024-12-31T23:59:59'
          }
        })
      );
      const statsResponses = await Promise.all(statsPromises);
      const statsData = statsResponses.map((res, index) => ({
        departmentName: departments[index].name,
        onLeaveCount: res.data.onLeaveCount,
        pendingCount: res.data.pendingCount,
        totalLeaveDays: res.data.totalLeaveDays
      }));
      setDepartmentLeaveStats(statsData);

      // Compute total pending leave requests from statsData
      const totalPending = statsData.reduce((acc, dept) => acc + (dept.pendingCount || 0), 0);
      setPendingLeaveCount(totalPending);
    } catch (error) {
      console.error('Lỗi khi lấy thống kê nghỉ phép theo phòng ban:', error);
    }
  };

  const fetchEmployeeDepartments = async (employeeId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/department/listDepartmentUser?id=${employeeId}`
      );
      setEmployeeDepartments(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách phòng ban của nhân viên:', error);
    }
  };

  const openModal = (employee) => {
    setSelectedEmployee(employee);
    fetchEmployeeDepartments(employee.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedEmployee(null);
    setEmployeeDepartments([]);
    setIsModalOpen(false);
  };

  // Compute statistics
  const totalActiveEmployees = employees.filter((e) => !e.isDelete).length;
  const totalInactiveEmployees = employees.filter((e) => e.isDelete).length;

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortField) return 0;
    let fieldA, fieldB;
    switch (sortField) {
      case 'name':
        fieldA = a.name.toLowerCase();
        fieldB = b.name.toLowerCase();
        break;
      case 'email':
        fieldA = a.email.toLowerCase();
        fieldB = b.email.toLowerCase();
        break;
      case 'status':
        fieldA = a.isDelete ? 1 : 0; 
        fieldB = b.isDelete ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedEmployees.length / employeesPerPage);
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = sortedEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const birthDay = selectedEmployee && selectedEmployee.birthDay
    ? new Date(selectedEmployee.birthDay).toLocaleDateString()
    : "Không có";

  const positionName = selectedEmployee && selectedEmployee.chucDanh ? selectedEmployee.chucDanh : "Không có chức vụ";
  const homeTown = selectedEmployee && selectedEmployee.homeTown ? selectedEmployee.homeTown : "Không có";
  const nationality = selectedEmployee && selectedEmployee.nationality ? selectedEmployee.nationality : "Không có";
  const sex = selectedEmployee && selectedEmployee.gender ? selectedEmployee.gender : "Không rõ";
  const avatar = selectedEmployee && selectedEmployee.image ? selectedEmployee.image : "https://via.placeholder.com/300";

  return (
    <div className={styles['dashboard-container']}>
      {/* Welcome Section */}
      <div className={styles['welcome-header']}>
        <div className={styles['welcome-content']}>
          <img
            src={userAvatar || 'https://via.placeholder.com/64'}
            alt="User Avatar"
            className={styles['user-avatar']}
          />
          <span className={styles['welcome-text']}>Chào mừng {userName}</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className={styles['horizontal-card-container']}>
        <div className={styles['meeting-count-card']}>
          <div className={styles['card-content']}>
            <span>Nhân viên</span>
            <h2>{employeeCount}</h2>
          </div>
          <div className={styles['icon-container']}>
            <FaUsers /> {/* Biểu tượng nhân viên */}
          </div>
        </div>
        <div className={styles['department-count-card']}>
          <div className={styles['card-content']}>
            <span>Phòng ban</span>
            <h2>{departmentCount}</h2>
          </div>
          <div className={styles['icon-container']}>
            <FaBuilding />
          </div>
        </div>
        {/* New Pending Leave Requests Card */}
        <div className={styles['pending-leave-count-card']}>
          <div className={styles['card-content']}>
            <span>Đơn xin nghỉ chờ duyệt</span>
            <h2>{pendingLeaveCount}</h2>
          </div>
          <div className={styles['icon-container']}>
            <FaHourglassHalf /> {/* Updated Icon */}
          </div>
        </div>
        <div className={styles['activity-count-card']}>
          <div className={styles['card-content']}>
            <span>Hoạt động</span>
            <h2>{activityCount}</h2>
          </div>
          <div className={styles['icon-container']}>
            <FaTasks />
          </div>
        </div>
      </div>

      {/* Main Content: Left and Right Sections */}
      <div className={styles['main-content']}>
        {/* Left Section: Chức vụ và Biểu đồ nghỉ phép */}
        <div className={styles['left-section']}>
         

          {/* Biểu đồ thống kê nghỉ phép theo phòng ban */}
          <div className={styles['progress-card']}>
            <div className={styles['progress-header']}>
              <div className={styles['progress-title']}>
                <h2 className={styles['progress-heading']}>Nghỉ Phép Theo Phòng Ban</h2>
                <p className={styles['progress-date']}>
                  Tính đến thời điểm hiện tại {currentDateDisplay}.
                </p>
              </div>
            </div>

            <div className={styles['chart-container-adjusted']}>
              {departmentLeaveStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={departmentLeaveStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departmentName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="onLeaveCount" fill="#8884d8" name="Đang Nghỉ" />
                    <Bar dataKey="pendingCount" fill="#82ca9d" name="Chờ Duyệt" />
                    <Bar dataKey="totalLeaveDays" fill="#ffc658" name="Tổng Số Ngày Nghỉ" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: '#888' }}>Không có dữ liệu để hiển thị.</p>
              )}
            </div>

            {/* Legend cho Biểu đồ Nghỉ Phép */}
            <div className={styles['leave-legend']}>
              <div className={styles['legend-item']}>
                <span className={styles['legend-color']} style={{ backgroundColor: '#8884d8' }}></span>
                <span>Đang Nghỉ</span>
              </div>
              <div className={styles['legend-item']}>
                <span className={styles['legend-color']} style={{ backgroundColor: '#82ca9d' }}></span>
                <span>Chờ Duyệt</span>
              </div>
              <div className={styles['legend-item']}>
                <span className={styles['legend-color']} style={{ backgroundColor: '#ffc658' }}></span>
                <span>Tổng Số Ngày Nghỉ</span>
              </div>
            </div>
          </div>
           {/* Chức vụ - Để trống */}
           <div className={styles['progress-card']}>
            <div className={styles['progress-header']}>
              <div className={styles['progress-title']}>
                <h2 className={styles['progress-heading']}>Chức vụ</h2>
              </div>
            </div>
            {/* Nội dung để trống */}
          </div>
        </div>

        {/* Right Section: Danh sách nhân viên */}
        <div className={styles['right-section']}>
          <div className={styles['evaluation-card']}>
            {/* Evaluation Header */}
            <div className={styles['evaluation-header']}>
              <div className={styles['header-title']}>
                <h2 className={styles['welcome-text']}>Danh sách nhân viên</h2>
                <p className={styles['date-text']}>{currentDateDisplay}</p>
              </div>
            </div>

            {/* Classification Metrics */}
            <div className={styles['metrics-container']}>
              <div className={styles['metric-card']}>
                <div className={styles['metric-label']}>Đã nghỉ</div>
                <div className={styles['metric-value']}>{totalInactiveEmployees}</div>
              </div>
              <div className={styles['metric-card']}>
                <div className={styles['metric-label']}>Đang làm</div>
                <div className={styles['metric-value']}>{totalActiveEmployees}</div>
              </div>
              <div className={styles['metric-card']}>
                <div className={styles['metric-label']}>Ngày tháng năm</div>
                <div className={`${styles['metric-value']} ${styles['small-date']}`}>
                  {currentDateDisplay}
                </div>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className={styles['search-filter-container']}>
              <div className={styles['search-bar']}>
                <FaSearch className={styles['search-icon']} />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân viên..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  aria-label="Search Employees"
                  className={styles['search-input']}
                />
              </div>
            </div>

            {/* Employee Table */}
            <div className={styles['evaluation-table']} role="table">
              {/* Table Header */}
              <div className={styles['table-header']} role="row">
                <div className={styles['table-cell']} role="columnheader" onClick={() => handleSort('name')}>
                  Nhân viên {sortField === 'name' && <FaSort className={styles['sort-icon']} />}
                </div>
                <div className={styles['table-cell']} role="columnheader" onClick={() => handleSort('email')}>
                  Email {sortField === 'email' && <FaSort className={styles['sort-icon']} />}
                </div>
                <div className={styles['table-cell']} role="columnheader" onClick={() => handleSort('status')}>
                  Trạng thái {sortField === 'status' && <FaSort className={styles['sort-icon']} />}
                </div>
              </div>

              {/* Table Rows */}
              {currentEmployees.map((employee, index) => (
                <div className={styles['table-row']} role="row" key={employee.id} onClick={() => openModal(employee)}>
                  <div className={styles['table-cell']} role="cell">
                    <div className={styles['employeeNameCell']}>
                      <img
                        src={employee.image || 'https://via.placeholder.com/40'}
                        alt='Avatar'
                        className={styles['employee-avatar']}
                      />
                      <div className={styles['employee-name']}>{employee.name}</div>
                    </div>
                  </div>
                  <div className={styles['table-cell']} role="cell">
                    {employee.email}
                  </div>
                  <div className={styles['table-cell']} role="cell">
                    <span
                      className={`${styles['status']} ${
                        employee.isDelete ? styles['inactive-status'] : styles['active-status']
                      }`}
                    >
                      {employee.isDelete ? 'Đã nghỉ' : 'Đang làm'}
                    </span>
                  </div>
                </div>
              ))}

              {/* No Data */}
              {currentEmployees.length === 0 && (
                <div className={styles['table-row']} role="row">
                  <div className={styles['table-cell']} role="cell" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                    Không có nhân viên
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles['pagination']}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={styles['page-button']}
                >
                  <FaChevronLeft/>
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`${styles['page-button']} ${
                      currentPage === index + 1 ? styles['active-page'] : ''
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={styles['page-button']}
                >
                  <FaChevronRight/>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Employee Details */}
      {isModalOpen && selectedEmployee && (
        <div className={styles['employee-modal-overlay']} onClick={closeModal}>
          <div className={styles['employee-modal-content']} onClick={(e) => e.stopPropagation()}>
            <button className={styles['employee-modal-close-button']} onClick={closeModal}>
              &times;
            </button>

            <div className={styles['employee-modal-layout']}>
              <div className={styles['employee-modal-left-column']}>
                <img
                  src={avatar}
                  alt="Avatar"
                  className={styles['employee-modal-avatar']}
                />
              </div>
              <div className={styles['employee-modal-right-column']}>
                <div className={styles['employee-modal-header-section']}>
                  <h2 className={styles['employee-modal-name']}>{selectedEmployee.name}</h2>
                  <p className={styles['employee-modal-position']}>{positionName}</p>
                </div>

                <div className={styles['employee-modal-info-section']}>
                  <div className={styles['employee-modal-info-block']}>
                    <h3>Thông tin cá nhân</h3>
                    <p>Quê quán: {homeTown}</p>
                    <p>Ngày sinh: {birthDay}</p>
                    <p>Giới tính: {sex}</p>
                  </div>
                  <div className={styles['employee-modal-info-block']}>
                    <h3>Thông tin liên hệ</h3>
                    <p>Email: {selectedEmployee.email}</p>
                    <p>Số điện thoại: {selectedEmployee.phoneNumber || "Không có"}</p>
                    <p>Địa chỉ: {selectedEmployee.address || "Không có"}</p>
                  </div>
                </div>

                <div className={styles['employee-modal-job-section']}>
                  <h3>Công việc</h3>
                  <div className={styles['employee-modal-job-details']}>
                    <div className={styles['employee-modal-job-info-column']}>
                      <p>Phòng ban hiện tại:</p>
                      {employeeDepartments.length > 0 ? (
                        <ul className={styles['employee-modal-department-list']}>
                          {employeeDepartments.map((department) => (
                            <li key={department.id}>
                              <span className={styles['employee-modal-department-dot']}></span>
                              {department.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Không có</p>
                      )}
                    </div>
                    <div className={styles['employee-modal-job-extra-info']}>
                      <p>Quốc tịch: {nationality}</p>
                      <p>
                        Tình trạng:{" "}
                        <span className={selectedEmployee.isDelete ? styles['employee-modal-status-deleted'] : styles['employee-modal-status-active']}>
                          {selectedEmployee.isDelete ? "Đã nghỉ" : "Đang làm"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
