import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaEdit, FaTrash, FaUsers, FaPlus, 
  FaTimes, FaCheck, FaUserCheck, FaList, 
  FaVideo, FaInfoCircle, FaEllipsisV 
} from 'react-icons/fa';
import styles from './Meet.module.css'; // Đảm bảo CSS module này tồn tại và được thiết kế đúng

const Meet = ({ onContentChange }) => {
  const [meetings, setMeetings] = useState([]);
  const [form, setForm] = useState({
    meetingName: "",
    startTime: "",
    endTime: "",
    description: "",
  });
  const [editing, setEditing] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState(null);

  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);

  const [activeTab, setActiveTab] = useState('list'); 
  // Tabs: 'list' = Danh sách cuộc họp, 'create' = Tạo/Sửa cuộc họp, 'participants' = Thêm người dùng

  const [openMenuId, setOpenMenuId] = useState(null); // Quản lý các menu dropdown mở

  const apiBase = "http://localhost:8080/api";
  const loggedInUserId = localStorage.getItem('userId');
  const role = localStorage.getItem('role'); 

  // Lấy danh sách cuộc họp cho người dùng đang đăng nhập
  const fetchMeetings = async () => {
    try {
      const response = await axios.get(`${apiBase}/meetings/list/${loggedInUserId}`);
      setMeetings(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Không tìm thấy cuộc họp cho người dùng
        setMeetings([]);
      } else {
        console.error("Error fetching meetings:", error);
        alert('Đã xảy ra lỗi khi lấy danh sách cuộc họp.');
      }
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (loggedInUserId && role !== "EMPLOYEE") {
      fetchUsersInSameDepartment();
    }
  }, [loggedInUserId, role]);

  const fetchUsersInSameDepartment = async () => {
    try {
      const response = await axios.get(`${apiBase}/department/listUsersWithCommonDepartment`, {
        params: { userId: loggedInUserId },
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users in the same department:', error);
      alert('Đã xảy ra lỗi khi lấy danh sách người dùng.');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmitMeeting = async (e) => {
    e.preventDefault();
    try {
      const userId = loggedInUserId; // Lấy userId từ localStorage
      if (!userId) {
        alert('Bạn cần đăng nhập để tạo cuộc họp.');
        return;
      }

      if (editing) {
        // Khi chỉnh sửa, gửi yêu cầu PUT để cập nhật cuộc họp
        await axios.put(`${apiBase}/meetings/update`, {
          id: currentMeeting.id,
          meetingName: form.meetingName,
          startTime: new Date(form.startTime),
          endTime: new Date(form.endTime),
          description: form.description,
          participants: currentMeeting?.participants || [],
        });
        setEditing(false);
        setCurrentMeeting(null);
      } else {
        // Khi tạo mới, gửi yêu cầu POST với userId trong URL
        await axios.post(`${apiBase}/meetings/add-video/${userId}`, {
          meetingName: form.meetingName,
          startTime: new Date(form.startTime),
          endTime: new Date(form.endTime),
          description: form.description,
        });
        // Lấy danh sách cuộc họp cập nhật
        await fetchMeetings();
        const latestMeeting = getLatestMeeting();
        if (latestMeeting) {
          setCurrentRoomId(latestMeeting.id);
        }
      }

      // Reset form sau khi gửi
      setForm({
        meetingName: "",
        startTime: "",
        endTime: "",
        description: "",
      });
      // Không cần gọi fetchMeetings() ở đây vì đã gọi ở trên
    } catch (error) {
      console.error("Error creating/updating meeting:", error);
      alert('Đã xảy ra lỗi khi tạo/cập nhật cuộc họp. Vui lòng thử lại.');
    }
  };

  const getLatestMeeting = () => {
    if (meetings && meetings.length > 0) {
      return meetings[meetings.length - 1];
    }
    return null;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc họp này không?')) {
      try {
        await axios.delete(`${apiBase}/meetings/delete/${id}`);
        fetchMeetings();
      } catch (error) {
        console.error("Error deleting meeting:", error);
        alert('Đã xảy ra lỗi khi xóa cuộc họp.');
      }
    }
  };

  const handleEdit = (meeting) => {
    setEditing(true);
    setActiveTab('create'); // Khi chỉnh sửa, chuyển sang tab tạo/chỉnh sửa
    setCurrentMeeting(meeting);
    setForm({
      meetingName: meeting.meetingName,
      startTime: new Date(meeting.startTime).toISOString().slice(0, 16),
      endTime: new Date(meeting.endTime).toISOString().slice(0, 16),
      description: meeting.description,
    });
  };

  const handleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleAddUsersToMeeting = async () => {
    if (!currentRoomId) {
      alert('Vui lòng chọn hoặc tạo một cuộc họp trước.');
      return;
    }

    if (selectedUsers.length === 0) {
      alert('Vui lòng chọn ít nhất một người dùng.');
      return;
    }

    try {
      const params = new URLSearchParams();
      selectedUsers.forEach((u) => params.append('userID', u));

      const response = await axios.post(`${apiBase}/meetings/add-users/${currentRoomId}?${params.toString()}`);
      if (response.status === 200) {
        alert('Thêm người dùng vào cuộc họp thành công!');
        setSelectedUsers([]);
        fetchMeetings();
      }
    } catch (error) {
      console.error('Error adding users to the meeting:', error);
      alert('Đã xảy ra lỗi khi thêm người dùng vào cuộc họp.');
    }
  };

  // Xử lý mở/đóng menu dropdown
  const toggleMenu = (id) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(id);
    }
  };

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.dropdown}`)) {
        setOpenMenuId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Kiểm tra xem cuộc họp đã hết hạn chưa
  const isMeetingExpired = (endTime) => {
    return new Date(endTime) < new Date();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h2 className={styles.headerTitle}>Quản lý cuộc họp</h2>
        {/* Tooltip hướng dẫn */}
        <div className={styles.tooltipContainer}>
          <FaInfoCircle className={styles.infoIcon}/>
          <div className={styles.tooltipContent}>
            <h5>Hướng dẫn nhanh</h5>
            <p><b>Tạo cuộc họp:</b> Nhập thông tin và nhấn "Thêm cuộc họp".</p>
            <p><b>Thêm người dùng:</b> Chọn một cuộc họp từ danh sách và thêm người dùng.</p>
            <p><b>Tham gia cuộc họp:</b> Nhấn "Tham gia" trong danh sách cuộc họp.</p>
          </div>
        </div>
      </header>

      {/* Nội dung chính */}
      <div className={styles.contentWrapper}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {role !== "EMPLOYEE" && (
            <button 
              className={`${styles.sidebarButton} ${activeTab === 'create' ? styles.sidebarActive : ''}`} 
              onClick={() => { setActiveTab('create'); setEditing(false); setCurrentMeeting(null); }}
            >
              <FaVideo className={styles.iconMargin}/> Tạo/Sửa cuộc họp
            </button>
          )}
          <button 
            className={`${styles.sidebarButton} ${activeTab === 'list' ? styles.sidebarActive : ''}`} 
            onClick={() => setActiveTab('list')}
          >
            <FaList className={styles.iconMargin}/> Danh sách cuộc họp
          </button>
          {role !== "EMPLOYEE" && (
            <button 
              className={`${styles.sidebarButton} ${activeTab === 'participants' ? styles.sidebarActive : ''}`} 
              onClick={() => {
                if (!currentRoomId) {
                  alert('Vui lòng chọn hoặc tạo một cuộc họp trước.');
                  return;
                }
                setActiveTab('participants');
              }}
            >
              <FaUserCheck className={styles.iconMargin}/> Thêm người dùng
            </button>
          )}
        </aside>

        {/* Khu vực nội dung chính */}
        <main className={styles.mainContent}>
          {/* Tạo/Sửa Cuộc Họp */}
          {activeTab === 'create' && role !== "EMPLOYEE" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h4>{editing ? "Sửa cuộc họp" : "Tạo cuộc họp mới"}</h4>
                {/* Nút Hủy chỉ hiển thị khi đang chỉnh sửa */}
                {editing && (
                  <button 
                    className={styles.cancelBtn} 
                    onClick={() => {
                      setEditing(false);
                      setCurrentMeeting(null);
                      setForm({
                        meetingName: "",
                        startTime: "",
                        endTime: "",
                        description: "",
                      });
                    }}
                  >
                    <FaTimes /> Hủy
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmitMeeting} className={styles.formModal}>
                <label className={styles.formLabel}>Tên cuộc họp</label>
                <input
                  type="text"
                  name="meetingName"
                  value={form.meetingName}
                  onChange={handleChange}
                  className={styles.formControl}
                  required
                />

                <label className={styles.formLabel}>Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className={styles.formControl}
                  required
                />

                <label className={styles.formLabel}>Thời gian kết thúc</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className={styles.formControl}
                  required
                />

                <label className={styles.formLabel}>Mô tả</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className={styles.formControl}
                  rows={3}
                ></textarea>

                <div className={styles.modalFooter}>
                  <button type="submit" className={styles.saveBtn}>
                    {editing ? (
                      <> <FaCheck /> Cập nhật cuộc họp </>
                    ) : (
                      <> <FaPlus /> Thêm cuộc họp </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Danh sách Cuộc Họp */}
          {activeTab === 'list' && (
            <div className={styles.section}>
              <h4>Cuộc họp hiện có</h4>
              {/* Chỉ hiển thị văn bản thông tin nếu không phải EMPLOYEE */}
              {role !== "EMPLOYEE" && (
                <p className={styles.infoText}>
                  Dưới đây là danh sách tất cả các cuộc họp. Bạn có thể sửa, xóa (nếu có quyền), chọn cuộc họp để thêm người dùng hoặc tham gia cuộc họp.
                </p>
              )}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tên cuộc họp</th>
                      <th>Thời gian bắt đầu</th>
                      <th>Thời gian kết thúc</th>
                      <th>Mô tả</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.length > 0 ? (
                      meetings.map((meeting) => (
                        <tr key={meeting.id}>
                          <td title={meeting.meetingName}>{meeting.meetingName}</td>
                          <td>
                            {new Date(meeting.startTime).toLocaleString("vi-VN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td>
                            {new Date(meeting.endTime).toLocaleString("vi-VN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td title={meeting.description}>{meeting.description}</td>
                          <td className={styles.dropdown}>
                            {role === "EMPLOYEE" ? (
                              // Đối với EMPLOYEE, hiển thị nút "Tham gia" duy nhất
                              isMeetingExpired(meeting.endTime) ? (
                                <button className={`${styles.actionButton} ${styles.disabledBtn}`} disabled>
                                  Đã quá hạn
                                </button>
                              ) : (
                                <button
                                  className={styles.actionButton}
                                  onClick={() => onContentChange('joinMeeting', meeting.id)}
                                >
                                  <FaUsers className={styles.iconMargin}/> Tham gia
                                </button>
                              )
                            ) : (
                              // Đối với các vai trò khác, hiển thị menu dropdown
                              <>
                                <button 
                                  className={styles.actionButton} 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    toggleMenu(meeting.id); 
                                  }}
                                >
                                  <FaEllipsisV />
                                </button>
                                {openMenuId === meeting.id && (
                                  <div className={styles.dropdownContent}>
                                    {role !== "EMPLOYEE" && (
                                      <>
                                        <button 
                                          onClick={() => {
                                            handleEdit(meeting);
                                            setCurrentRoomId(meeting.id);
                                            setActiveTab('create');
                                            setOpenMenuId(null);
                                          }}
                                          className={styles.dropdownItem}
                                        >
                                          <FaEdit /> Sửa
                                        </button>
                                        <button 
                                          onClick={() => {
                                            handleDelete(meeting.id);
                                            setOpenMenuId(null);
                                          }}
                                          className={`${styles.dropdownItem} ${styles.deleteBtn}`}
                                        >
                                          <FaTrash /> Xóa
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setCurrentRoomId(meeting.id);
                                            setActiveTab('participants');
                                            setOpenMenuId(null);
                                          }}
                                          className={styles.dropdownItem}
                                        >
                                          <FaUserCheck /> Thêm người dùng
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => {
                                        onContentChange('joinMeeting', meeting.id);
                                        setOpenMenuId(null);
                                      }}
                                      className={styles.dropdownItem}
                                    >
                                      <FaUsers /> Tham gia
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className={styles.textCenter}>Không tìm thấy cuộc họp.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Thêm Người Dùng vào Cuộc Họp */}
          {activeTab === 'participants' && role !== "EMPLOYEE" && (
            <div className={styles.section}>
              <h4>Thêm người dùng vào cuộc họp</h4>
              {currentRoomId ? (
                <p>Thêm người dùng vào ID cuộc họp: <b>{currentRoomId}</b></p>
              ) : (
                <p className={styles.infoText}>
                  Vui lòng tạo hoặc chọn một cuộc họp từ thanh sidebar trước.
                  Sau khi tạo, cuộc họp mới nhất sẽ được chọn tự động.
                </p>
              )}
              {users.length === 0 ? (
                <p>Không tìm thấy người dùng hoặc bạn chưa đăng nhập.</p>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Chọn</th>
                        <th>ID người dùng</th>
                        <th>Tên</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(u.id)}
                              onChange={() => handleUserSelect(u.id)}
                            />
                          </td>
                          <td>{u.id}</td>
                          <td>{u.username}</td>
                          <td>{u.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className={styles.modalFooter}>
                <button onClick={handleAddUsersToMeeting} className={styles.actionButton}>
                  <FaUserCheck /> Thêm người dùng vào cuộc họp
                </button>
                <button 
                  onClick={() => setActiveTab('list')} 
                  className={`${styles.cancelBtn} ${styles.actionButton}`}
                >
                  <FaTimes /> Hủy
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Meet;
