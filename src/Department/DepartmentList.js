import React, { useState, useEffect } from "react";
import DepartmentAdd from "../Department/DepartmentAdd";
import DepartmentEdit from "../Department/DepartmentEdit";
import AddUserToDepartment from "../Department/AddUserToDepartment";
import styles from "./DepartmentList.module.css";

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedDepartmentForUser, setSelectedDepartmentForUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userList, setUserList] = useState([]);
  const [showActions, setShowActions] = useState(null);
  const [activeDepartmentId, setActiveDepartmentId] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/department/listDepartment"
      );
      const data = await response.json();

      const departmentsWithCounts = await Promise.all(
        data.map(async (department) => {
          const employeeCount = await fetchEmployeeCount(department.id);
          return {
            ...department,
            employeeCount,
          };
        })
      );

      setDepartments(departmentsWithCounts);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phòng ban:", error);
    }
  };

  const fetchEmployeeCount = async (departmentId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/department/listUser?id=${departmentId}`
      );
      const users = await response.json();
      return users.length;
    } catch (error) {
      console.error("Lỗi khi lấy số lượng nhân viên:", error);
      return 0;
    }
  };

  const fetchUsersInDepartment = async (departmentId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/department/listUser?id=${departmentId}`
      );
      const users = await response.json();

      const usersWithAvatars = await Promise.all(
        users.map(async (user) => {
          const avatar = await fetchUserAvatar(user.id);
          return { ...user, avatar };
        })
      );

      setUserList(usersWithAvatars);
      setSelectedDepartmentId(departmentId);
      setActiveDepartmentId(departmentId);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
    }
  };

  const fetchUserAvatar = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/user/${userId}/image`
      );
      if (response.ok) {
        const imageData = await response.text();
        return `data:image/jpeg;base64,${imageData}`;
      }
      return null;
    } catch (error) {
      console.error(`Lỗi khi tải ảnh cho id ${userId}:`, error);
      return null;
    }
  };

  const handleRemoveUserFromDepartment = async (userId) => {
    if (!selectedDepartmentId) {
      alert("Không xác định được phòng ban");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này khỏi phòng ban?")) {
      try {
        const response = await fetch(
          `http://localhost:8080/api/department/removeUser?userId=${userId}&departmentId=${selectedDepartmentId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          alert("Đã xóa nhân viên khỏi phòng ban");
          fetchUsersInDepartment(selectedDepartmentId);
        } else {
          alert("Không thể xóa nhân viên khỏi phòng ban");
        }
      } catch (error) {
        console.error("Lỗi khi xóa nhân viên khỏi phòng ban:", error);
      }
    }
  };

  const openAddModal = () => setIsAddModalOpen(true);
  const openEditModal = (id) => {
    setSelectedDepartmentId(id);
    setIsEditModalOpen(true);
  };
  const openAddUserModal = (id) => {
    setSelectedDepartmentForUser(id);
    setIsAddUserModalOpen(true);
  };

  const closeAddModal = () => setIsAddModalOpen(false);
  const closeEditModal = () => setIsEditModalOpen(false);
  const closeAddUserModal = () => setIsAddUserModalOpen(false);

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phòng ban này?")) {
      fetch(`http://localhost:8080/api/department?id=${id}`, { method: "DELETE" })
        .then((response) => {
          if (response.ok) {
            setDepartments(departments.filter((dep) => dep.id !== id));
            if (activeDepartmentId === id) {
              setActiveDepartmentId(null);
              setUserList([]);
            }
          } else {
            console.error("Xóa phòng ban thất bại");
          }
        })
        .catch((error) => console.error("Lỗi:", error));
    }
  };

  const filteredDepartments = departments.filter((department) =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDepartments = filteredDepartments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleShowActions = (departmentId) => {
    setShowActions(departmentId);
    setActiveDepartmentId(departmentId);
  };

  const handleCancel = () => {
    setActiveDepartmentId(null);
    setShowActions(null);
    setUserList([]);
    setSelectedDepartmentId(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
    
        <input
          type="text"
          placeholder="Tìm kiếm phòng ban"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.departmentListWrapper}>
          <div className={styles.headerSection}>
            
            <h2 className={styles.sectionTitle}>Danh sách phòng ban
            <button onClick={openAddModal} className={styles.addButton}>
          Thêm phòng ban
        </button>
            </h2>
         
            
          </div>
          <div className={styles.departmentGrid}>
            {currentDepartments.map((department) => (
              <div
                key={department.id}
                className={`${styles.departmentCard} ${
                  activeDepartmentId && activeDepartmentId !== department.id
                    ? styles.blurredCard
                    : ""
                }`}
                onMouseLeave={() => setShowActions(null)}
              >
                <div className={styles.cardContent}>
                  <div className={styles.iconContainer}>
                    <img 
                      src="https://img.upanh.tv/2024/12/10/corporate-culture.gif" 
                      alt="Department" 
                      className={styles.departmentGif} 
                    />
                  </div>
                  <div className={styles.departmentInfo}>
                    <h3 className={styles.depName}>{department.name}</h3>
                    <p className={styles.depCount}>{department.employeeCount} nhân viên</p>
                  </div>
                </div>
                <div className={styles.overlay}>
                  {showActions === department.id ? (
                    <>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(department.id);
                        }}
                      >
                        Cập nhật
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(department.id);
                        }}
                      >
                        Xóa
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddUserModal(department.id);
                        }}
                      >
                        Thêm
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={styles.primaryButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchUsersInDepartment(department.id);
                        }}
                      >
                        Xem danh sách
                      </button>
                      <button
                        className={styles.primaryButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowActions(department.id);
                        }}
                      >
                        Chức năng
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.pagination}>
            <button
              onClick={handlePreviousPage}
              className={styles.pageButton}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            <button
              onClick={handleNextPage}
              className={styles.pageButton}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        </div>

        <div className={styles.userListCard}>
          <div className={styles.headerSection}>
            {/* Nếu chưa chọn phòng ban, tiêu đề khác, nếu chọn thì hiển thị "Danh sách nhân viên" */}
            {activeDepartmentId ? (
              <>
                <h2 className={styles.sectionTitle}>Danh sách nhân viên</h2>
                <p className={styles.sectionSubtitle}>
                  Xem và quản lý nhân viên trong phòng ban đã chọn.
                </p>
              </>
            ) : (
              <>
                <h2 className={styles.sectionTitle}>Thông tin phòng ban</h2>
                <p className={styles.sectionSubtitle}>
                  Chọn phòng ban ở bảng bên trái để xem danh sách nhân viên.
                </p>
              </>
            )}
          </div>

          {activeDepartmentId && (
            <button className={styles.cancelButton} onClick={handleCancel}>
              Hủy
            </button>
          )}
          <div className={styles.userTableContainer}>
            {userList.length === 0 && !activeDepartmentId ? (
              <div className={styles.emptyState}>
                <img
                  src="https://img.upanh.tv/2024/12/10/to-do-list.gif"
                  alt="Chọn phòng ban"
                  className={styles.emptyStateImage}
                />
                <p className={styles.emptyStateText}>
                  Chọn <span>phòng ban</span> để xem danh sách
                </p>
              </div>
            ) : (
              <table className={styles.userTable}>
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", color: "#666" }}>
                        Không có nhân viên trong phòng ban này.
                      </td>
                    </tr>
                  ) : (
                    userList.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <img
                            src={user.avatar || "https://via.placeholder.com/50"}
                            alt="Avatar"
                            className={styles.avatar}
                          />
                        </td>
                        <td>{user.name}</td>
                        <td>{user.id}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <DepartmentAdd onClose={closeAddModal} onRefresh={fetchDepartments} />
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <DepartmentEdit
              id={selectedDepartmentId}
              onClose={closeEditModal}
              onRefresh={fetchDepartments}
            />
          </div>
        </div>
      )}

      {isAddUserModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <AddUserToDepartment
              departmentId={selectedDepartmentForUser}
              onClose={closeAddUserModal}
              onRefresh={fetchDepartments}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentList;
