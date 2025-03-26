// src/Addtendance/Attendance.js
import React, { useState, useEffect } from 'react';
import styles from './Addtendance.module.css';
import { generateCode, checkIn, checkOut, getAttendanceHistory, getUserSummary } from '../service/attendanceService';
import removeAccents from 'remove-accents'; // Import thư viện

// Hàm dịch thuật từ tiếng Việt sang tiếng Anh sử dụng LibreTranslate
const translateToEnglish = async (text) => {
  try {
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'vi',
        target: 'en',
        format: 'text',
      }),
    });
    const data = await res.json();
    if (data && data.translatedText) {
      return data.translatedText;
    }
    return text;
  } catch (error) {
    console.error('Lỗi dịch thuật:', error);
    return text;
  }
};

// Hàm geocoding lấy địa chỉ từ lat, lng bằng tiếng Anh và dịch nếu cần
const fetchAddress = async (lat, lng) => {
  console.log('Đang lấy địa chỉ cho', lat, lng);
  if (!lat || !lng) return '';
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=en`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Phản hồi geocoding:', data);
    if (data && data.display_name) {
      let address = data.display_name;
      // Kiểm tra xem địa chỉ có còn chứa ký tự tiếng Việt không
      const isVietnamese = /[ĐđĂăÂâÊêÔôƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỴỵỶỷỸỹ]/.test(address);
      if (isVietnamese) {
        // Dịch địa chỉ sang tiếng Anh
        const translatedAddress = await translateToEnglish(address);
        console.log('Địa chỉ sau khi dịch:', translatedAddress);
        // Loại bỏ dấu tiếng Việt (nếu vẫn còn)
        const finalAddress = removeAccents(translatedAddress);
        return finalAddress;
      }
      // Nếu không chứa tiếng Việt, chỉ loại bỏ dấu nếu cần
      const finalAddress = removeAccents(address);
      return finalAddress;
    }
    return '';
  } catch (error) {
    console.error('Lỗi geocoding:', error);
    return '';
  }
};

const Attendance = () => {
  // Khởi tạo userId từ localStorage
  const [userId] = useState(() => localStorage.getItem('userId') || '');
  const [codeType, setCodeType] = useState('CHECK_IN');
  const [generatedCode, setGeneratedCode] = useState('');
  const [code, setCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // Lấy vị trí hiện tại khi load component
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log('Vị trí nhận được:', lat, lng);
          setLatitude(lat);
          setLongitude(lng);
          // Tự động lấy địa chỉ và dịch nếu cần
          const addr = await fetchAddress(lat, lng);
          console.log('Địa chỉ nhận được:', addr);
          setAddress(addr);
        },
        (error) => {
          console.error('Lỗi lấy vị trí:', error);
          alert('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí để sử dụng chức năng này.');
        }
      );
    } else {
      alert('Trình duyệt không hỗ trợ Geolocation');
    }
  }, []);

  const handleGenerateCode = async () => {
    try {
      const res = await generateCode(userId, codeType);
      console.log('Phản hồi tạo mã:', res.data);
      setGeneratedCode(res.data);
      alert(`Mã ${codeType}: ${res.data}`);
    } catch (error) {
      console.error('Lỗi tạo mã:', error);
      alert('Tạo mã thất bại');
    }
  };

  const handleCheck = async () => {
    try {
      console.log('Trước khi check:', { userId, codeType, code, latitude, longitude, address });
      if (!code) {
        alert('Vui lòng nhập mã bạn nhận được để check-in/check-out');
        return;
      }

      if (!latitude || !longitude) {
        alert('Không có thông tin vị trí. Vui lòng cho phép truy cập vị trí và thử lại.');
        return;
      }

      // Sử dụng địa chỉ đã được dịch sang tiếng Anh và loại bỏ dấu
      const finalAddress = address; // Đã được xử lý trong fetchAddress

      if (codeType === 'CHECK_IN') {
        await checkIn(userId, code, latitude, longitude, finalAddress);
        alert('Check-in thành công');
      } else {
        await checkOut(userId, code, latitude, longitude, finalAddress);
        alert('Check-out thành công');
      }

      // Reset các trường sau khi check thành công
      setCode('');
      setAddress('');
    } catch (error) {
      console.error('Lỗi khi check:', error);
      if (error.response && error.response.data) {
        alert(`Thao tác thất bại: ${error.response.data}`);
      } else {
        alert('Thao tác thất bại. Kiểm tra mã hoặc thông tin GPS.');
      }
    }
  };

  const handleGetHistory = async () => {
    if (!startDate || !endDate) {
      alert('Vui lòng chọn thời gian bắt đầu và kết thúc');
      return;
    }
    try {
      const res = await getAttendanceHistory(userId, startDate, endDate);
      console.log('Phản hồi lịch sử:', res.data);
      setHistory(res.data);
    } catch (error) {
      console.error('Lỗi lấy lịch sử:', error);
      alert('Lấy lịch sử thất bại');
    }
  };

  const handleGetSummary = async () => {
    if (!startDate || !endDate) {
      alert('Vui lòng chọn thời gian bắt đầu và kết thúc');
      return;
    }
    try {
      const res = await getUserSummary(userId, startDate, endDate);
      console.log('Phản hồi thống kê:', res.data);
      setSummary(res.data);
    } catch (error) {
      console.error('Lỗi lấy thống kê:', error);
      alert('Lấy thống kê thất bại');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Quản Lý Chấm Công</h1>

      <div className={styles.section}>
        <label>User ID: </label>
        <input value={userId} readOnly className={styles.readOnlyInput} />
      </div>

      <div className={styles.section}>
        <h2>Tạo Mã Check-In/Check-Out</h2>
        <select value={codeType} onChange={(e) => setCodeType(e.target.value)}>
          <option value="CHECK_IN">Check In</option>
          <option value="CHECK_OUT">Check Out</option>
        </select>
        <button onClick={handleGenerateCode}>Tạo Mã</button>
        {generatedCode && <p>Mã được tạo: {generatedCode}</p>}
      </div>

      <div className={styles.section}>
        <h2>Thực Hiện Check-In/Check-Out</h2>
        <input
          placeholder="Mã nhận được"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {/* Hiển thị thông tin vị trí để gỡ rối */}
        <p>Latitude: {latitude}</p>
        <p>Longitude: {longitude}</p>
        <p>Địa chỉ: {address}</p>
        <button onClick={handleCheck}>Xác Nhận</button>
        <p>(Vị trí và địa chỉ được lấy tự động, địa chỉ đã được chuyển đổi thành không dấu và bằng tiếng Anh)</p>
      </div>

      <div className={styles.section}>
        <h2>Xem Lịch Sử Chấm Công</h2>
        <div>
          <label>Từ ngày: </label>
          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <label>Đến ngày: </label>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={handleGetHistory}>Lấy Lịch Sử</button>
        {history.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Giờ làm</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{h.id}</td>
                  <td>{h.checkInTime}</td>
                  <td>{h.checkOutTime}</td>
                  <td>{h.workingHours}</td>
                  <td>{h.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.section}>
        <h2>Thống Kê Cá Nhân</h2>
        <button onClick={handleGetSummary}>Lấy Thống Kê</button>
        {summary && (
          <div className={styles.summary}>
            <p>Tổng số ngày: {summary.totalDays}</p>
            <p>Số ngày đi làm: {summary.presentDays}</p>
            <p>Số ngày đi muộn: {summary.lateDays}</p>
            <p>Số ngày vắng: {summary.absentDays}</p>
            <p>Giờ làm tổng: {summary.totalWorkingHours}</p>
            <p>Giờ làm trung bình: {summary.averageWorkingHours}</p>
            <p>Số ngày làm thêm: {summary.overtimeDays}</p>
            <p>Số ngày nghỉ phép: {summary.leaveDays}</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Attendance;
