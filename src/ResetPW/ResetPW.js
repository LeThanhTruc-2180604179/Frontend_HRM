import React, { useState } from 'react';

const ResetPW = () => {
  const [userId, setUserId] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordNew1, setPasswordNew1] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra trên frontend (không bắt buộc nhưng tốt để UX)
    if (passwordNew !== passwordNew1) {
      setMessage("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      const response = await fetch(`/api/user/resetPassword?id=${encodeURIComponent(userId)}&passwordNew=${encodeURIComponent(passwordNew)}&passwordNew1=${encodeURIComponent(passwordNew1)}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.text();
        if (data === "OK") {
          setMessage("Đặt lại mật khẩu thành công!");
        } else {
          setMessage("Đặt lại mật khẩu thất bại!");
        }
      } else {
        setMessage("Lỗi server!");
      }
    } catch (error) {
      console.error(error);
      setMessage("Đã xảy ra lỗi khi gửi yêu cầu!");
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "0 auto" }}>
      <h1>Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>ID Người Dùng:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Mật khẩu mới:</label>
          <input
            type="password"
            value={passwordNew}
            onChange={(e) => setPasswordNew(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Nhập lại mật khẩu mới:</label>
          <input
            type="password"
            value={passwordNew1}
            onChange={(e) => setPasswordNew1(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>
        <button type="submit">Đổi mật khẩu</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ResetPW;
