import React, { useState } from 'react';
import styles from './AddUser.module.css';

const AddUserToDepartment = ({ departmentId, onClose, onRefresh }) => {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  const handleAddUser = async () => {
    if (!userId) {
      setError("Vui lòng nhập ID nhân viên.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/department/addUser?id=${userId}&department=${departmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        onRefresh(); // Làm mới danh sách phòng ban sau khi thêm thành công
        onClose(); // Đóng modal
      } else {
        setError("Thêm nhân viên thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (error) {
      console.error('Lỗi:', error);
      setError("Có lỗi xảy ra khi thêm nhân viên.");
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        {/* Tiêu đề Modal */}
        <div className={styles.modalHeader}>
          <h2>Thêm Nhân Viên Vào Phòng Ban</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        {/* Form nhập ID nhân viên */}
        <div className={styles.formGroup}>
          <label htmlFor="userId" className={styles.formLabel}>
            Nhập ID Nhân Viên
          </label>
          <input
            id="userId"
            type="text"
            placeholder="Nhập ID nhân viên"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setError('');
            }}
            className={styles.formInput}
          />
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>

        {/* Nút thao tác */}
        <div className={styles.buttonGroup}>
          <button onClick={handleAddUser} className={styles.submitButton}>
            Thêm Nhân Viên
          </button>
          <button onClick={onClose} className={styles.cancelButton}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserToDepartment;
