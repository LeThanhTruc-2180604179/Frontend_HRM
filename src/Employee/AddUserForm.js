import React, { useState } from "react";
import axios from "axios";

const AddUserForm = ({ onContentChange, fetchNhanViens }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    chucDanh: "",
    phongBan: "",
    loai: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/api/user/add", formData);
      await fetchNhanViens(); // Cập nhật danh sách nhân viên
      onContentChange("employee"); // Quay lại danh sách nhân viên
    } catch (error) {
      console.error("Lỗi khi thêm nhân viên:", error);
    }
  };

  return (
    <div>
      <h2>Thêm Nhân Viên Mới</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Tên"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        {/* Thêm các trường khác như chucDanh, phongBan, loai */}
        <button type="submit">Thêm</button>
        <button type="button" onClick={() => onContentChange("employee")}>
          Hủy
        </button>
      </form>
    </div>
  );
};

export default AddUserForm;
