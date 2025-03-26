import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./ListEmployees.module.css";
import EmployeeDetailsModal from "./EmployeeDetailsModal";

const EmployeeByDepartment = () => {
  const [phongBans, setPhongBans] = useState([]);
  const [nhanViens, setNhanViens] = useState([]);
  const [selectedPhongBan, setSelectedPhongBan] = useState(""); // Lưu phòng ban đã chọn
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNhanVien, setSelectedNhanVien] = useState(null); // Nhân viên được chọn để xem chi tiết
  const [currentPage, setCurrentPage] = useState(1);
  const nhanViensPerPage = 4;

  useEffect(() => {
    // Lấy danh sách phòng ban
    axios
      .get("http://localhost:8080/api/department/listDepartment")
      .then((response) => {
        setPhongBans(response.data);
      })
      .catch((error) => console.error("Lỗi khi lấy danh sách phòng ban:", error));
  }, []);

  const fetchEmployeesByDepartment = (departmentName) => {
    if (!departmentName) {
      setNhanViens([]);
      return;
    }
    // Gọi API lấy danh sách nhân viên theo phòng ban
    axios
      .get(`http://localhost:8080/api/user/listByDepartment?department=${departmentName}`)
      .then((response) => {
        setNhanViens(response.data);
      })
      .catch((error) => console.error("Lỗi khi lấy danh sách nhân viên:", error));
  };

  const handleDepartmentChange = (e) => {
    const departmentName = e.target.value;
    setSelectedPhongBan(departmentName);
    fetchEmployeesByDepartment(departmentName);
  };

  const indexOfLastNhanVien = currentPage * nhanViensPerPage;
  const indexOfFirstNhanVien = indexOfLastNhanVien - nhanViensPerPage;
  const currentNhanViens = nhanViens.slice(indexOfFirstNhanVien, indexOfLastNhanVien);
  const totalPages = Math.ceil(nhanViens.length / nhanViensPerPage);

  const changePage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const xemChiTietNhanVien = (nhanVien) => {
    setSelectedNhanVien(nhanVien); // Lưu nhân viên được chọn
    setIsModalOpen(true); // Mở modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNhanVien(null); // Xóa nhân viên đang xem
  };

  return (
    <div className={styles["employee-page"]}>
      <div className={styles["filter-container"]}>
        <select value={selectedPhongBan} onChange={handleDepartmentChange}>
          <option value="">- Chọn Phòng Ban -</option>
          {phongBans.map((phongBan) => (
            <option key={phongBan.id} value={phongBan.name}>
              {phongBan.name}
            </option>
          ))}
        </select>
      </div>
      <div className={styles["employee-table-container"]}>
        <table className={styles["employee-table"]}>
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên Người Dùng</th>
              <th>Email</th>
              <th>Ngày Gia Nhập</th>
              <th>Trạng Thái</th>
              <th>Hoạt động</th>
            </tr>
          </thead>
          <tbody>
            {currentNhanViens.length > 0 ? (
              currentNhanViens.map((nhanVien) => (
                <tr key={nhanVien.id}>
                  <td onClick={() => xemChiTietNhanVien(nhanVien)}>
                    <img
                      src={nhanVien.avatar || "https://via.placeholder.com/50"}
                      alt="Avatar"
                      className={styles["employee-avatar"]}
                    />
                  </td>
                  <td onClick={() => xemChiTietNhanVien(nhanVien)}>{nhanVien.name}</td>
                  <td onClick={() => xemChiTietNhanVien(nhanVien)}>{nhanVien.email}</td>
                  <td onClick={() => xemChiTietNhanVien(nhanVien)}>
                    {nhanVien.birthDay
                      ? new Date(nhanVien.birthDay).toLocaleDateString()
                      : "Không có"}
                  </td>
                  <td
                    className={
                      nhanVien.isDelete
                        ? styles["status-deleted"]
                        : styles["status-active"]
                    }
                    onClick={() => xemChiTietNhanVien(nhanVien)}
                  >
                    {nhanVien.isDelete ? "Đã xóa" : "Đang hoạt động"}
                  </td>
                  <td>
                    <button
                      className={styles["dropdown-button"]}
                      onClick={() => alert("Thực hiện chức năng tại đây!")}
                    >
                      Hoạt động
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  Không có nhân viên nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles["pagination"]}>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => changePage(index + 1)}
            className={`${styles.pageButton} ${
              currentPage === index + 1 ? styles.activePage : ""
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <EmployeeDetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        nhanVien={selectedNhanVien}
      />
    </div>
  );
};

export default EmployeeByDepartment;
