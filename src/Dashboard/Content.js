import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSearch, FaSort, FaChevronLeft, FaChevronRight, FaUsers, FaBuilding, FaBriefcase, FaTasks, FaCity } from 'react-icons/fa';
import styles from './Content.module.css';

export default function Content() {
  // State variables for data and UI
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [pageData, setPageData] = useState({
    currentPage: 1,
    employeesPerPage: 7
  });

  const [modalData, setModalData] = useState({
    isOpen: false,
    employee: null,
    departments: []
  });

  const [sortConfig, setSortConfig] = useState({
    field: '',
    order: 'asc'
  });

  const [userProfile, setUserProfile] = useState({
    userName: '',
    userAvatar: ''
  });

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) fetchUserInfo(userId);
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedDepartmentId) fetchEmployeesByDepartment(selectedDepartmentId);
    else fetchEmployees();
    setPageData({ ...pageData, currentPage: 1 });
  }, [selectedDepartmentId]);

  const fetchAllData = () => {
    fetchEmployees();
    fetchDepartments();
    fetchPositions();
    fetchActivities();
  };

  const fetchUserInfo = async (userId) => {
    try {
      const { data } = await axios.get(`http://localhost:8080/api/user/profile?id=${userId}`);
      const imageResponse = await axios.get(`http://localhost:8080/api/user/${userId}/image`);
      setUserProfile({
        userName: data.name,
        userAvatar: imageResponse.data ? `data:image/jpeg;base64,${imageResponse.data}` : ''
      });
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/user/list');
      const employeeData = await Promise.all(
        response.data.map(async (employee) => {
          const imageResponse = await axios.get(`http://localhost:8080/api/user/${employee.id}/image`);
          return { ...employee, image: imageResponse.data ? `data:image/jpeg;base64,${imageResponse.data}` : null };
        })
      );
      setEmployees(employeeData);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchEmployeesByDepartment = async (departmentId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/department/listUser?id=${departmentId}`);
      const employeeData = await Promise.all(
        response.data.map(async (employee) => {
          const imageResponse = await axios.get(`http://localhost:8080/api/user/${employee.id}/image`);
          return { ...employee, image: imageResponse.data ? `data:image/jpeg;base64,${imageResponse.data}` : null };
        })
      );
      setEmployees(employeeData);
    } catch (err) {
      console.error('Error fetching employees by department:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/department/listDepartment');
      const departmentsWithCounts = await Promise.all(
        response.data.map(async (department) => {
          const employeeCount = await fetchEmployeeCount(department.id);
          return { ...department, employeeCount };
        })
      );
      setDepartments(departmentsWithCounts);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchEmployeeCount = async (departmentId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/department/listUser?id=${departmentId}`);
      return response.data.length;
    } catch (err) {
      console.error('Error fetching employee count:', err);
      return 0;
    }
  };

  const fetchPositions = async () => {
    try {
      const { data } = await axios.get('http://localhost:8080/api/position/list');
      setPositions(data);
    } catch (err) {
      console.error('Error fetching positions:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data } = await axios.get('http://localhost:8080/api/activities');
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const fetchEmployeeDepartments = async (employeeId) => {
    try {
      const { data } = await axios.get(`http://localhost:8080/api/department/listDepartmentUser?id=${employeeId}`);
      setModalData({ ...modalData, departments: data });
    } catch (err) {
      console.error('Error fetching employee departments:', err);
    }
  };

  const openModal = (employee) => {
    setModalData({ isOpen: true, employee });
    fetchEmployeeDepartments(employee.id);
  };

  const closeModal = () => {
    setModalData({ isOpen: false, employee: null, departments: [] });
  };

  // Filtering, sorting, and pagination
  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig.field) return 0;
    let fieldA, fieldB;
    switch (sortConfig.field) {
      case 'name': fieldA = a.name.toLowerCase(); fieldB = b.name.toLowerCase(); break;
      case 'email': fieldA = a.email.toLowerCase(); fieldB = b.email.toLowerCase(); break;
      case 'status': fieldA = a.isDelete ? 1 : 0; fieldB = b.isDelete ? 1 : 0; break;
      default: return 0;
    }
    if (fieldA < fieldB) return sortConfig.order === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortConfig.order === 'asc' ? 1 : -1;
    return 0;
  });

  const { currentPage, employeesPerPage } = pageData;
  const totalPages = Math.ceil(sortedEmployees.length / employeesPerPage);
  const currentEmployees = sortedEmployees.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  const handleDepartmentChange = (e) => setSelectedDepartmentId(e.target.value);

  const handleSort = (field) => {
    if (sortConfig.field === field) {
      setSortConfig({ ...sortConfig, order: sortConfig.order === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ field, order: 'asc' });
    }
  };

  const updateCurrentPage = (newPage) => {
    setPageData({ ...pageData, currentPage: newPage });
  };

  // Rendering section
  const totalActiveEmployees = employees.filter((e) => !e.isDelete).length;
  const totalInactiveEmployees = employees.filter((e) => e.isDelete).length;
  const currentDateDisplay = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const {
    employee: selectedEmployee,
    isOpen: isModalOpen,
    departments: employeeDepartments
  } = modalData;

  const getEmployeeDetails = (employee) => {
    return {
      birthDay: employee.birthDay ? new Date(employee.birthDay).toLocaleDateString() : 'Không có',
      positionName: employee.chucDanh || 'Không có chức vụ',
      homeTown: employee.homeTown || 'Không có',
      nationality: employee.nationality || 'Không có',
      sex: employee.gender || 'Không rõ',
      avatar: employee.image || 'https://via.placeholder.com/300',
    };
  };

  // Destructuring of user profile data
  const { userName, userAvatar } = userProfile;

  // JSX begins here
  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <div className={styles.userInfo}>
          <img src={userAvatar || 'https://via.placeholder.com/50'} alt='User Avatar' className={styles.userAvatar} />
          <span>Welcome {userName}</span>
        </div>
      </div>

      <div className={styles.statsRow}>
        {[
          { label: 'Nhân viên', count: employees.length, icon: FaUsers, color: '#3454D1' },
          { label: 'Phòng ban', count: departments.length, icon: FaBuilding, color: '#FF8C00' },
          { label: 'Chức vụ', count: positions.length, icon: FaBriefcase, color: '#D9534F' },
          { label: 'Hoạt động', count: activities.length, icon: FaTasks, color: '#28a745' }
        ].map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statText}>
                <div className={styles.statLabel}>{stat.label}</div>
                <div className={styles.statNumber}>{stat.count}</div>
              </div>
              <div className={styles.iconBox} style={{ backgroundColor: stat.color }}>
                <stat.icon className={styles.statIcon} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <div className={styles.smallBox}>
            <h3>Phòng ban</h3>
            <div className={styles.listContainer}>
              {departments.map((dept) => (
                <div key={dept.id} className={styles.listItem}>
                  <div className={styles.listName}><FaCity className={styles.smallIcon}/> {dept.name}</div>
                  <div className={styles.listCount}>{dept.employeeCount} Nhân viên</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.smallBox}>
            <h3>Chức vụ</h3>
            <div className={styles.listContainer}>
              {positions.map((pos) => (
                <div key={pos.id} className={styles.listItem}>
                  <div className={styles.listName}>{pos.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.largeBox}>
            <div className={styles.employeeHeader}>
              <h3>Danh sách nhân viên</h3>
            </div>

            <div className={styles.employeeStatsRow}>
              <div className={styles.employeeStatBox}>
                <span className={styles.employeeStatLabel}>Tổng nhân viên đã nghỉ</span>
                <div className={styles.employeeStatNumber}>{totalInactiveEmployees}</div>
              </div>
              <div className={styles.employeeStatBox}>
                <span className={styles.employeeStatLabel}>Tổng nhân viên đang làm</span>
                <div className={styles.employeeStatNumber}>{totalActiveEmployees}</div>
              </div>
              <div className={styles.employeeStatBox}>
                <span className={styles.employeeStatLabel}>Ngày tháng năm</span>
                <div className={`${styles.employeeStatNumber} ${styles.smallDate}`}>{currentDateDisplay}</div>
              </div>
            </div>

            <div className={styles.filterRow}>
              <div className={styles.searchBox}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type='text'
                  placeholder='Tìm kiếm nhân viên'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <select
                className={styles.select}
                onChange={handleDepartmentChange}
                value={selectedDepartmentId}
              >
                <option value=''>- Chọn Phòng Ban -</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.employeeTableContainer}>
              <table className={styles.employeeTable}>
                <thead>
                  <tr>
                    {['name', 'email', 'status'].map((field, index) => (
                      <th key={index} onClick={() => handleSort(field)}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                        {sortConfig.field === field && <FaSort className={styles.sortIcon} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length > 0 ? currentEmployees.map((employee) => (
                    <tr key={employee.id} onClick={() => openModal(employee)}>
                      <td className={styles.employeeNameCell}>
                        <img
                          src={employee.image || 'https://via.placeholder.com/40'}
                          alt='Avatar'
                          className={styles.employeeAvatar}
                        />
                        <div className={styles.employeeName}>{employee.name}</div>
                      </td>
                      <td>{employee.email}</td>
                      <td>
                        <span className={`${styles.status} ${employee.isDelete ? styles.inactiveStatus : styles.activeStatus}`}>
                          {employee.isDelete ? 'Đã nghỉ' : 'Đang làm'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} style={{ textAlign: 'center', fontStyle: 'italic' }}>Không có nhân viên</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                {[
                  { icon: FaChevronLeft, onClick: () => updateCurrentPage(currentPage - 1), disabled: currentPage === 1 },
                  ...Array.from({ length: totalPages }, (_, index) => ({
                    text: index + 1, onClick: () => updateCurrentPage(index + 1), isActive: currentPage === index + 1
                  })),
                  { icon: FaChevronRight, onClick: () => updateCurrentPage(currentPage + 1), disabled: currentPage === totalPages }
                ].map((option, idx) => (
                  <button
                    key={idx}
                    onClick={option.onClick}
                    className={`${styles.pageButton} ${option.isActive ? styles.activePage : ''}`}
                    disabled={option.disabled}
                  >
                    {option.icon ? <option.icon /> : option.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && selectedEmployee && (
        <div className={styles.employeeModalOverlay} onClick={closeModal}>
          <div className={styles.employeeModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.employeeModalCloseButton} onClick={closeModal}>&times;</button>
            <div className={styles.employeeModalLayout}>
              <div className={styles.employeeModalLeftColumn}>
                <img src={getEmployeeDetails(selectedEmployee).avatar} alt='Avatar' className={styles.employeeModalAvatar} />
              </div>
              <div className={styles.employeeModalRightColumn}>
                <div className={styles.employeeModalHeaderSection}>
                  <h2 className={styles.employeeModalName}>{selectedEmployee.name}</h2>
                  <p className={styles.employeeModalPosition}>{getEmployeeDetails(selectedEmployee).positionName}</p>
                </div>

                <div className={styles.employeeModalInfoSection}>
                  <div className={styles.employeeModalInfoBlock}>
                    <h3>Thông tin cá nhân</h3>
                    <p>Quê quán: {getEmployeeDetails(selectedEmployee).homeTown}</p>
                    <p>Ngày sinh: {getEmployeeDetails(selectedEmployee).birthDay}</p>
                    <p>Giới tính: {getEmployeeDetails(selectedEmployee).sex}</p>
                  </div>
                  <div className={styles.employeeModalInfoBlock}>
                    <h3>Thông tin liên hệ</h3>
                    <p>Email: {selectedEmployee.email}</p>
                    <p>Số điện thoại: {selectedEmployee.phoneNumber || 'Không có'}</p>
                    <p>Địa chỉ: {selectedEmployee.address || 'Không có'}</p>
                  </div>
                </div>

                <div className={styles.employeeModalJobSection}>
                  <h3>Công việc</h3>
                  <div className={styles.employeeModalJobDetails}>
                    <div className={styles.employeeModalJobInfoColumn}>
                      <p>Phòng ban hiện tại:</p>
                      {employeeDepartments.length > 0 ? (
                        <ul className={styles.employeeModalDepartmentList}>
                          {employeeDepartments.map((dept) => (
                            <li key={dept.id}>
                              <span className={styles.employeeModalDepartmentDot}></span>
                              {dept.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Không có</p>
                      )}
                    </div>
                    <div className={styles.employeeModalJobExtraInfo}>
                      <p>Quốc tịch: {getEmployeeDetails(selectedEmployee).nationality}</p>
                      <p>
                        Tình trạng: {
                          <span className={selectedEmployee.isDelete ? styles.employeeModalStatusDeleted : styles.employeeModalStatusActive}>
                            {selectedEmployee.isDelete ? 'Đã nghỉ' : 'Đang làm'}
                          </span>
                        }
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