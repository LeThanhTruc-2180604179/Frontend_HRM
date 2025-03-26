import React, { useEffect, useState } from "react";
import styles from "./ModalUser.module.css";

const EmployeeDetailsModal = ({ isOpen, onClose, nhanVien }) => {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (isOpen && nhanVien) {
      fetchUserDepartments(nhanVien.id);
    }
  }, [isOpen, nhanVien]);

  const fetchUserDepartments = (userId) => {
    fetch(`http://localhost:8080/api/department/listDepartmentUser?id=${userId}`)
      .then((response) => response.json())
      .then((data) => setDepartments(data))
      .catch((error) => console.error("Lỗi:", error));
  };

  if (!isOpen || !nhanVien) return null;

  const birthDay = nhanVien.birthDay
    ? new Date(nhanVien.birthDay).toLocaleDateString()
    : "Không có";

  return (
    <div className={styles.modal} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>

        <div className={styles.modalLayout}>
          <div className={styles.leftColumn}>
            <img
              src={nhanVien.avatar || "https://via.placeholder.com/300"}
              alt="Avatar"
              className={styles.avatar}
            />
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.headerSection}>
              <h2 className={styles.employeeName}>{nhanVien.name}</h2>
              <p className={styles.position}>{nhanVien.positionName || "Không có chức vụ"}</p>
            </div>

            <div className={styles.infoSection}>
              <div className={styles.infoBlock}>
                <h3>Thông tin cá nhân</h3>
                <p>Quê quán: {nhanVien.homeTown || "Không có"}</p>
                <p>Ngày sinh: {birthDay}</p>
                <p>Giới tính: {nhanVien.sex || "Không rõ"}</p>
              </div>
              <div className={styles.infoBlock}>
                <h3>Thông tin liên hệ</h3>
                <p>Email: {nhanVien.email}</p>
                <p>Số điện thoại: {nhanVien.phoneNumber || "Không có"}</p>
                <p>Địa chỉ: {nhanVien.address || "Không có"}</p>
              </div>
            </div>

            <div className={styles.jobSection}>
              <h3>Công việc</h3>
              <div className={styles.jobDetails}>
                <div className={styles.jobInfoColumn}>
                  <p>Phòng ban hiện tại:</p>
                  {departments.length > 0 ? (
                    <ul className={styles.departmentList}>
                      {departments.map((department) => (
                        <li key={department.id}>
                          <span className={styles.departmentDot}></span>
                          {department.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Không có</p>
                  )}
                </div>
                <div className={styles.jobExtraInfo}>
                  <p>Quốc tịch: {nhanVien.nationality || "Không có"}</p>
                  <p>
                    Tình trạng:{" "}
                    <span className={nhanVien.isDelete ? styles.statusDeleted : styles.statusActive}>
                      {nhanVien.isDelete ? "Đã nghỉ" : "Đang làm"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
