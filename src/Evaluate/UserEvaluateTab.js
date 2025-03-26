import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaClipboardList } from 'react-icons/fa';
import { IoSearch } from 'react-icons/io5';
import { MdFilterList } from 'react-icons/md';
import styles from './UserEvaluate.module.css';

const API_BASE_URL = 'http://localhost:8080/api';

const UserEvaluationList = () => {
  const [userId, setUserId] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');

  const currentRole = localStorage.getItem('role');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      setError('Không tìm thấy user ID. Vui lòng đăng nhập.');
      return;
    }
    setUserId(storedUserId);
  }, []);

  const isOverdue = (endDay) => {
    if (!endDay) return false;
    const today = new Date();
    const endDate = new Date(endDay);
    return today.setHours(0, 0, 0, 0) > endDate.setHours(0, 0, 0, 0);
  };

  const classificationPriority = {
    'Chưa đánh giá': 1,
    'Chưa tổng kết': 2,
    'Đạt': 3,
    'Khá': 4,
    'Không đạt': 5,
  };

  useEffect(() => {
    if (!userId) return;

    const fetchEvaluations = async () => {
      try {
        setLoading(true);

        const allEvaluatesResponse = await axios.get(`${API_BASE_URL}/evaluate/list`);
        const allEvaluates = allEvaluatesResponse.data;

        const userEvaluationsResponse = await axios.get(
          `${API_BASE_URL}/userEvaluate/listUserEvaluates`,
          { params: { userId } }
        );
        const userEvaluations = userEvaluationsResponse.data;

        const userEvaluationMap = {};
        userEvaluations.forEach((evaluation) => {
          userEvaluationMap[evaluation.evaluate.id] = evaluation;
        });

        const timeRolesResponse = await axios.get(`${API_BASE_URL}/timeEvaluateRole/list`);
        const timeRolesData = timeRolesResponse.data;

        const timeRoleMap = {};
        timeRolesData.forEach((timeRole) => {
          if (!timeRoleMap[timeRole.evaluate.id]) {
            timeRoleMap[timeRole.evaluate.id] = [];
          }
          timeRoleMap[timeRole.evaluate.id].push(timeRole);
        });

        const combinedEvaluations = await Promise.all(
          allEvaluates.map(async (evaluation) => {
            const [userScoreResponse, managerScoreResponse] = await Promise.all([
              axios.get(`${API_BASE_URL}/userEvaluate/calculateTotalScore`, {
                params: { userId, evaluateId: evaluation.id },
              }),
              axios.get(`${API_BASE_URL}/userEvaluate/calculateTotalScoreManager`, {
                params: { userId, evaluateId: evaluation.id },
              }),
            ]);

            const userScore = userScoreResponse.data;
            const managerScore = managerScoreResponse.data;

            let totalScore = null;
            let classification = 'Chưa đánh giá';

            if (userScore > 0) {
              if (managerScore > 0) {
                totalScore = managerScore;
                if (totalScore > 80) {
                  classification = 'Đạt';
                } else if (totalScore >= 50) {
                  classification = 'Khá';
                } else {
                  classification = 'Không đạt';
                }
              } else {
                classification = 'Chưa tổng kết';
              }
            }

            const timeRoles = timeRoleMap[evaluation.id] || [];
            const anyRoleTimeRole = timeRoles.find((tr) => tr.endDay);
            const overdue = anyRoleTimeRole ? isOverdue(anyRoleTimeRole.endDay) : false;

            return {
              evaluateId: evaluation.id,
              evaluateName: evaluation.name,
              totalScoreUser: userScore || 0,
              totalScoreManager: managerScore || 0,
              totalScore: totalScore,
              classification: classification,
              overdue: overdue,
            };
          })
        );

        combinedEvaluations.sort((a, b) => {
          return classificationPriority[a.classification] - classificationPriority[b.classification];
        });

        setEvaluations(combinedEvaluations);
      } catch (err) {
        console.error('Error fetching evaluations:', err);
        setError('Không thể lấy danh sách đánh giá.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [userId]);

  const fetchQuestions = async (evaluationId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/userEvaluate/questions`, {
        params: { evaluateId: evaluationId },
      });
      setQuestions(response.data);

      const userAnswersResponse = await axios.get(
        `${API_BASE_URL}/userEvaluate/getUserAnswers`,
        { params: { userId, evaluateId: evaluationId } }
      );

      const userAnswers = userAnswersResponse.data.reduce((acc, answer) => {
        acc[answer.question.id] = answer.score > 0;
        return acc;
      }, {});

      setSelectedAnswers(userAnswers);
      setSelectedEvaluationId(evaluationId);
    } catch (err) {
      console.error('Error fetching questions or answers:', err);
      setError('Không thể lấy câu hỏi hoặc câu trả lời.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswers = async () => {
    try {
      const answers = Object.entries(selectedAnswers).map(([questionId, selected]) => {
        const question = questions.find((q) => q.id === Number(questionId));
        const score = selected ? question.core : 0;
        return {
          user: { id: userId },
          question: { id: Number(questionId) },
          evaluate: { id: selectedEvaluationId },
          score: score,
        };
      });

      await axios.post(`${API_BASE_URL}/userEvaluate/evaluate`, answers);
      alert('Đánh giá của bạn đã được gửi thành công!');
      setSelectedEvaluationId(null);
      setQuestions([]);
      setSelectedAnswers({});

      setEvaluations((prevEvaluations) =>
        prevEvaluations.map((evaluation) =>
          evaluation.evaluateId === selectedEvaluationId
            ? {
                ...evaluation,
                totalScoreUser: answers.reduce((sum, ans) => sum + ans.score, 0),
                classification:
                  answers.reduce((sum, ans) => sum + ans.score, 0) > 0
                    ? (evaluation.totalScoreManager > 0
                        ? classificationScore(evaluation.totalScoreManager)
                        : 'Chưa tổng kết')
                    : 'Chưa đánh giá',
              }
            : evaluation
        )
      );
    } catch (err) {
      console.error('Error submitting answers:', err);
      alert('Không thể gửi đánh giá.');
    }
  };

  const classificationScore = (score) => {
    if (score > 80) return 'Đạt';
    if (score >= 50) return 'Khá';
    return 'Không đạt';
  };

  const renderScore = (score) => {
    return score === null || score === 0 ? '_' : score;
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!evaluation.evaluateName.toLowerCase().includes(term)) {
        return false;
      }
    }
    if (filterOption !== 'all') {
      if (evaluation.classification !== filterOption) {
        return false;
      }
    }
    return true;
  });

  if (error)
    return (
      <div className={styles.mainContainer}>
        <div className={styles.alertError}>{error}</div>
      </div>
    );

  if (loading)
    return (
      <div className={styles.mainContainer}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );

  const currentEvaluation = evaluations.find((e) => e.evaluateId === selectedEvaluationId);

  return (
    <div className={styles.mainContainer}>
      {!selectedEvaluationId ? (
        // Phần hiển thị cho nhân viên
        <div className={styles.employeeViewContainer}>
          {/* Header/Banner */}
          <div className={styles.headerBanner}>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/201/201818.png"
              alt="Employee Evaluate Icon"
              className={styles.bannerIcon}
            />
            <div className={styles.bannerText}>
              <h2>Chào mừng bạn đến với trang đánh giá nhân viên</h2>
              <p>Đây là nơi bạn có thể tự đánh giá và cải thiện năng lực của mình. Hãy khám phá các kỳ đánh giá và bắt đầu nâng cao hiệu suất làm việc ngay hôm nay!</p>
            </div>
          </div>

          <div className={styles.listContainer}>
            <div className={styles.listHeader}>
              <FaClipboardList className={styles.iconTitle} />
              <h5 className={styles.listTitle}>Danh sách kỳ đánh giá</h5>
            </div>
            <div className={styles.filterRow}>
              <div className={styles.searchBox}>
                <IoSearch className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.formControl}
                  placeholder="Tìm kiếm kỳ đánh giá..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.filterBox}>
                <MdFilterList className={styles.filterIcon} />
                <select
                  className={styles.formControl}
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="Chưa đánh giá">Chưa đánh giá</option>
                  <option value="Chưa tổng kết">Chưa tổng kết</option>
                  <option value="Đạt">Đạt</option>
                  <option value="Khá">Khá</option>
                  <option value="Không đạt">Không đạt</option>
                </select>
              </div>
              <span className={styles.countLabel}>Số lượng: {filteredEvaluations.length}</span>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Kỳ đánh giá</th>
                    <th>Điểm của bạn</th>
                    <th>Điểm Manager</th>
                    <th>Tổng Kết</th>
                    <th>Phân Loại</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvaluations.map((evaluation, index) => (
                    <tr key={evaluation.evaluateId} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td>{index + 1}</td>
                      <td>{evaluation.evaluateName}</td>
                      <td>{renderScore(evaluation.totalScoreUser)}</td>
                      <td>{renderScore(evaluation.totalScoreManager)}</td>
                      <td>
                        {evaluation.totalScore !== null
                          ? renderScore(evaluation.totalScore)
                          : '_'}
                      </td>
                      <td>
                        <span
                          style={{
                            color:
                              evaluation.classification === 'Đạt'
                                ? 'green'
                                : evaluation.classification === 'Khá'
                                ? 'orange'
                                : evaluation.classification === 'Không đạt'
                                ? 'red'
                                : evaluation.classification === 'Chưa tổng kết'
                                ? 'blue'
                                : 'black',
                          }}
                        >
                          {evaluation.classification}
                        </span>
                      </td>
                      <td>
                        <button
                          className={evaluation.overdue ? styles.disabledButton : styles.actionButton}
                          disabled={evaluation.overdue}
                          onClick={() =>
                            !evaluation.overdue && fetchQuestions(evaluation.evaluateId)
                          }
                          style={{ cursor: evaluation.overdue ? 'not-allowed' : 'pointer' }}
                        >
                          {evaluation.overdue ? 'Hết hạn' : 'Tiến hành đánh giá'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // Form câu hỏi
        <div className={styles.questionContainer}>
          <div className={styles.questionLeftPanel}>
            <div className={styles.questionLeftContent}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/201/201818.png"
                alt="Evaluate Icon"
                className={styles.questionLeftImage}
              />
              <h3 className={styles.questionLeftTitle}>
                {currentEvaluation ? currentEvaluation.evaluateName : 'Tên kỳ đánh giá'}
              </h3>
              <p className={styles.questionLeftDesc}>
                Hãy trả lời các câu hỏi để tự đánh giá năng lực làm việc hiện tại của bạn.
              </p>
            </div>
          </div>
          <div className={styles.questionRightPanel}>
            <h4 className={styles.questionRightTitle}>Câu hỏi trong kỳ đánh giá</h4>
            <div className={styles.questionList}>
              <form className={styles.questionForm}>
                {questions.map((question, index) => (
                  <div key={question.id} className={styles.questionItem}>
                    <div className={styles.questionText}>
                      <span className={styles.questionIndex}>Câu {index + 1}.</span> {question.question}
                    </div>
                    <div className={styles.questionOption}>
                      <input
                        type="checkbox"
                        id={`question-${question.id}`}
                        checked={!!selectedAnswers[question.id]}
                        onChange={(e) =>
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [question.id]: e.target.checked,
                          }))
                        }
                      />
                      <label htmlFor={`question-${question.id}`}>
                        Chọn ({question.core} điểm)
                      </label>
                    </div>
                  </div>
                ))}
              </form>
            </div>
            <div className={styles.questionFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setSelectedEvaluationId(null)}
              >
                Hủy
              </button>
              <button className={styles.submitQuestionButton} onClick={handleSubmitAnswers}>
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserEvaluationList;
