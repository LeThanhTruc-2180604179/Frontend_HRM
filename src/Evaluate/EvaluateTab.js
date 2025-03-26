import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './EvaluateTab.module.css'; // Import CSS module

const API_BASE_URL = 'http://localhost:8080/api/evaluate';
const QUESTION_SET_API_URL = 'http://localhost:8080/api/questionSet/list';
const USER_EVALUATE_API_URL = 'http://localhost:8080/api/userEvaluate';
const USER_API_URL = 'http://localhost:8080/api/user/list';
const TIME_EVALUATE_ROLE_API_URL = 'http://localhost:8080/api/timeEvaluateRole';

const EvaluateTab = () => {
  const [evaluates, setEvaluates] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const [users, setUsers] = useState([]);
  const [userScores, setUserScores] = useState([]);
  const [filteredUserScores, setFilteredUserScores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({ id: '', name: '', year: '', questionSet: null });
  const [currentEvaluateId, setCurrentEvaluateId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [managerAnswers, setManagerAnswers] = useState({});
  const [viewMode, setViewMode] = useState('form');
  const [selectedEvaluateId, setSelectedEvaluateId] = useState(null);
  const [managerOverdue, setManagerOverdue] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (evaluateId) => {
    setActiveDropdown(activeDropdown === evaluateId ? null : evaluateId);
  };

  const fetchEvaluates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/list`);
      const evaluatesData = response.data;

      const timeRolesResponse = await axios.get(`${TIME_EVALUATE_ROLE_API_URL}/list`);
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
    } catch (error) {
      console.error('Error fetching evaluates:', error);
    }
  };

  const fetchQuestionSets = async () => {
    try {
      const response = await axios.get(QUESTION_SET_API_URL);
      setQuestionSets(response.data);
    } catch (error) {
      console.error('Error fetching question sets:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(USER_API_URL);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserEvaluations = async (evaluateId) => {
    try {
      const response = await axios.get(`${USER_EVALUATE_API_URL}/allUserEvaluationsByEvaluateId`, {
        params: { evaluateId },
      });
      const data = response.data;

      const userScoresData = await Promise.all(
        data.map(async (userEvaluate) => {
          const userId = userEvaluate.userId;
          const userInfo = users.find((user) => user.id === userId) || { name: 'Unknown' };
          const userScore = await fetchScore(userId, evaluateId, 'user');
          const managerScore = await fetchScore(userId, evaluateId, 'manager');

          let totalScore = null;
          let classification = 'Chưa chấm';

          if (managerScore && managerScore > 0) {
            totalScore = managerScore;
            if (managerScore > 80) {
              classification = 'Đạt';
            } else if (managerScore >= 50) {
              classification = 'Khá';
            } else {
              classification = 'Không đạt';
            }
          }

          return {
            userId,
            userName: userInfo.name,
            userScore,
            managerScore: managerScore || 0,
            totalScore,
            classification,
          };
        })
      );

      setUserScores(userScoresData);
      setFilteredUserScores(userScoresData);
      setViewMode('viewUsers');

      const evaluate = evaluates.find(e => e.id === evaluateId);
      if (evaluate) {
        const managerTime = evaluate.timeEvaluateRoles.find(tr => tr.role.name.toUpperCase() === 'MANAGER');
        if (managerTime && managerTime.endDay) {
          const today = new Date();
          const endDate = new Date(managerTime.endDay);
          const isOverdue = today.setHours(0,0,0,0) > endDate.setHours(0,0,0,0);
          setManagerOverdue(isOverdue);
        } else {
          setManagerOverdue(false);
        }
      } else {
        setManagerOverdue(false);
      }

    } catch (error) {
      console.error('Error fetching user evaluations:', error);
    }
  };

  const fetchScore = async (userId, evaluateId, role) => {
    let url = '';
    switch (role) {
      case 'user':
        url = `${USER_EVALUATE_API_URL}/calculateTotalScore`;
        break;
      case 'manager':
        url = `${USER_EVALUATE_API_URL}/calculateTotalScoreManager`;
        break;
      default:
        break;
    }
    const response = await axios.get(url, { params: { userId, evaluateId } });
    return response.data;
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.year || !formData.questionSet) {
        alert('Vui lòng điền đầy đủ thông tin.');
        return;
      }
      if (formData.id) {
        await axios.put(`${API_BASE_URL}/update`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/add`, formData);
      }
      setFormData({ id: '', name: '', year: '', questionSet: null });
      await fetchEvaluates();
      setViewMode('form');
      setSelectedEvaluateId(null);
    } catch (error) {
      console.error('Error saving evaluate:', error);
    }
  };

  const handleViewUsers = async (evaluateId) => {
    setSelectedEvaluateId(evaluateId);
    setCurrentEvaluateId(evaluateId);
    await fetchUserEvaluations(evaluateId);
  };

  const handleManagerEvaluate = async (userId) => {
    setSelectedUserId(userId);
    await fetchQuestionsByEvaluateId(currentEvaluateId);
    setManagerAnswers({});
    setViewMode('managerEvaluate');
  };

  const fetchQuestionsByEvaluateId = async (evaluateId) => {
    try {
      const response = await axios.get(`${USER_EVALUATE_API_URL}/questions`, {
        params: { evaluateId },
      });
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleManagerEvaluateSubmit = async () => {
    try {
      const evaluateData = questions.map((question) => ({
        user: { id: selectedUserId },
        question: { id: question.id },
        evaluate: { id: currentEvaluateId },
        scoreManager: managerAnswers[question.id] ? question.core : 0,
      }));

      await axios.put(`${USER_EVALUATE_API_URL}/updateManagerScores`, evaluateData);
      alert('Đánh giá của manager đã được cập nhật.');
      await fetchUserEvaluations(currentEvaluateId);
      setSelectedUserId(null);
      setManagerAnswers({});
      setQuestions([]);
      setViewMode('viewUsers');
    } catch (error) {
      console.error('Error submitting manager evaluation:', error);
    }
  };

  const handleCancel = () => {
    if (viewMode === 'managerEvaluate') {
      setViewMode('viewUsers');
    } else if (viewMode === 'viewUsers') {
      setSelectedEvaluateId(null);
      setViewMode('form');
      setFormData({ id: '', name: '', year: '', questionSet: null });
      setSelectedUserId(null);
      setSearchTerm('');
    } else {
      setSelectedEvaluateId(null);
      setViewMode('form');
      setFormData({ id: '', name: '', year: '', questionSet: null });
      setSelectedUserId(null);
      setSearchTerm('');
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterUserScores(filterOption, term);
  };

  const handleFilterChange = (e) => {
    const option = e.target.value;
    setFilterOption(option);
    filterUserScores(option, searchTerm);
  };

  const filterUserScores = (option, term) => {
    let filtered = userScores;

    if (term) {
      filtered = filtered.filter(
        (userScore) =>
          String(userScore.userId).includes(term) ||
          userScore.userName.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (option !== 'all') {
      filtered = filtered.filter((userScore) => userScore.classification === option);
    }

    setFilteredUserScores(filtered);
  };

  useEffect(() => {
    fetchEvaluates();
    fetchQuestionSets();
    fetchUsers();
  }, []);

  const renderTimeRoles = (timeRoles) => {
    if (timeRoles.length === 0) return 'Chưa thiết lập';
    const managerTime = timeRoles.find((tr) => tr.role.name.toUpperCase() === 'MANAGER');
    if (!managerTime) return 'Chưa thiết lập';
    return (
      <span>
        {managerTime.startDay
          ? new Date(managerTime.startDay).toLocaleDateString()
          : 'N/A'}{' '}
        -{' '}
        {managerTime.endDay
          ? new Date(managerTime.endDay).toLocaleDateString()
          : 'N/A'}
      </span>
    );
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.leftColumn}>
        {viewMode === 'form' && (
          <>
            <h2 className={styles.leftTitle}>Thêm kỳ đánh giá</h2>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tên</label>
              <input
                type="text"
                className={styles.formControl}
                placeholder="Nhập tên kỳ đánh giá"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Năm</label>
              <input
                type="text"
                className={styles.formControl}
                placeholder="Năm"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Chọn bộ câu hỏi</label>
              <select
                className={styles.formControl}
                value={formData.questionSet?.id || ''}
                onChange={(e) => {
                  const selectedQuestionSet = questionSets.find(
                    (set) => String(set.id) === e.target.value
                  );
                  setFormData({
                    ...formData,
                    questionSet: selectedQuestionSet || null,
                  });
                }}
              >
                <option value="">Chọn bộ câu hỏi</option>
                {questionSets.length === 0 ? (
                  <option disabled>Không có bộ câu hỏi nào</option>
                ) : (
                  questionSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            {/* Hình minh họa riêng cho chế độ form */}
            <div className={styles.illustrationWrapper}>
              <img 
                className={styles.illustrationImage} 
                src="https://img.upanh.tv/2024/12/11/add.gif" 
                alt="Form Illustration" 
              />
            </div>
          </>
        )}

        {viewMode === 'viewUsers' && (
          <>
            <h2 className={styles.leftTitle}>Đánh giá nhân viên</h2>
            {/* Hình minh họa riêng cho chế độ xem danh sách người tham gia */}
            <div className={styles.illustrationWrapper}>
              <img 
                className={styles.illustrationImage} 
                src="https://img.upanh.tv/2024/12/11/add.gif" 
                alt="View Users Illustration" 
              />
            </div>
          </>
        )}

        {viewMode === 'managerEvaluate' && (
          <>
            <h2 className={styles.leftTitle}>Đánh giá nhân viên</h2>
            {/* Hình minh họa riêng cho chế độ manager đánh giá người dùng */}
            <div className={styles.illustrationWrapper}>
              <img 
                className={styles.illustrationImage} 
                src="https://img.upanh.tv/2024/12/11/add.gif" 
                alt="Manager Evaluate Illustration" 
              />
            </div>
          </>
        )}
      </div>

      <div className={styles.rightColumn}>
        {viewMode === 'form' && (
          <>
            <h2 className={styles.rightTitle}>Danh sách kỳ đánh giá</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên kỳ đánh giá</th>
                    <th>Bộ câu hỏi</th>
                    <th>Năm</th>
                    <th>Hạn đánh giá</th>
                    <th>Menu</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluates.map((evaluate) => (
                    <tr
                      key={evaluate.id}
                      style={{
                        filter:
                          selectedEvaluateId && evaluate.id !== selectedEvaluateId
                            ? 'blur(3px)'
                            : 'none',
                        opacity:
                          selectedEvaluateId && evaluate.id !== selectedEvaluateId ? 0.6 : 1,
                      }}
                    >
                      <td>{evaluate.id}</td>
                      <td>{evaluate.name}</td>
                      <td>{evaluate.questionSet?.name || 'Chưa liên kết'}</td>
                      <td>{evaluate.year || 'Chưa có năm'}</td>
                      <td>{renderTimeRoles(evaluate.timeEvaluateRoles)}</td>
                      <td style={{ position: 'relative' }}>
                        <button
                          className={styles.menuButton}
                          onClick={() => toggleDropdown(evaluate.id)}
                        >
                          ...
                        </button>
                        {activeDropdown === evaluate.id && (
                          <ul className={styles.dropdownMenu}>
                            <li
                              onClick={() => {
                                setFormData(evaluate);
                                setSelectedEvaluateId(evaluate.id);
                                setViewMode('form');
                                setActiveDropdown(null);
                              }}
                            >
                              Sửa
                            </li>
                            <li
                              onClick={() => {
                                handleViewUsers(evaluate.id);
                                setActiveDropdown(null);
                              }}
                            >
                              Xem danh sách
                            </li>
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.actionButtonsRight}>
              <button className={styles.saveBtn} onClick={handleSave}>Lưu</button>
              <button className={styles.cancelBtn} onClick={handleCancel}>Hủy</button>
            </div>
          </>
        )}

        {viewMode === 'viewUsers' && (
          <>
            <h2 className={styles.rightTitle}>
              Danh sách người tham gia -{' '}
              {evaluates.find((e) => e.id === currentEvaluateId)?.name}{' '}
              (
              {evaluates.find((e) => e.id === currentEvaluateId)?.questionSet?.name ||
                'Chưa có bộ câu hỏi'}
              )
            </h2>
            <div className={styles.filterRow}>
              <input
                type="text"
                className={`${styles.formControl} ${styles.searchInput}`}
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={handleSearch}
              />
              <select
                className={`${styles.formControl} ${styles.filterSelect}`}
                value={filterOption}
                onChange={handleFilterChange}
              >
                <option value="all">Tất cả</option>
                <option value="Đạt">Đạt</option>
                <option value="Khá">Khá</option>
                <option value="Không đạt">Không đạt</option>
                <option value="Chưa chấm">Chưa chấm</option>
              </select>
              <span className={styles.countLabel}>Số lượng: {filteredUserScores.length}</span>
            </div>
            <div className={styles.tableWrapperFixedHeight}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Đánh giá</th>
                    <th>Điểm Manager</th>
                    <th>Tổng Kết</th>
                    <th>Phân Loại</th>
                    <th>Menu</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUserScores.map((userScore) => (
                    <tr key={userScore.userId}>
                      <td>{userScore.userId}</td>
                      <td>{userScore.userName}</td>
                      <td>{userScore.userScore}</td>
                      <td>{userScore.managerScore}</td>
                      <td>{userScore.totalScore !== null ? userScore.totalScore : '_'}</td>
                      <td>
                        <span
                          style={{
                            color:
                              userScore.classification === 'Đạt'
                                ? 'green'
                                : userScore.classification === 'Khá'
                                ? 'orange'
                                : userScore.classification === 'Không đạt'
                                ? 'red'
                                : 'black',
                          }}
                        >
                          {userScore.classification}
                        </span>
                      </td>
                      <td>
                        {managerOverdue ? (
                          <span style={{ color: 'red', fontWeight: 'bold' }}>Quá hạn</span>
                        ) : (
                          <button
                            className={styles.menuButton}
                            onClick={() => handleManagerEvaluate(userScore.userId)}
                          >
                            Đánh giá
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.actionButtonsRight}>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                Hủy
              </button>
            </div>
          </>
        )}

        {viewMode === 'managerEvaluate' && (
          <>
            <h2 className={styles.rightTitle}>Đánh giá của Manager cho người dùng {selectedUserId}</h2>
            <div className={styles.tableWrapperFixedHeight}>
              {questions.map((question, index) => (
                <div key={question.id} className={styles.questionBlock}>
                  <label className={styles.formLabel}>
                    <strong>
                      {index + 1}. {question.question}
                    </strong>
                  </label>
                  <div className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      id={`question-${question.id}`}
                      checked={managerAnswers[question.id] || false}
                      onChange={(e) =>
                        setManagerAnswers({
                          ...managerAnswers,
                          [question.id]: e.target.checked,
                        })
                      }
                    />
                    <label
                      className={styles.checkboxLabel}
                      htmlFor={`question-${question.id}`}
                    >
                      Đánh dấu ({question.core} điểm)
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.actionButtonsRight}>
              <button className={styles.saveBtn} onClick={handleManagerEvaluateSubmit}>
                Lưu Đánh Giá
              </button>
              <button className={styles.cancelBtn} onClick={() => setViewMode('viewUsers')}>
                Hủy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EvaluateTab;
