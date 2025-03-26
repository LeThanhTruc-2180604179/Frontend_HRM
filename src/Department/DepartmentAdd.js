import React, { useState } from 'react';
import styles from './modalDepartment.module.css'; // Import CSS module

const DepartmentAdd = ({ onClose, onRefresh }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch('http://localhost:8080/api/department/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
      .then((response) => {
        if (response.ok) {
          onClose();  // Đóng modal
          onRefresh(); // Cập nhật lại danh sách phòng ban
        } else {
          console.error('Thêm phòng ban thất bại');
        }
      })
      .catch((error) => console.error('Lỗi:', error));
  };

  return (
    <div className={styles.modal}>
      <div className={styles["modal-content"]}>
        {/* Nút đóng modal */}
        <button onClick={onClose} className={styles["close-button"]}>&times;</button>
        
        {/* Biểu tượng hoặc icon phù hợp */}
        <div className={styles["modal-icon"]}>🏢</div> {/* Icon biểu tượng tòa nhà đại diện cho phòng ban */}

        {/* Tiêu đề modal */}
        <h2 className={styles["modal-title"]}>Thêm Phòng Ban</h2>

        <form onSubmit={handleSubmit}>
          {/* Ô nhập tên phòng ban */}
          <input
            type="text"
            placeholder="Nhập tên phòng ban"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles["modal-input"]}
          />
          
          {/* Nút thêm */}
          <button type="submit" className={styles["modal-button"]}>Thêm mới</button>
        </form>
      </div>
    </div>
  );
};

export default DepartmentAdd;
