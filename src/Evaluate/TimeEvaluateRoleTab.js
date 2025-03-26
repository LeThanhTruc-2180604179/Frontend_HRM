import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaClipboardList,
  FaCog,
  FaCalendarAlt,
  FaSave,
  FaTimes,
  FaEdit,
  FaUsers,
  FaUserTie,
} from 'react-icons/fa';
import styles from './TimeEvaluateRoleTab.module.css';

const API_EVALUATE_URL = 'http://localhost:8080/api/evaluate/list';
const API_TIME_EVALUATE_ROLE_URL = 'http://localhost:8080/api/timeEvaluateRole';

const TimeEvaluateRoleTab = () => {
  const [evaluates, setEvaluates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedEvaluate, setSelectedEvaluate] = useState(null);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [timeSettings, setTimeSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentRole = localStorage.getItem('role');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      setError('Không tìm thấy user ID. Vui lòng đăng nhập.');
      return;
    }
    setUserId(storedUserId);
  }, []);

  const fetchEvaluates = async () => {
    setLoading(true);
    try {
      const evaluatesResponse = await axios.get(API_EVALUATE_URL);
      const evaluatesData = evaluatesResponse.data;

      const timeRolesResponse = await axios.get(`${API_TIME_EVALUATE_ROLE_URL}/list`);
      const timeRolesData = timeRolesResponse.data;

      const timeRoleMap = {};
      timeRolesData.forEach((timeRole) => {
        if (!timeRoleMap[timeRole.evaluate.id]) {
          timeRoleMap[timeRole.evaluate.id] = [];
        }
        timeRoleMap[timeRole.evaluate.id].push(timeRole);
      });

      const combinedEvaluates = evaluatesData.map((evaluate) => ({
        ...evaluate,
        timeEvaluateRoles: timeRoleMap[evaluate.id] || [],
      }));

      setEvaluates(combinedEvaluates);
      setError(null);
    } catch (error) {
      console.error('Error fetching evaluates:', error.response || error.message);
      setError('Có lỗi xảy ra khi tải danh sách kỳ đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_TIME_EVALUATE_ROLE_URL}/listRole`);
      let fetchedRoles = response.data;
      if (currentRole === 'ADMIN') {
        fetchedRoles = fetchedRoles.filter(
          (role) =>
            role.name.toUpperCase() === 'EMPLOYEE' || role.name.toUpperCase() === 'MANAGER'
        );
      }

      setRoles(fetchedRoles);
      setError(null);
    } catch (error) {
      console.error('Error fetching roles:', error.response || error.message);
      setError('Có lỗi xảy ra khi tải danh sách vai trò.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeEvaluateRoles = async (evaluateId) => {
    try {
      const response = await axios.get(`${API_TIME_EVALUATE_ROLE_URL}/list`, {
        params: { evaluateId },
      });
      const existingTimeSettings = response.data;

      const initialTimeSettings = {};
      existingTimeSettings.forEach((timeRole) => {
        initialTimeSettings[timeRole.role.id] = {
          startDay: timeRole.startDay ? timeRole.startDay.split('T')[0] : '',
          endDay: timeRole.endDay ? timeRole.endDay.split('T')[0] : '',
        };
      });
      setTimeSettings(initialTimeSettings);
    } catch (error) {
      console.error('Error fetching time settings:', error.response || error.message);
      setError('Có lỗi xảy ra khi tải thiết lập thời gian.');
    }
  };

  const handleRoleSetup = async (evaluate) => {
    setSelectedEvaluate(evaluate);
    await fetchRoles();
    await fetchTimeEvaluateRoles(evaluate.id);
    setShowRolesModal(true);
  };

  const handleTimeChange = (roleId, field, value) => {
    setTimeSettings((prevState) => ({
      ...prevState,
      [roleId]: {
        ...prevState[roleId],
        [field]: value,
      },
    }));
  };

  const validateTimeSettings = () => {
    for (const role of roles) {
      const settings = timeSettings[role.id];
      if (settings) {
        if (settings.startDay && settings.endDay && settings.endDay < settings.startDay) {
          alert(`Thời gian kết thúc không thể trước thời gian bắt đầu cho vai trò ${role.name}.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveTimeSettings = async () => {
    if (!validateTimeSettings()) return;

    if (Object.keys(timeSettings).length === 0) {
      alert('Vui lòng thiết lập thời gian cho các vai trò.');
      return;
    }

    const timeEvaluateRoles = roles.map((role) => ({
      role: { id: role.id },
      evaluate: { id: selectedEvaluate.id },
      startDay: timeSettings[role.id]?.startDay,
      endDay: timeSettings[role.id]?.endDay,
    }));

    try {
      setLoading(true);
      await axios.put(`${API_TIME_EVALUATE_ROLE_URL}/update`, timeEvaluateRoles);
      alert('Cập nhật thời gian thành công!');
      setShowRolesModal(false);
      setTimeSettings({});
      setError(null);
      await fetchEvaluates();
    } catch (error) {
      console.error('Error saving time settings:', error.response || error.message);
      setError('Có lỗi xảy ra khi lưu thiết lập thời gian.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluates();
  }, []);

  const renderTimeRoles = (timeRoles) => {
    if (timeRoles.length === 0) return 'Chưa thiết lập';
    return (
      <ul className={styles.timeRoleList}>
        {timeRoles.map((timeRole) => (
          <li key={timeRole.id} className={styles.timeRoleItem}>
            {timeRole.role.name.toUpperCase() === 'MANAGER' ? (
              <FaUserTie className={styles.iconManager} />
            ) : (
              <FaUsers className={styles.iconEmployee} />
            )}
            <strong>{timeRole.role.name}:</strong>{' '}
            {timeRole.startDay ? new Date(timeRole.startDay).toLocaleDateString() : 'N/A'} -{' '}
            {timeRole.endDay ? new Date(timeRole.endDay).toLocaleDateString() : 'N/A'}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.mainContainer}>
      <h2 className={styles.title}>
        <FaClipboardList className={styles.titleIcon} /> Quản lý Thời gian/Vai trò
      </h2>

      {loading && (
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
        </div>
      )}
      {error && <div className={styles.alertError}>{error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên kỳ đánh giá</th>
              <th>Năm</th>
              <th>Thời gian vai trò</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {evaluates.map((evaluate, index) => (
              <tr key={evaluate.id} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td>{evaluate.id}</td>
                <td>{evaluate.name}</td>
                <td>{evaluate.year}</td>
                <td>{renderTimeRoles(evaluate.timeEvaluateRoles)}</td>
                <td>
                  <button
                    className={styles.menuButton}
                    onClick={() => handleRoleSetup(evaluate)}
                  >
                    <FaCog className={styles.buttonIcon} /> Thiết lập vai trò
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showRolesModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <FaUsers className={styles.titleIcon} /> Thiết lập vai trò cho kỳ đánh giá: {selectedEvaluate?.name}
              </h3>
              <button className={styles.closeButton} onClick={() => setShowRolesModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.tableWrapperFixedHeight}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên vai trò</th>
                      <th>Thời gian bắt đầu</th>
                      <th>Thời gian kết thúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role, idx) => (
                      <tr key={role.id} className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                        <td>{role.id}</td>
                        <td>{role.name}</td>
                        <td>
                          <input
                            type="date"
                            value={timeSettings[role.id]?.startDay || ''}
                            onChange={(e) => handleTimeChange(role.id, 'startDay', e.target.value)}
                            className={styles.formControl}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={timeSettings[role.id]?.endDay || ''}
                            onChange={(e) => handleTimeChange(role.id, 'endDay', e.target.value)}
                            className={styles.formControl}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowRolesModal(false)}>
                <FaTimes className={styles.buttonIcon} /> Đóng
              </button>
              <button className={styles.saveBtn} onClick={handleSaveTimeSettings}>
                <FaSave className={styles.buttonIcon} /> Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeEvaluateRoleTab;
