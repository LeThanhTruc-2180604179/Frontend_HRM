import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './EditUser.module.css';

const EditUser = ({ id, onBack }) => {
    const [userData, setUserData] = useState(null);
    const [userAvatar, setUserAvatar] = useState(null); // Thêm state để lưu ảnh
    const [positions, setPositions] = useState([]); // Thêm state để lưu danh sách vị trí
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Lấy thông tin người dùng
    useEffect(() => {
        if (id) {
            axios.get(`http://localhost:8080/api/user/profile?id=${id}`)
                .then((response) => setUserData(response.data))
                .catch(() => setError('Không thể tải thông tin người dùng'));

            // Gọi API để lấy ảnh
            axios.get(`http://localhost:8080/api/user/${id}/image`)
                .then((response) => {
                    if (response.data) {
                        setUserAvatar(`data:image/jpeg;base64,${response.data}`);
                    } else {
                        setUserAvatar(null);
                    }
                })
                .catch(() => setUserAvatar(null)); // Nếu lỗi, không hiển thị ảnh

            // Tải danh sách vị trí
            axios.get('http://localhost:8080/api/position/list')
                .then((response) => setPositions(response.data))
                .catch(() => setPositions([]));
        }
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setUserData((prev) => ({
            ...prev,
            [name]: name === 'positionId' ? parseInt(value) : value,
        }));
    };

    const handleSave = async () => {
        try {
            await axios.put(`http://localhost:8080/api/user/update`, userData, {
                headers: { 'Content-Type': 'application/json' },
            });

            setSuccess('Cập nhật thành công');
            setError('');
            setIsEditing(false);
        } catch (err) {
            setError(`Cập nhật thất bại: ${err.response?.data || 'Lỗi không xác định'}`);
            setSuccess('');
        }
    };

    const handleBack = () => {
        if (onBack) onBack();
    };

    if (!userData) {
        return <p>Đang tải dữ liệu...</p>;
    }

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.imageWrapper}>
                    {userAvatar ? (
                        <img src={userAvatar} alt="Avatar" className={styles.avatar} />
                    ) : (
                        <p>Người dùng chưa cập nhật ảnh</p>
                    )}
                </div>
                <p className={styles.infoText}>{userData.name}</p>
                <p className={styles.infoText}>{userData.email}</p>
               
                
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <h2 className={styles.sectionTitle}>Chỉnh Sửa Thông Tin</h2>
                {error && <p className={styles.errorText}>{error}</p>}
                {success && <p className={styles.successText}>{success}</p>}
                <form>
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
                            <select
                                name="sex"
                                value={userData.sex || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={styles.inputField}
                            >
                                <option value="Male">Nam</option>
                                <option value="Female">Nữ</option>
                                <option value="Other">Khác</option>
                            </select>
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
                            <label>Chức Vụ</label>
                            <select
                                name="positionId"
                                value={userData.positionId || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={styles.inputField}
                            >
                                <option value="">Chọn chức vụ</option>
                                {positions.map((position) => (
                                    <option key={position.id} value={position.id}>
                                        {position.name}
                                    </option>
                                ))}
                            </select>
                        </div>
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
                        <button type="button" onClick={handleBack} className={styles.backButton}>
                            Quay Lại
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUser;
