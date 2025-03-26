import React, { useState, useEffect } from 'react';
import styles from './modalDepartment.module.css'; // Import CSS module
const DepartmentEdit = ({ id, onClose, onRefresh }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    fetch(`http://localhost:8080/api/department/${id}`)
      .then((response) => response.json())
      .then((data) => setName(data.name))
      .catch((error) => console.error('Lỗi:', error));
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch('http://localhost:8080/api/department/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    })
      .then((response) => {
        if (response.ok) {
          onClose();  // Đóng modal
          onRefresh(); // Cập nhật lại danh sách phòng ban
        } else {
          console.error('Cập nhật phòng ban thất bại');
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
        <h2 className={styles["modal-title"]}>Cập Nhật Phòng Ban</h2>

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
          
          {/* Nút cập nhật */}
          <button type="submit" className={styles["modal-button"]}>Cập nhật</button>
        </form>
      </div>
    </div>
  );
};

export default DepartmentEdit;
