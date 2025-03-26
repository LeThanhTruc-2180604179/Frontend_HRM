import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './QuestionTab.module.css';

const API_BASE_URL = 'http://localhost:8080/api/questions';

const QuestionTab = () => {
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({ id: '', question: '', core: '' });
  const [notification, setNotification] = useState(''); // Thông báo
  const [error, setError] = useState(''); // Lỗi
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/list`);
      setQuestions(response.data);
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const validateForm = () => {
    if (!formData.question.trim()) {
      showError('Nội dung câu hỏi không được để trống.');
      return false;
    }
    if (!formData.core || isNaN(formData.core) || formData.core < 0) {
      showError('Số điểm phải là một số hợp lệ và lớn hơn hoặc bằng 0.');
      return false;
    }
    setError('');
    return true;
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2000);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (formData.id) {
        await axios.put(`${API_BASE_URL}/update`, {
          id: formData.id,
          question: formData.question,
          core: parseInt(formData.core, 10),
        });
        showNotification('Chỉnh sửa thành công!');
      } else {
        await axios.post(`${API_BASE_URL}/add`, {
          question: formData.question,
          core: parseInt(formData.core, 10),
        });
        showNotification('Thêm câu hỏi thành công!');
      }
      setFormData({ id: '', question: '', core: '' });
      setSelectedQuestionId(null);
      fetchQuestions();
    } catch (err) {
      showError('Có lỗi xảy ra khi lưu dữ liệu.');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setFormData({ id: '', question: '', core: '' });
    setSelectedQuestionId(null);
    setError('');
    setNotification('');
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const isUpdateMode = !!formData.id; // true nếu đang cập nhật, false nếu thêm mới

  return (
    <div className={styles.mainContainer}>
      {/* Cột trái: Danh sách câu hỏi */}
      <div className={styles.leftColumn}>
        <h2 className={styles.leftTitle}>Danh sách câu hỏi</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Nội dung</th>
                <th>Số điểm</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question, index) => (
                <tr
                  key={question.id}
                  className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                  style={{
                    filter: selectedQuestionId && question.id !== selectedQuestionId ? 'blur(3px)' : 'none',
                    transition: 'filter 0.3s ease',
                    backgroundColor: question.id === selectedQuestionId ? '#e0f0ff' : 'transparent',
                  }}
                >
                  <td>{index + 1}</td>
                  <td>{question.question}</td>
                  <td>{question.core}</td>
                  <td>
                    <button
                      className={styles.menuButton}
                      onClick={() => {
                        setSelectedQuestionId(question.id);
                        setFormData(question);
                      }}
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cột phải: Form thêm/cập nhật câu hỏi */}
      <div className={styles.rightColumn}>
        <h2 className={styles.rightTitle}>{isUpdateMode ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}</h2>

        {/* Thông báo */}
        {notification && <div className={styles.alertSuccess}>{notification}</div>}

        {/* Lỗi */}
        {error && <div className={styles.alertError}>{error}</div>}

        <label className={styles.formLabel}>Nội dung câu hỏi</label>
        <input
          type="text"
          className={styles.formControl}
          placeholder="Nhập nội dung câu hỏi"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
        />

        <label className={styles.formLabel}>Số điểm</label>
        <input
          type="number"
          className={styles.formControl}
          placeholder="Nhập số điểm"
          value={formData.core}
          onChange={(e) => setFormData({ ...formData, core: e.target.value })}
        />

        <div className={styles.actionButtonsRight}>
          <button className={styles.saveBtn} onClick={handleSave}>Lưu</button>
          {isUpdateMode && (
            <button className={styles.cancelBtn} onClick={handleCancel}>Hủy</button>
          )}
        </div>

        {/* Khung ảnh riêng biệt */}
        <div className={styles.illustrationWrapper}>
          {isUpdateMode ? (
            <img
              className={styles.illustrationImage}
              src="https://img.upanh.tv/2024/12/12/update.gif"
              alt="Update Illustration"
            />
          ) : (
            <img
              className={styles.illustrationImage}
              src="https://img.upanh.tv/2024/12/11/add.gif"
              alt="Add Illustration"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionTab;
