import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./ListEmployees.module.css";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSave,
  FaTimes,
  FaBars,
  FaUserFriends,
  FaIdBadge,
  FaCheckCircle,
  FaTimesCircle,
  FaPlusCircle,
  FaFileExcel,
} from "react-icons/fa";
import EmployeeDetailsModal from "./EmployeeDetailsModal";

const DanhSachNhanVien = ({ onContentChange }) => {
  // State variables
  const [view, setView] = useState("employees");
  const [nhanViens, setNhanViens] = useState([]);
  const [positions, setPositions] = useState([]);
  const [phongBans, setPhongBans] = useState([]);
  const [boLoc, setBoLoc] = useState({
    chucDanh: "",
    phongBan: "",
    trangThai: "Tất cả",
    vaiTro: "",
  });

  const [selectedNhanVien, setSelectedNhanVien] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const nhanViensPerPage = 6;

  const [newPosition, setNewPosition] = useState("");
  const [editPosition, setEditPosition] = useState(null);
  const [editName, setEditName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNhanViens, setFilteredNhanViens] = useState([]);
  const [selectedPhongBanId, setSelectedPhongBanId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Modal thêm nhân viên
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    birthDay: "",
    phoneNumber: "",
    address: "",
    sex: "",
    nationality: "",
    homeTown: "",
    positionId: "",
  });

  // Xóa chức vụ
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleteIntervalId, setDeleteIntervalId] = useState(null);
  const [positionToDelete, setPositionToDelete] = useState(null);

  // New states for role editing
  const [roles, setRoles] = useState([]);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedUserForRoleEdit, setSelectedUserForRoleEdit] = useState(null);
  const [newRole, setNewRole] = useState("");

  // Fetch data on component mount
  useEffect(() => {
    fetchNhanViens();
    fetchPhongBans();
    fetchPositions();
    fetchRoles();
  }, []);

  // Update filtered employees when department changes
  useEffect(() => {
    if (selectedPhongBanId) {
      fetchNhanViensByDepartment(selectedPhongBanId);
    } else {
      setFilteredNhanViens(nhanViens);
    }
  }, [selectedPhongBanId, nhanViens]);

  // Filter employees based on search and filters
  useEffect(() => {
    const filtered = nhanViens.filter((nhanVien) => {
      const matchesSearch =
        nhanVien.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nhanVien.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPosition =
        boLoc.chucDanh === "" || nhanVien.positionName === boLoc.chucDanh;

      let matchesStatus = true;
      if (boLoc.trangThai === "Đang làm") {
        matchesStatus = !nhanVien.isDelete;
      } else if (boLoc.trangThai === "Đã nghỉ") {
        matchesStatus = nhanVien.isDelete;
      }

      const matchesPhongBan =
        boLoc.phongBan === "" || nhanVien.departmentId == boLoc.phongBan;

      const matchesRole =
        boLoc.vaiTro === "" || nhanVien.role === boLoc.vaiTro;

      return (
        matchesSearch &&
        matchesPosition &&
        matchesStatus &&
        matchesPhongBan &&
        matchesRole
      );
    });

    const sortedNhanViens = filtered.sort((a, b) => {
      if (a.isDelete === b.isDelete) return 0;
      return a.isDelete ? 1 : -1;
    });

    setFilteredNhanViens(sortedNhanViens);
  }, [boLoc, searchTerm, nhanViens]);

  // Handle delete countdown
  useEffect(() => {
    if (deleteCountdown === 0 && isDeleteConfirmationOpen) {
      deletePosition(positionToDelete.id);
      clearInterval(deleteIntervalId);
      setIsDeleteConfirmationOpen(false);
      setDeleteCountdown(5);
    }
  }, [deleteCountdown, isDeleteConfirmationOpen, deleteIntervalId, positionToDelete]);

  // Fetch employees
  const fetchNhanViens = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/user/list");
      const updatedNhanViens = await Promise.all(
        response.data.map(async (nhanVien) => {
          const avatar = await getUserImage(nhanVien.id);
          return { ...nhanVien, avatar };
        })
      );
      setNhanViens(updatedNhanViens);
      setFilteredNhanViens(updatedNhanViens);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhân viên:", error.message);
    }
  };

  // Fetch employees by department
  const fetchNhanViensByDepartment = async (phongBanId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/department/listUser?id=${phongBanId}`
      );
      const updatedNhanViens = await Promise.all(
        response.data.map(async (nhanVien) => {
          const avatar = await getUserImage(nhanVien.id);
          return { ...nhanVien, avatar };
        })
      );
      setFilteredNhanViens(updatedNhanViens);
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách nhân viên theo phòng ban:",
        error.message
      );
    }
  };

  // Fetch departments
  const fetchPhongBans = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/department/listDepartment"
      );
      setPhongBans(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phòng ban:", error.message);
    }
  };

  // Fetch positions
  const fetchPositions = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/position/list");
      setPositions(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chức vụ:", error.message);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/role/list");
      setRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error.message);
    }
  };

  // Get user image
  const getUserImage = async (id) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/user/${id}/image`
      );
      return response.data ? `data:image/jpeg;base64,${response.data}` : null;
    } catch (error) {
      console.error(`Lỗi khi tải ảnh cho id ${id}:`, error);
      return null;
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle department filter change
  const handlePhongBanChange = (e) => {
    const value = e.target.value;
    setSelectedPhongBanId(value);
    setBoLoc({ ...boLoc, phongBan: value });
  };

  // Handle position filter change
  const handleChucDanhChange = (e) => {
    setBoLoc({ ...boLoc, chucDanh: e.target.value });
  };

  // Set status filter
  const setTrangThai = (trangThai) => {
    setBoLoc({ ...boLoc, trangThai });
  };

  // Set role filter
  const setVaiTro = (vaiTro) => {
    setBoLoc({ ...boLoc, vaiTro });
  };

  // Add new position
  const handleAddPosition = async () => {
    try {
      const response = await axios.post("http://localhost:8080/api/position/add", {
        name: newPosition,
      });
      if (response.status === 200) {
        alert("Thêm chức vụ thành công");
        setNewPosition("");
        fetchPositions();
      }
    } catch (error) {
      console.error("Lỗi khi thêm chức vụ:", error);
      alert("Không thể thêm chức vụ");
    }
  };

  // Delete position
  const handleDeletePosition = (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa chức vụ này không?"
    );
    if (!confirmDelete) return;

    setPositionToDelete(positions.find((pos) => pos.id === id));
    setIsDeleteConfirmationOpen(true);

    const intervalId = setInterval(() => {
      setDeleteCountdown((prev) => prev - 1);
    }, 1000);
    setDeleteIntervalId(intervalId);
  };

  // Cancel delete position
  const cancelDelete = () => {
    clearInterval(deleteIntervalId);
    setIsDeleteConfirmationOpen(false);
    setDeleteCountdown(5);
  };

  // Confirm delete position
  const deletePosition = async (id) => {
    try {
      const response = await axios.delete("http://localhost:8080/api/position", {
        params: { id },
      });
      if (response.status === 200) {
        alert("Xóa chức vụ thành công");
        fetchPositions();
      }
    } catch (error) {
      console.error("Lỗi khi xóa chức vụ:", error);
      alert("Không thể xóa chức vụ");
    }
  };

  // Open edit position modal
  const openEditModal = (position) => {
    setEditPosition(position);
    setEditName(position.name);
    setIsEditModalOpen(true);
  };

  // Close edit position modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditPosition(null);
    setEditName("");
  };

  // Update position
  const handleUpdatePosition = async () => {
    try {
      const response = await axios.put("http://localhost:8080/api/position/update", {
        id: editPosition.id,
        name: editName,
      });
      if (response.status === 200) {
        alert("Cập nhật chức vụ thành công");
        closeEditModal();
        fetchPositions();
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật chức vụ:", error);
      alert("Không thể cập nhật chức vụ");
    }
  };

  // Pagination calculations
  const indexOfLastNhanVien = currentPage * nhanViensPerPage;
  const indexOfFirstNhanVien = indexOfLastNhanVien - nhanViensPerPage;
  const currentNhanViens = filteredNhanViens.slice(
    indexOfFirstNhanVien,
    indexOfLastNhanVien
  );
  const totalPages = Math.ceil(filteredNhanViens.length / nhanViensPerPage);

  // Change page
  const changePage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // View employee details
  const xemChiTietNhanVien = (e, nhanVien) => {
    e.stopPropagation();
    setSelectedNhanVien(nhanVien);
    setIsModalOpen(true);
  };

  // Close employee details modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNhanVien(null);
  };

  // Toggle dropdown menu
  const toggleDropdown = (e, index) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === index ? null : index);
  };

  // Handle edit employee
  const handleEdit = (e, id) => {
    e.stopPropagation();
    onContentChange("editUser", id);
  };

  // Handle delete employee
  const handleDeleteNhanVien = async (e, id) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa nhân viên này không?"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.put("http://localhost:8080/api/user/update", {
        id: id,
        isDelete: true,
      });
      if (response.status === 200) {
        alert("Đã xóa nhân viên");
        fetchNhanViens();
      }
    } catch (error) {
      console.error("Lỗi khi xóa nhân viên:", error);
      alert("Không thể xóa nhân viên");
    }
  };

  // Switch view between employees and positions
  const switchView = (viewName) => {
    setView(viewName);
    setCurrentPage(1);
    setBoLoc({ chucDanh: "", phongBan: "", trangThai: "Tất cả", vaiTro: "" });
    setSearchTerm("");
  };

  // Open add employee modal
  const openAddModal = () => {
    setIsAddModalOpen(true);
    setIsAddMenuOpen(false);
  };

  // Close add employee modal
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewEmployee({
      name: "",
      email: "",
      birthDay: "",
      phoneNumber: "",
      address: "",
      sex: "",
      nationality: "",
      homeTown: "",
      positionId: "",
    });
  };

  // Handle new employee input changes
  const handleNewEmployeeChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({ ...newEmployee, [name]: value });
  };

  // Add new employee
  const handleAddEmployee = async () => {
    try {
      const employeeData = { ...newEmployee };
      if (!newEmployee.positionId) {
        delete employeeData.positionId;
      } else {
        employeeData.positionId = parseInt(newEmployee.positionId);
      }

      const response = await axios.post("http://localhost:8080/api/user/add", employeeData);

      if (response.status === 200) {
        alert("Thêm nhân viên thành công");
        closeAddModal();
        fetchNhanViens();
      } else {
        alert("Không thể thêm nhân viên");
      }
    } catch (error) {
      console.error("Lỗi khi thêm nhân viên:", error.response?.data || error.message);
      alert(`Không thể thêm nhân viên: ${error.response?.data || error.message}`);
    }
  };

  // Get color based on role
  const getRoleColor = (role) => {
    switch (role) {
      case "EMPLOYEE":
        return "green";
      case "ADMIN":
        return "red";
      case "MANAGER":
        return "orange";
      default:
        return "black";
    }
  };

  // Get color based on status
  const getStatusColor = (isDelete) => {
    return isDelete ? "red" : "green";
  };

  // Get position icon (you can customize this as needed)
  const getPositionIcon = (positionName) => {
    return (
      <img
        src={"https://img.upanh.tv/2024/12/13/husband.gif"}
        alt={`${positionName} Icon`}
        className={styles["position-icon"]}
      />
    );
  };

  // Toggle add menu dropdown
  const toggleAddMenu = () => {
    setIsAddMenuOpen(!isAddMenuOpen);
  };

  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles["add-menu-container"]}`)) {
        setIsAddMenuOpen(false);
      }
    };

    if (isAddMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isAddMenuOpen]);

  // Function to handle exporting to Excel
  const handleExportExcel = async () => {
    try {
      // Fetch the Excel file from the backend
      const response = await axios.get("http://localhost:8080/api/user/export/excel", {
        responseType: "blob", // Important for handling binary data
      });

      // Create a blob from the response data
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from response headers if available
      const contentDisposition = response.headers["content-disposition"];
      let fileName = "users.xlsx";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }
      link.setAttribute("download", fileName);

      // Append to the document and trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error);
      alert("Không thể xuất file Excel");
    }
  };

  // Functions for Edit Role Modal
  const openEditRoleModal = (e, nhanVien) => {
    e.stopPropagation();
    setSelectedUserForRoleEdit(nhanVien);
    setNewRole(nhanVien.role);
    setIsEditRoleModalOpen(true);
  };

  const closeEditRoleModal = () => {
    setIsEditRoleModalOpen(false);
    setSelectedUserForRoleEdit(null);
    setNewRole("");
  };

  const handleRoleChange = (e) => {
    setNewRole(e.target.value);
  };

  const handleUpdateRole = async () => {
    if (!selectedUserForRoleEdit) return;

    try {
      const token = localStorage.getItem('token'); // Ensure the token is stored in localStorage

      const response = await axios.put(
        "http://localhost:8080/api/user/updateRole",
        null, // No request body as params are used
        {
          params: {
            userId: selectedUserForRoleEdit.id,
            newRole: newRole,
          },
          headers: {
            'Authorization': `Bearer ${token}`, // Include token if required by backend
          },
        }
      );

      if (response.status === 200) {
        alert("Vai trò đã được cập nhật thành công");
        fetchNhanViens(); // Refresh the employee list to reflect changes
        closeEditRoleModal();
      } else {
        alert("Cập nhật vai trò không thành công");
      }
    } catch (error) {
      console.error("Error updating role:", error.response?.data || error.message);
      alert(`Cập nhật vai trò không thành công: ${error.response?.data || error.message}`);
    }
  };

  return (
    <div className={styles["container"]}>
      {/* Sidebar */}
      <div className={styles["sidebar"]}>
        <h4>DANH SÁCH</h4>
        <div className={styles["sidebar-section"]}>
          <ul className={styles["nav-list"]}>
            <li
              className={view === "employees" ? styles.active : ""}
              onClick={() => switchView("employees")}
            >
              <FaUserFriends className={styles["icon"]} />
              Nhân viên
            </li>
            <li
              className={view === "positions" ? styles.active : ""}
              onClick={() => switchView("positions")}
            >
              <FaIdBadge className={styles["icon"]} />
              Chức vụ
            </li>
          </ul>
        </div>

        <hr className={styles["divider"]} />

        {view === "employees" && (
          <>
            <h4>TRẠNG THÁI</h4>
            <div className={styles["sidebar-section"]}>
              <ul className={styles["nav-list"]}>
                <li
                  className={boLoc.trangThai === "Đang làm" ? styles.active : ""}
                  onClick={() => setTrangThai("Đang làm")}
                >
                  <FaCheckCircle className={styles["icon"]} />
                  Đang làm
                </li>
                <li
                  className={boLoc.trangThai === "Đã nghỉ" ? styles.active : ""}
                  onClick={() => setTrangThai("Đã nghỉ")}
                >
                  <FaTimesCircle className={styles["icon"]} />
                  Đã nghỉ
                </li>
              </ul>
            </div>

            <h4>VAI TRÒ</h4>
            <div className={styles["sidebar-section"]}>
              <ul className={styles["nav-list"]}>
                {/* "Tất cả" Button */}
                <li
                  className={boLoc.vaiTro === "" ? styles.active : ""}
                  onClick={() => setVaiTro("")}
                >
                  Tất cả
                </li>
                <li
                  className={boLoc.vaiTro === "ADMIN" ? styles.active : ""}
                  onClick={() => setVaiTro("ADMIN")}
                >
                  ADMIN
                </li>
                <li
                  className={boLoc.vaiTro === "MANAGER" ? styles.active : ""}
                  onClick={() => setVaiTro("MANAGER")}
                >
                  MANAGER
                </li>
                <li
                  className={boLoc.vaiTro === "EMPLOYEE" ? styles.active : ""}
                  onClick={() => setVaiTro("EMPLOYEE")}
                >
                  EMPLOYEE
                </li>
              </ul>
            </div>
          </>
        )}

        {view === "positions" && (
          <>
            <h4>THÊM CHỨC VỤ</h4>
            <div className={styles["sidebar-section"]}>
              <div className={styles["add-position-container"]}>
                <input
                  type="text"
                  className={styles["input-field-sidebar"]}
                  placeholder="Tên chức vụ"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                />
                <button className={styles["btn-add-sidebar"]} onClick={handleAddPosition}>
                  <FaPlusCircle className={styles["icon"]} /> Thêm
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className={styles["main-content"]}>
        {view === "employees" && (
          <>
            {/* Top Bar with Search */}
            <div className={styles["top-bar"]}>
              <h2>Danh sách nhân viên</h2>
              <div className={styles["search-box"]}>
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc email"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Filters and Menu */}
            <div className={styles["filters-container"]}>
              <select name="chucDanh" onChange={handleChucDanhChange} value={boLoc.chucDanh}>
                <option value="">- Chọn Chức Vụ -</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.name}>
                    {position.name}
                  </option>
                ))}
              </select>
              <select name="phongBan" onChange={handlePhongBanChange} value={boLoc.phongBan}>
                <option value="">- Chọn Phòng Ban -</option>
                {phongBans.map((phongBan) => (
                  <option key={phongBan.id} value={phongBan.id}>
                    {phongBan.name}
                  </option>
                ))}
              </select>
              <div className={styles["add-menu-container"]}>
                <button className={styles["btn-menu"]} onClick={toggleAddMenu}>
                  <FaBars /> Menu
                </button>
                {isAddMenuOpen && (
                  <div className={styles["add-menu-dropdown"]}>
                    <button onClick={openAddModal}>
                      <FaPlus /> Thêm Nhân Viên
                    </button>
                    {/* Export to Excel Button */}
                    <button onClick={handleExportExcel}>
                      <FaFileExcel /> Xuất Excel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Employee Table */}
            <div className={styles["employee-table-container"]}>
              <table className={styles["employee-table"]}>
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Vai Trò</th>
                    <th>Tình trạng</th>
                    <th>Hoạt động</th>
                  </tr>
                </thead>
                <tbody>
                  {currentNhanViens.map((nhanVien, index) => (
                    <tr key={nhanVien.id}>
                      <td onClick={(e) => xemChiTietNhanVien(e, nhanVien)}>
                        <img
                          src={nhanVien.avatar || "https://via.placeholder.com/40"}
                          alt="Avatar"
                          className={styles["employee-avatar"]}
                        />
                      </td>
                      <td onClick={(e) => xemChiTietNhanVien(e, nhanVien)}>{nhanVien.name}</td>
                      <td onClick={(e) => xemChiTietNhanVien(e, nhanVien)}>{nhanVien.email}</td>
                      <td onClick={(e) => xemChiTietNhanVien(e, nhanVien)}>
                        <span style={{ color: getRoleColor(nhanVien.role) }}>{nhanVien.role}</span>
                      </td>
                      <td style={{ color: getStatusColor(nhanVien.isDelete) }}>
                        {nhanVien.isDelete ? "Đã nghỉ" : "Đang làm"}
                      </td>
                      <td>
                        <div className={styles["dropdown"]}>
                          <button
                            className={styles["dropdown-button"]}
                            onClick={(e) => toggleDropdown(e, index)}
                          >
                            &#9776;
                          </button>
                          {openDropdown === index && (
                            <div className={styles["dropdown-content"]}>
                              <button onClick={(e) => handleEdit(e, nhanVien.id)}>
                                <FaEdit /> Chỉnh sửa
                              </button>
                              <button onClick={(e) => handleDeleteNhanVien(e, nhanVien.id)}>
                                <FaTrash /> Xóa
                              </button>
                              {/* Edit Role Button */}
                              <button onClick={(e) => openEditRoleModal(e, nhanVien)}>
                                <FaUserFriends /> Chỉnh sửa vai trò
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

            {/* Employee Details Modal */}
            <EmployeeDetailsModal
              isOpen={isModalOpen}
              onClose={closeModal}
              nhanVien={selectedNhanVien}
            />

            {/* Add Employee Modal */}
            {isAddModalOpen && (
              <div className={styles["modal"]}>
                <div className={styles["modal-content"]}>
                  <h3>Thêm Nhân Viên Mới</h3>
                  <div className={styles["form-container"]}>
                    <div className={styles["form-column"]}>
                      <input
                        type="text"
                        name="name"
                        className={styles["input-field"]}
                        placeholder="Tên nhân viên"
                        value={newEmployee.name}
                        onChange={handleNewEmployeeChange}
                      />
                      <input
                        type="email"
                        name="email"
                        className={styles["input-field"]}
                        placeholder="Email"
                        value={newEmployee.email}
                        onChange={handleNewEmployeeChange}
                      />
                      <input
                        type="date"
                        name="birthDay"
                        className={styles["input-field"]}
                        placeholder="Ngày sinh"
                        value={newEmployee.birthDay}
                        onChange={handleNewEmployeeChange}
                      />
                      <input
                        type="text"
                        name="phoneNumber"
                        className={styles["input-field"]}
                        placeholder="Số điện thoại"
                        value={newEmployee.phoneNumber}
                        onChange={handleNewEmployeeChange}
                      />
                    </div>
                    <div className={styles["form-column"]}>
                      <input
                        type="text"
                        name="address"
                        className={styles["input-field"]}
                        placeholder="Địa chỉ"
                        value={newEmployee.address}
                        onChange={handleNewEmployeeChange}
                      />
                      <select
                        name="sex"
                        className={styles["input-field"]}
                        value={newEmployee.sex}
                        onChange={handleNewEmployeeChange}
                      >
                        <option value="">- Chọn Giới Tính -</option>
                        <option value="Nam">Nam</option>
                        <option value="Nu">Nữ</option>
                        <option value="Khac">Khác</option>
                      </select>
                      <input
                        type="text"
                        name="nationality"
                        className={styles["input-field"]}
                        placeholder="Quốc tịch"
                        value={newEmployee.nationality}
                        onChange={handleNewEmployeeChange}
                      />
                      <input
                        type="text"
                        name="homeTown"
                        className={styles["input-field"]}
                        placeholder="Quê quán"
                        value={newEmployee.homeTown}
                        onChange={handleNewEmployeeChange}
                      />
                    </div>
                  </div>
                  <div className={styles["modal-actions"]}>
                    <button className={styles["btn-save"]} onClick={handleAddEmployee}>
                      <FaSave /> Thêm
                    </button>
                    <button className={styles["btn-cancel"]} onClick={closeAddModal}>
                      <FaTimes /> Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Role Modal */}
            {isEditRoleModalOpen && selectedUserForRoleEdit && (
              <div className={styles["modal"]}>
                <div className={styles["modal-content"]}>
                  <h3>Chỉnh sửa vai trò cho {selectedUserForRoleEdit.name}</h3>
                  <div className={styles["form-group"]}>
                    <label htmlFor="newRole">Vai Trò Mới:</label>
                    <select
                      id="newRole"
                      value={newRole}
                      onChange={handleRoleChange}
                      className={styles["input-field"]}
                    >
                      <option value="">- Chọn Vai Trò -</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles["modal-actions"]}>
                    <button className={styles["btn-save"]} onClick={handleUpdateRole}>
                      <FaSave /> Lưu
                    </button>
                    <button className={styles["btn-cancel"]} onClick={closeEditRoleModal}>
                      <FaTimes /> Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Position Confirmation Modal */}
            {isDeleteConfirmationOpen && (
              <div className={styles["modal"]}>
                <div className={styles["modal-content"]}>
                  <h3>Cảnh báo</h3>
                  <p>
                    Nếu bạn xóa chức vụ này, các nhân viên sẽ mất chức vụ. Bạn có chắc chắn muốn tiếp tục?
                  </p>
                  <div className={styles["countdown-bar"]}>
                    <div
                      className={styles["countdown-progress"]}
                      style={{ width: `${(deleteCountdown / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className={styles["modal-actions"]}>
                    <button className={styles["btn-cancel"]} onClick={cancelDelete}>
                      <FaTimes /> Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {view === "positions" && (
          <>
            {/* Top Bar with Search */}
            <div className={styles["top-bar"]}>
              <h2>Danh sách chức vụ</h2>
              <div className={styles["search-box"]}>
                <input
                  type="text"
                  placeholder="Tìm theo chức vụ"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Positions List */}
            <div className={styles["positions-container"]}>
              <div className={styles["card-container"]}>
                {positions.map((position) => (
                  <div className={styles["position-card"]} key={position.id}>
                    <div className={styles["card-icon"]}>{getPositionIcon(position.name)}</div>
                    <div className={styles["card-name"]}>{position.name}</div>
                    <div className={styles["card-overlay"]}>
                      <button
                        className={styles["btn-edit"]}
                        onClick={() => openEditModal(position)}
                      >
                        <FaEdit /> Chỉnh sửa
                      </button>
                      <button
                        className={styles["btn-delete"]}
                        onClick={() => handleDeletePosition(position.id)}
                      >
                        <FaTrash /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit Position Modal */}
            {isEditModalOpen && (
              <div className={styles["modal"]}>
                <div className={styles["modal-content"]}>
                  <h3>Chỉnh sửa chức vụ</h3>
                  <input
                    type="text"
                    className={styles["input-field"]}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <div className={styles["modal-actions"]}>
                    <button className={styles["btn-save"]} onClick={handleUpdatePosition}>
                      <FaSave /> Lưu
                    </button>
                    <button className={styles["btn-cancel"]} onClick={closeEditModal}>
                      <FaTimes /> Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Position Confirmation Modal */}
            {isDeleteConfirmationOpen && (
              <div className={styles["modal"]}>
                <div className={styles["modal-content"]}>
                  <h3>Cảnh báo</h3>
                  <p>
                    Nếu bạn xóa chức vụ này, các nhân viên sẽ mất chức vụ. Bạn có chắc chắn muốn tiếp tục?
                  </p>
                  <div className={styles["countdown-bar"]}>
                    <div
                      className={styles["countdown-progress"]}
                      style={{ width: `${(deleteCountdown / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className={styles["modal-actions"]}>
                    <button className={styles["btn-cancel"]} onClick={cancelDelete}>
                      <FaTimes /> Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DanhSachNhanVien;
