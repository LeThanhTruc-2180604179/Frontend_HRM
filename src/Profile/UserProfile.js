import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserProfile.module.css';

const UserProfile = () => {
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [departments, setDepartments] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            navigate('/login');
            return;
        }

        // Fetch user profile
        fetch(`http://localhost:8080/api/user/profile?id=${userId}`)
            .then((response) => {
                if (!response.ok) throw new Error('Unable to fetch user data');
                return response.json();
            })
            .then((data) => {
                setUserData({
                    ...data,
                    role: data.role || '', // Thêm role vào userData
                });
            })
            .catch(() => {
                alert('Không thể lấy dữ liệu người dùng. Vui lòng thử lại sau!');
            });

        // Fetch departments
        fetch(`http://localhost:8080/api/department/listDepartmentUser?id=${userId}`)
            .then((response) => response.json())
            .then((data) => setDepartments(data))
            .catch((error) => console.error('Lỗi:', error));
    }, [navigate]);

    const handleChooseImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Image = reader.result.split(',')[1];
            setUserData((prev) => ({
                ...prev,
                image: base64Image,
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = () => {
        const { password, ...dataToSend } = userData;

        fetch(`http://localhost:8080/api/user/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })
            .then((response) => {
                if (!response.ok) throw new Error('Failed to update user');
                return response.text();
            })
            .then(() => {
                alert('Cập nhật thành công!');
                setIsEditing(false);
            })
            .catch(() => {
                alert('Cập nhật thất bại. Vui lòng thử lại!');
            });
    };

    if (!userData) {
        return <p>Đang tải dữ liệu...</p>;
    }

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.imageWrapper}>
                    <label
                        htmlFor="profileImage"
                        className={isEditing ? styles.imageLabel : styles.imageLabelDisabled}
                    >
                        <img
                            src={`data:image/jpeg;base64,${userData.image}`}
                            alt="Avatar"
                            className={styles.avatar}
                        />
                    </label>
                    {isEditing && (
                        <input
                            type="file"
                            id="profileImage"
                            accept="image/*"
                            onChange={handleChooseImage}
                            style={{ display: 'none' }}
                        />
                    )}
                </div>
                <h3>{userData.name}</h3>
                <p className={styles.infoText}>{userData.email}</p>
                <p className={styles.infoText}>{userData.homeTown}</p>
                <p className={styles.hintText}>
                    {isEditing ? 'Nhấn vào ảnh để thay đổi' : 'Chỉnh sửa để thay đổi ảnh'}
                </p>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <h2 className={styles.sectionTitle}>Edit Profile</h2>
                <form>
                    {/* Form Rows */}
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Tên</label>
                            <input
                                type="text"
                                name="name"
                                value={userData.name || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={userData.email || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={styles.inputField}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Số Điện Thoại</label>
                            <input
                                type="text"
                                name="phoneNumber"
                                value={userData.phoneNumber || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Địa Chỉ</label>
                            <input
                                type="text"
                                name="address"
                                value={userData.address || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={styles.inputField}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Ngày Sinh</label>
                            <input
                                type="date"
                                name="birthDay"
                                value={userData.birthDay || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Giới Tính</label>
                            <input
                                type="text"
                                name="sex"
                                value={userData.sex || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={styles.inputField}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Quê Quán</label>
                            <input
                                type="text"
                                name="homeTown"
                                value={userData.homeTown || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Quốc Tịch</label>
                            <input
                                type="text"
                                name="nationality"
                                value={userData.nationality || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={styles.inputField}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Vai Trò</label>
                            <p className={styles.roleText}>{userData.role || 'Không có vai trò'}</p>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Phòng Ban</label>
                        <ul className={styles.departmentList}>
                            {departments.length > 0 ? (
                                departments.map((department) => <li key={department.id}>{department.name}</li>)
                            ) : (
                                <p>Không có phòng ban</p>
                            )}
                        </ul>
                    </div>

                    <div className={styles.formActions}>
                        {isEditing ? (
                            <>
                                <button type="button" onClick={handleSave} className={styles.saveButton}>
                                    Lưu
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className={styles.cancelButton}
                                >
                                    Hủy
                                </button>
                            </>
                        ) : (
                            <button type="button" onClick={() => setIsEditing(true)} className={styles.editButton}>
                                Chỉnh Sửa
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfile;
