import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash, FaEye, FaCheck, FaEllipsisV, FaUser, FaPlus, FaList, FaClipboardCheck, FaUserCheck } from 'react-icons/fa';
import styles from './Activity.module.css';

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [approvedCounts, setApprovedCounts] = useState({});
  const [viewMode, setViewMode] = useState('admin'); // 'admin' or 'user'
  const [adminTab, setAdminTab] = useState('activities'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    id: null,
    activityName: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    participantsCount: 0,
  });
  const [isEditing, setIsEditing] = useState(false);

  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [registrationsSearchTerm, setRegistrationsSearchTerm] = useState('');
  const [approvedRegistrationsSearchTerm, setApprovedRegistrationsSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const [slotFilter, setSlotFilter] = useState('ALL');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [registrations, setRegistrations] = useState([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [loadingApprovedRegistrations, setLoadingApprovedRegistrations] = useState(false);
  const [errorRegistrations, setErrorRegistrations] = useState('');
  const [errorApprovedRegistrations, setErrorApprovedRegistrations] = useState('');
  const [registeringIds, setRegisteringIds] = useState([]);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const isAdmin = role === 'ADMIN' || role === 'MANAGER';

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api";
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  useEffect(() => {
    if (!userId) {
      toast.error("User not found. Please log in.");
      return;
    }
    if (isAdmin) {
      setViewMode('admin');
    } else {
      setViewMode('user');
    }
    fetchActivities();
    // eslint-disable-next-line
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get("/activities");
      const activitiesData = response.data;
      setActivities(activitiesData);

      const counts = await Promise.all(
        activitiesData.map(async (activity) => {
          try {
            const res = await axiosInstance.get(`/activities/department/approve/${activity.id}`, {
              params: { userId },
            });
            return { [activity.id]: res.data.length };
          } catch (err) {
            console.error(`Error fetching approved registrations for activity ${activity.id}:`, err);
            return { [activity.id]: 0 };
          }
        })
      );

      const countsMap = counts.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setApprovedCounts(countsMap);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Không thể lấy danh sách hoạt động.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const resetForm = () => {
    setForm({
      id: null,
      activityName: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      participantsCount: 0,
    });
    setIsEditing(false);
  };

  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isEditing) {
        await axiosInstance.put(`/activities/${form.id}`, form);
        toast.success("Cập nhật hoạt động thành công!");
      } else {
        await axiosInstance.post('/activities', form);
        toast.success("Thêm hoạt động thành công!");
      }
      resetForm();
      fetchActivities();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Không thể lưu hoạt động.');
    }
  };

  const handleEdit = (activity) => {
    setIsEditing(true);
    setForm(activity);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hoạt động này?')) {
      try {
        await axiosInstance.delete(`/activities/${id}`);
        fetchActivities();
        toast.success("Xóa hoạt động thành công!");
      } catch (err) {
        console.error('Error deleting activity:', err);
        setError('Không thể xóa hoạt động.');
      }
    }
  };

  const handleApproveRegistration = async (userIdToApprove) => {
    if (!selectedActivity) {
      toast.error("Không xác định được hoạt động.");
      return;
    }

    const currentApproved = approvedCounts[selectedActivity.id] || 0;
    const maxParticipants = selectedActivity.participantsCount;
    const isFull = currentApproved >= maxParticipants;

    if (isFull) {
      toast.error("Hoạt động đã đầy. Không thể duyệt thêm đăng ký.");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn duyệt đăng ký này?")) {
      try {
        await axiosInstance.put(
          `/activities/${selectedActivity.id}/approve`,
          [userIdToApprove]
        );
        toast.success("Duyệt đăng ký thành công!");
        setRegistrations(prev =>
          prev.filter(user => user.id !== userIdToApprove)
        );
        setApprovedRegistrations(prev => [...prev]);
        setApprovedCounts(prevCounts => ({
          ...prevCounts,
          [selectedActivity.id]: (prevCounts[selectedActivity.id] || 0) + 1,
        }));
      } catch (err) {
        console.error('Error approving registration:', err);
        if (err.response) {
          const { status } = err.response;
          if (status === 400) {
            toast.error("Đăng ký không hợp lệ hoặc đã được duyệt.");
          } else if (status === 403) {
            toast.error("Bạn không có quyền duyệt đăng ký này.");
          } else if (status === 404) {
            toast.error("Hoạt động hoặc người dùng không tồn tại.");
          } else {
            toast.error("Không thể duyệt đăng ký.");
          }
        } else {
          toast.error("Đã xảy ra lỗi trong quá trình duyệt đăng ký.");
        }
      }
    }
  };

  const handleViewRegistrations = async (activity) => {
    setSelectedActivity(activity);
    setAdminTab('registrations');
    setLoadingRegistrations(true);
    setErrorRegistrations('');
    try {
      const response = await axiosInstance.get(`/activities/department/${activity.id}`, {
        params: { userId },
      });
      const data = response.data || [];
      setRegistrations(data);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setErrorRegistrations('Không thể lấy danh sách đăng ký.');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleViewApprovedRegistrations = async (activity) => {
    setSelectedActivity(activity);
    setAdminTab('approved');
    setLoadingApprovedRegistrations(true);
    setErrorApprovedRegistrations('');
    try {
      const response = await axiosInstance.get(`/activities/department/approve/${activity.id}`, {
        params: { userId },
      });
      const data = response.data || [];
      setApprovedRegistrations(data);
    } catch (err) {
      console.error('Error fetching approved registrations:', err);
      setErrorApprovedRegistrations('Không thể lấy danh sách đăng ký đã duyệt.');
    } finally {
      setLoadingApprovedRegistrations(false);
    }
  };

  const handleRegister = async (activityId) => {
    if (!userId) {
      toast.error("User not found. Please log in.");
      return;
    }

    setRegisteringIds((prev) => [...prev, activityId]);

    try {
      const response = await axiosInstance.post(
        `/activities/register/${userId}/${activityId}`
      );

      if (response.status === 200) {
        toast.success("Đăng ký tham gia hoạt động thành công!");
        setApprovedCounts(prevCounts => ({
          ...prevCounts,
          [activityId]: (prevCounts[activityId] || 0) + 1,
        }));
        fetchActivities();
      } else {
        toast.error("Đăng ký tham gia hoạt động thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      if (error.response) {
        const { status } = error.response;
        if (status === 400) {
          toast.error("Bạn đã đăng ký tham gia hoạt động này.");
        } else if (status === 403) {
          toast.error("Bạn không có quyền đăng ký hoạt động này.");
        } else if (status === 409) {
          toast.error("Hoạt động đã đầy.");
        } else {
          toast.error("Đã xảy ra lỗi trong quá trình đăng ký.");
        }
      } else {
        toast.error("Lỗi mạng. Vui lòng thử lại sau.");
      }
    } finally {
      setRegisteringIds((prev) => prev.filter((id) => id !== activityId));
    }
  };

  const getFilteredAndSortedActivities = () => {
    let filteredActivities = activities.filter(activity =>
      activity.activityName.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
      activity.location.toLowerCase().includes(activitySearchTerm.toLowerCase())
    );

    filteredActivities.sort((a, b) => {
      const availableA = (approvedCounts[a.id] || 0) < a.participantsCount;
      const availableB = (approvedCounts[b.id] || 0) < b.participantsCount;
      if (availableA === availableB) return 0;
      return availableA ? -1 : 1;
    });

    return filteredActivities;
  };

  const getFilteredRegistrations = () => {
    return registrations.filter(user => {
      return (
        (user.name && user.name.toLowerCase().includes(registrationsSearchTerm.toLowerCase())) ||
        (user.employeeCode && user.employeeCode.toLowerCase().includes(registrationsSearchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(registrationsSearchTerm.toLowerCase()))
      );
    });
  };

  const getFilteredApprovedRegistrations = () => {
    return approvedRegistrations.filter(user => {
      return (
        (user.name && user.name.toLowerCase().includes(approvedRegistrationsSearchTerm.toLowerCase())) ||
        (user.employeeCode && user.employeeCode.toLowerCase().includes(approvedRegistrationsSearchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(approvedRegistrationsSearchTerm.toLowerCase()))
      );
    });
  };

  const getFilteredUserActivities = () => {
    let filtered = activities.filter(activity =>
      activity.activityName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      activity.location.toLowerCase().includes(userSearchTerm.toLowerCase())
    );

    if (startDateFilter) {
      filtered = filtered.filter(activity => new Date(activity.startDate) >= new Date(startDateFilter));
    }
    if (endDateFilter) {
      filtered = filtered.filter(activity => new Date(activity.endDate) <= new Date(endDateFilter));
    }

    const getSlotStatus = (current, max) => {
      const remaining = max - current;
      if (remaining <= 0) return 'HETCHO';
      if (remaining <= 5) return 'GANHET';
      return 'CONCHO';
    };

    if (slotFilter !== 'ALL') {
      filtered = filtered.filter(activity => {
        const currentApproved = approvedCounts[activity.id] || 0;
        const max = activity.participantsCount;
        const status = getSlotStatus(currentApproved, max);
        return status === slotFilter;
      });
    }

    filtered.sort((a, b) => {
      const currentA = approvedCounts[a.id] || 0;
      const remainingA = a.participantsCount - currentA;

      const currentB = approvedCounts[b.id] || 0;
      const remainingB = b.participantsCount - currentB;

      const rank = (r) => {
        if (r <= 0) return 3; // Hết chỗ
        if (r <= 5 && r > 0) return 1; // Gần hết
        return 2; // Còn chỗ
      };

      const rankA = rank(remainingA);
      const rankB = rank(remainingB);

      if (rankA === rankB) return 0;
      return rankA < rankB ? -1 : 1;
    });

    return filtered;
  };

  const getSlotBadgeClass = (current, max) => {
    const remaining = max - current;
    if (remaining <= 0) {
      return styles.badgeDanger;
    } else if (remaining <= 5) {
      return styles.badgeWarning;
    } else {
      return styles.badgeSuccess;
    }
  };

  const toggleDropdown = (id) => {
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  const switchToAdmin = () => {
    if (isAdmin) {
      setViewMode('admin');
      setAdminTab('activities');
      setSelectedActivity(null);
      setRegistrations([]);
      setApprovedRegistrations([]);
      setErrorRegistrations('');
      setErrorApprovedRegistrations('');
      setActivitySearchTerm('');
      setRegistrationsSearchTerm('');
      setApprovedRegistrationsSearchTerm('');
      setUserSearchTerm('');
      setSlotFilter('ALL');
      setStartDateFilter('');
      setEndDateFilter('');
    }
  };

  const switchToUser = () => {
    if (isAdmin) {
      setViewMode('user');
      setSelectedActivity(null);
      setRegistrations([]);
      setApprovedRegistrations([]);
      setErrorRegistrations('');
      setErrorApprovedRegistrations('');
      setActivitySearchTerm('');
      setRegistrationsSearchTerm('');
      setApprovedRegistrationsSearchTerm('');
      setUserSearchTerm('');
      setSlotFilter('ALL');
      setStartDateFilter('');
      setEndDateFilter('');
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer />

      {/* Header */}
      <header className={styles.header}>
        {isAdmin && (
          <>
            <button 
              className={`${styles.headerButton} ${viewMode === 'admin' ? styles.headerButtonActive : ''}`} 
              onClick={switchToAdmin}
            >
              Duyệt đăng ký
            </button>
            <button 
              className={`${styles.headerButton} ${viewMode === 'user' ? styles.headerButtonActive : ''}`} 
              onClick={switchToUser}
            >
              Chế độ User (Đăng ký)
            </button>
            {viewMode === 'admin' && (
              <button className={styles.addButton} onClick={() => {resetForm(); setShowModal(true);}}>
                <FaPlus /> Thêm hoạt động
              </button>
            )}
          </>
        )}
        {!isAdmin && <h2 className={styles.headerTitle}>Chế độ User</h2>}
      </header>

      <div className={styles.contentWrapper}>
        {/* Sidebar (Admin mode) */}
        {isAdmin && viewMode === 'admin' && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarMenu}>
              <button 
                className={`${styles.sidebarButton} ${adminTab === 'activities' ? styles.sidebarButtonActive : ''}`} 
                onClick={() => {
                  setAdminTab('activities');
                  setSelectedActivity(null);
                }}
              >
                <FaList className={styles.iconMargin}/> Danh sách hoạt động
              </button>
              {selectedActivity && (
                <>
                  <button 
                    className={`${styles.sidebarButton} ${adminTab === 'registrations' ? styles.sidebarButtonActive : ''}`} 
                    onClick={() => {
                      if (selectedActivity) handleViewRegistrations(selectedActivity);
                    }}
                  >
                    <FaUserCheck className={styles.iconMargin}/> Đăng ký chờ duyệt
                  </button>
                  <button 
                    className={`${styles.sidebarButton} ${adminTab === 'approved' ? styles.sidebarButtonActive : ''}`} 
                    onClick={() => {
                      if (selectedActivity) handleViewApprovedRegistrations(selectedActivity);
                    }}
                  >
                    <FaClipboardCheck className={styles.iconMargin}/> Đăng ký đã duyệt
                  </button>
                </>
              )}
            </div>
            {/* Khung ảnh cố định phía dưới sidebar */}
            <div className={styles.imageContainer}>
              {/* Thay src bằng GIF bạn muốn hiển thị */}
              <img src="https://img.upanh.tv/2024/12/13/no-data.gif" alt="Demo GIF" className={styles.sidebarImage}/>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className={styles.main}>
          {viewMode === 'admin' && adminTab === 'activities' && (
            <div className={styles.section}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  className={styles.formControl}
                  placeholder="Tìm kiếm hoạt động..."
                  value={activitySearchTerm}
                  onChange={(e) => setActivitySearchTerm(e.target.value)}
                />
              </div>
              {loading ? (
                <div className={styles.spinnerContainer}>
                  <div className={styles.spinner}></div>
                </div>
              ) : error ? (
                <div className={styles.alertError}>{error}</div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên</th>
                        <th>Mô tả</th>
                        <th>Địa điểm</th>
                        <th>Bắt đầu</th>
                        <th>Kết thúc</th>
                        <th>Số lượng</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredAndSortedActivities().length > 0 ? (
                        getFilteredAndSortedActivities().map((activity) => {
                          const isFull = (approvedCounts[activity.id] || 0) >= activity.participantsCount;
                          return (
                            <tr key={activity.id} className={isFull ? styles.tableRowFull : ''}>
                              <td>{activity.id}</td>
                              <td title={activity.activityName}>{activity.activityName}</td>
                              <td title={activity.description}>{activity.description}</td>
                              <td title={activity.location}>{activity.location}</td>
                              <td>{new Date(activity.startDate).toLocaleDateString()}</td>
                              <td>{new Date(activity.endDate).toLocaleDateString()}</td>
                              <td>{`${approvedCounts[activity.id] || 0}/${activity.participantsCount}`}</td>
                              <td style={{ position:'relative' }}>
                                <button className={styles.menuButton} onClick={() => toggleDropdown(activity.id)}>
                                  <FaEllipsisV />
                                </button>
                                {activeDropdownId === activity.id && (
                                  <ul className={styles.dropdownMenu}>
                                    <li onClick={() => { toggleDropdown(activity.id); handleEdit(activity); }}><FaEdit /> Chỉnh sửa</li>
                                    <li onClick={() => { toggleDropdown(activity.id); handleDelete(activity.id); }}><FaTrash /> Xóa</li>
                                    <li onClick={() => { toggleDropdown(activity.id); handleViewRegistrations(activity); }}><FaEye /> Xem Đăng Ký</li>
                                    <li onClick={() => { toggleDropdown(activity.id); handleViewApprovedRegistrations(activity); }}><FaCheck /> Xem Đã Duyệt</li>
                                  </ul>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" className={styles.textCenter}>Không có hoạt động nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {viewMode === 'admin' && adminTab === 'registrations' && selectedActivity && (
            <div className={styles.section}>
              <h5>Đăng ký chờ duyệt - {selectedActivity.activityName}</h5>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  className={styles.formControl}
                  placeholder="Tìm kiếm đăng ký..."
                  value={registrationsSearchTerm}
                  onChange={(e) => setRegistrationsSearchTerm(e.target.value)}
                />
              </div>
              {loadingRegistrations ? (
                <div className={styles.spinnerContainer}>
                  <div className={styles.spinner}></div>
                </div>
              ) : errorRegistrations ? (
                <div className={styles.alertError}>{errorRegistrations}</div>
              ) : getFilteredRegistrations().length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên</th>
                        <th>Mã nhân viên</th>
                        <th>Email</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredRegistrations().map((user) => {
                        const currentApproved = approvedCounts[selectedActivity.id] || 0;
                        const maxParticipants = selectedActivity.participantsCount;
                        const isFull = currentApproved >= maxParticipants;

                        return (
                          <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.name}</td>
                            <td>{user.employeeCode || user.id}</td>
                            <td>{user.email}</td>
                            <td>
                              {isFull ? (
                                <button className={styles.disabledButton} disabled>
                                  Full
                                </button>
                              ) : (
                                <button 
                                  className={styles.actionButton} 
                                  onClick={() => handleApproveRegistration(user.id)}
                                >
                                  Duyệt
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Không có người dùng nào đăng ký tham gia hoạt động này.</p>
              )}
            </div>
          )}

          {viewMode === 'admin' && adminTab === 'approved' && selectedActivity && (
            <div className={styles.section}>
              <h5>Đã duyệt - {selectedActivity.activityName}</h5>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  className={styles.formControl}
                  placeholder="Tìm kiếm đã duyệt..."
                  value={approvedRegistrationsSearchTerm}
                  onChange={(e) => setApprovedRegistrationsSearchTerm(e.target.value)}
                />
              </div>
              {loadingApprovedRegistrations ? (
                <div className={styles.spinnerContainer}>
                  <div className={styles.spinner}></div>
                </div>
              ) : errorApprovedRegistrations ? (
                <div className={styles.alertError}>{errorApprovedRegistrations}</div>
              ) : getFilteredApprovedRegistrations().length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên nhân viên</th>
                        <th>Mã nhân viên</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredApprovedRegistrations().map((user) => {
                        return (
                          <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.name}</td>
                            <td>{user.employeeCode || user.id}</td>
                            <td>{user.email}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Không có đăng ký đã duyệt cho hoạt động này.</p>
              )}
            </div>
          )}

          {viewMode === 'user' && (
            <div className={styles.section}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  className={styles.formControl}
                  placeholder="Tìm kiếm hoạt động..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.filterRow}>
                <div className={styles.filterGroup}>
                  <label className={styles.formLabel}>Lọc theo Suất</label>
                  <select className={styles.formControl} value={slotFilter} onChange={(e) => setSlotFilter(e.target.value)}>
                    <option value="ALL">Tất cả</option>
                    <option value="CONCHO">Còn chỗ</option>
                    <option value="GANHET">Gần hết</option>
                    <option value="HETCHO">Hết chỗ</option>
                  </select>
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.formLabel}>Lọc từ ngày</label>
                  <input 
                    type="date" 
                    className={styles.formControl} 
                    value={startDateFilter} 
                    onChange={(e) => setStartDateFilter(e.target.value)} 
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.formLabel}>Lọc đến ngày</label>
                  <input 
                    type="date" 
                    className={styles.formControl} 
                    value={endDateFilter} 
                    onChange={(e) => setEndDateFilter(e.target.value)} 
                  />
                </div>
              </div>
              {loading ? (
                <div className={styles.spinnerContainer}>
                  <div className={styles.spinner}></div>
                  <p>Đang tải...</p>
                </div>
              ) : error ? (
                <div className={styles.alertError}>{error}</div>
              ) : (
                <div className={styles.userActivityGrid}>
                  {getFilteredUserActivities().map((activity) => {
                    const currentApproved = approvedCounts[activity.id] || 0;
                    const maxParticipants = activity.participantsCount;
                    const remaining = maxParticipants - currentApproved;
                    const isFull = remaining <= 0;
                    const now = new Date();
                    const end = new Date(activity.endDate);
                    const isOutdated = now > end; 
                    const slotBadgeClass = getSlotBadgeClass(currentApproved, maxParticipants);
                    const slotText = isOutdated ? 'Quá hạn' : (isFull ? 'Hết chỗ' : (remaining <=5 ? 'Gần hết' : 'Còn chỗ'));

                    const cardClass = (isFull || isOutdated) ? styles.cardDisabled : '';

                    return (
                      <div key={activity.id} className={`${styles.activityCard} ${cardClass}`}>
                        <div className={styles.cardHeaderRow}>
                          <h6>Suất đăng ký</h6>
                          {isOutdated ? (
                            <span className={`${styles.badge} ${styles.badgeSecondary}`}>Quá hạn</span>
                          ) : isFull ? (
                            <span className={`${styles.badge} ${styles.badgeDanger}`}>Hết chỗ</span>
                          ) : (
                            <span className={`${styles.badge} ${slotBadgeClass}`}>{slotText}</span>
                          )}
                        </div>
                        <p><FaUser className={styles.iconMargin} /> {currentApproved}/{maxParticipants}</p>
                        <h5 className={styles.activityTitle}>{activity.activityName}</h5>
                        <div className={styles.activityInfo}>
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Địa điểm:</span> {activity.location}
                          </div>
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Bắt đầu:</span> {new Date(activity.startDate).toLocaleDateString()}
                          </div>
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Kết thúc:</span> {new Date(activity.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        <h6>Mô tả</h6>
                        <div className={styles.activityDesc}>
                          <p>{activity.description}</p>
                        </div>
                        <div className={styles.cardFooter}>
                          {isOutdated ? (
                            <button className={styles.disabledButton} disabled>Quá hạn</button>
                          ) : isFull ? (
                            <button className={styles.disabledButton} disabled>Đã đầy</button>
                          ) : (
                            <button 
                              className={styles.actionButton}
                              onClick={() => handleRegister(activity.id)}
                              disabled={registeringIds.includes(activity.id)}
                            >
                              {registeringIds.includes(activity.id) ? 'Đang đăng ký...' : 'Đăng ký'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {getFilteredUserActivities().length === 0 && (
                    <p>Không có hoạt động nào.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal thêm/sửa hoạt động */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h4>{isEditing ? 'Chỉnh sửa Hoạt động' : 'Thêm Hoạt động'}</h4>
            {error && <div className={styles.alertError}>{error}</div>}
            <form onSubmit={handleSubmit} className={styles.formModal}>
              <label className={styles.formLabel}>Tên Hoạt động</label>
              <input 
                type="text" 
                name="activityName" 
                value={form.activityName} 
                onChange={handleChange} 
                className={styles.formControl}
                required 
              />

              <label className={styles.formLabel}>Mô tả</label>
              <textarea 
                name="description" 
                rows={3} 
                value={form.description} 
                onChange={handleChange} 
                className={styles.formControl}
                required 
              ></textarea>

              <label className={styles.formLabel}>Địa điểm</label>
              <input 
                type="text" 
                name="location" 
                value={form.location} 
                onChange={handleChange} 
                className={styles.formControl}
                required 
              />

              <label className={styles.formLabel}>Ngày bắt đầu</label>
              <input 
                type="date" 
                name="startDate" 
                value={form.startDate} 
                onChange={handleChange} 
                className={styles.formControl}
                required 
              />

              <label className={styles.formLabel}>Ngày kết thúc</label>
              <input 
                type="date" 
                name="endDate" 
                value={form.endDate} 
                onChange={handleChange} 
                className={styles.formControl}
                required 
              />

              <label className={styles.formLabel}>Số lượng tham gia</label>
              <input 
                type="number" 
                name="participantsCount" 
                value={form.participantsCount} 
                onChange={handleChange} 
                className={styles.formControl}
                min="0" 
                required 
              />

              <div className={styles.modalFooter}>
                <button type="submit" className={styles.saveBtn}>
                  {isEditing ? 'Cập nhật' : 'Thêm'}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => {setShowModal(false); resetForm();}}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Activity;
