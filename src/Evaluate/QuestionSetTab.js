import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './QuestionSetTab.module.css'; // Import CSS module

const API_BASE_URL = 'http://localhost:8080/api/questionSet';
const QUESTIONS_API_BASE_URL = 'http://localhost:8080/api/questions';

const QuestionSetTab = () => {
  const [questionSets, setQuestionSets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionsInSet, setQuestionsInSet] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedQuestionsToDelete, setSelectedQuestionsToDelete] = useState([]);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [currentQuestionSetId, setCurrentQuestionSetId] = useState(null);
  const [viewMode, setViewMode] = useState('form'); // 'form', 'addQuestions', 'viewQuestions'
  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (questionSetId) => {
    setActiveDropdown(activeDropdown === questionSetId ? null : questionSetId);
  };

  const fetchQuestionSets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/list`);
      setQuestionSets(response.data);
    } catch (error) {
      console.error('Error fetching question sets:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${QUESTIONS_API_BASE_URL}/list`);
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchQuestionsInSet = async (questionSetId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/questions`, { params: { id: questionSetId } });
      setQuestionsInSet(response.data);
      setCurrentQuestionSetId(questionSetId);
      setViewMode('viewQuestions');
      setSelectedQuestionSetId(questionSetId);
    } catch (error) {
      console.error('Error fetching questions in set:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name) {
        alert('Vui lòng điền tên bộ câu hỏi.');
        return;
      }
      if (formData.id) {
        await axios.put(`${API_BASE_URL}/update`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/add`, formData);
      }
      setFormData({ id: '', name: '' });
      fetchQuestionSets();
      setViewMode('form');
      setSelectedQuestionSetId(null);
    } catch (error) {
      console.error('Error saving question set:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/delete`, { params: { id } });
      fetchQuestionSets();
      setSelectedQuestionSetId(null);
    } catch (error) {
      console.error('Error deleting question set:', error);
    }
  };

  const handleAddQuestions = async (questionSetId) => {
    setSelectedQuestionSetId(questionSetId);
    setCurrentQuestionSetId(questionSetId);
    await fetchQuestions();
    setViewMode('addQuestions');
  };

  const handleSaveQuestions = async () => {
    try {
      await axios.post(`${API_BASE_URL}/addQuestions`, selectedQuestions, {
        params: { id: currentQuestionSetId },
      });
      setSelectedQuestions([]);
      setViewMode('form');
      await fetchQuestionsInSet(currentQuestionSetId);
    } catch (error) {
      console.error('Error saving questions:', error);
    }
  };

  const handleDeleteQuestionsFromSet = async () => {
    try {
      for (const questionId of selectedQuestionsToDelete) {
        await axios.delete(`${API_BASE_URL}/deleteQuestion`, {
          params: { questionSetId: currentQuestionSetId, questionId },
        });
      }
      setSelectedQuestionsToDelete([]);
      await fetchQuestionsInSet(currentQuestionSetId);
    } catch (error) {
      console.error('Error deleting questions from set:', error);
    }
  };

  const handleCancel = () => {
    setSelectedQuestionSetId(null);
    setViewMode('form');
    setFormData({ id: '', name: '' });
    setSelectedQuestions([]);
    setSelectedQuestionsToDelete([]);
  };

  useEffect(() => {
    fetchQuestionSets();
  }, []);

  return (
    <div className={styles.mainContainer}>
      {/* Cột trái: Danh sách bộ câu hỏi */}
      <div className={styles.leftColumn}>
        <h2 className={styles.leftTitle}>Danh sách bộ câu hỏi</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Menu</th>
              </tr>
            </thead>
            <tbody>
              {questionSets.map((set, index) => (
                <tr
                  key={set.id}
                  className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                  style={{
                    filter:
                      selectedQuestionSetId && set.id !== selectedQuestionSetId ? 'blur(3px)' : 'none',
                    opacity: selectedQuestionSetId && set.id !== selectedQuestionSetId ? 0.6 : 1,
                    transition: 'filter 0.3s ease, opacity 0.3s ease',
                  }}
                >
                  <td>{set.id}</td>
                  <td>{set.name}</td>
                  <td style={{ position: 'relative' }}>
                    <button
                      className={styles.menuButton}
                      onClick={() => toggleDropdown(set.id)}
                    >
                      ...
                    </button>
                    {activeDropdown === set.id && (
                      <ul className={styles.dropdownMenu}>
                        <li
                          onClick={() => {
                            setFormData(set);
                            setSelectedQuestionSetId(set.id);
                            setViewMode('form');
                            setActiveDropdown(null);
                          }}
                        >
                          Sửa
                        </li>
                        <li
                          onClick={() => {
                            fetchQuestionsInSet(set.id);
                            setActiveDropdown(null);
                          }}
                        >
                          Xem câu hỏi
                        </li>
                        <li
                          onClick={() => {
                            handleAddQuestions(set.id);
                            setActiveDropdown(null);
                          }}
                        >
                          Thêm câu hỏi
                        </li>
                        <li
                          onClick={() => {
                            handleDelete(set.id);
                            setActiveDropdown(null);
                          }}
                        >
                          Xóa
                        </li>
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cột phải: Form và các chế độ khác */}
      <div className={styles.rightColumn}>
        {viewMode === 'form' && (
          <>
            <h2 className={styles.rightTitle}>{formData.id ? 'Cập nhật bộ câu hỏi' : 'Thêm bộ câu hỏi'}</h2>
            <input
              type="text"
              className={styles.formControl}
              placeholder="Tên bộ câu hỏi"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className={styles.actionButtonsRight}>
              <button className={styles.saveBtn} onClick={handleSave}>Lưu</button>
              <button className={styles.cancelBtn} onClick={handleCancel}>Hủy</button>
            </div>
          </>
        )}

        {viewMode === 'addQuestions' && (
          <>
            <h2 className={styles.rightTitle}>Chọn câu hỏi để thêm</h2>
            <div className={styles.tableWrapperFixedHeight}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Chọn</th>
                    <th>ID</th>
                    <th>Nội dung</th>
                    <th>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question, index) => (
                    <tr key={question.id} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() =>
                            setSelectedQuestions((prev) =>
                              prev.includes(question.id)
                                ? prev.filter((id) => id !== question.id)
                                : [...prev, question.id]
                            )
                          }
                        />
                      </td>
                      <td>{question.id}</td>
                      <td>{question.question}</td>
                      <td>{question.core}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.actionButtonsRight}>
              <button className={styles.saveBtn} onClick={handleSaveQuestions}>
                Lưu
              </button>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                Hủy
              </button>
            </div>
          </>
        )}

        {viewMode === 'viewQuestions' && (
          <>
            <h2 className={styles.rightTitle}>Danh sách câu hỏi của bộ câu hỏi</h2>
            <div className={styles.tableWrapperFixedHeight}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Chọn</th>
                    <th>ID</th>
                    <th>Nội dung</th>
                    <th>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsInSet.map((question, index) => (
                    <tr key={question.id} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedQuestionsToDelete.includes(question.id)}
                          onChange={() =>
                            setSelectedQuestionsToDelete((prev) =>
                              prev.includes(question.id)
                                ? prev.filter((id) => id !== question.id)
                                : [...prev, question.id]
                            )
                          }
                        />
                      </td>
                      <td>{question.id}</td>
                      <td>{question.question}</td>
                      <td>{question.core}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.actionButtonsRight}>
              <button className={styles.deleteBtn} onClick={handleDeleteQuestionsFromSet}>
                Xóa câu hỏi
              </button>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionSetTab;
