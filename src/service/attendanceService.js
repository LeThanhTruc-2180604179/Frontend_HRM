// src/service/attendanceService.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Tạo code check-in hoặc check-out
export const generateCode = (userId, type) => {
  return axios.post(`${API_URL}/attendance/generate-code`, null, {
    params: { userId, type }
  });
};

// Check-in
export const checkIn = (userId, code, latitude, longitude, address) => {
  console.log('Calling checkIn with:', { userId, code, latitude, longitude, address });
  return axios.post(`${API_URL}/attendance/check-in`, null, {
    params: { userId, code, latitude, longitude, address }
  });
};

// Check-out
export const checkOut = (userId, code, latitude, longitude, address) => {
  console.log('Calling checkOut with:', { userId, code, latitude, longitude, address });
  return axios.post(`${API_URL}/attendance/check-out`, null, {
    params: { userId, code, latitude, longitude, address }
  });
};

// Lấy lịch sử chấm công
export const getAttendanceHistory = (userId, startDate, endDate, page = 0, size = 10) => {
  console.log('getAttendanceHistory params:', { userId, startDate, endDate, page, size });
  return axios.get(`${API_URL}/attendance/history`, {
    params: { userId, startDate, endDate, page, size }
  });
};

// Lấy thống kê cá nhân
export const getUserSummary = (userId, startDate, endDate) => {
  console.log('getUserSummary params:', { userId, startDate, endDate });
  return axios.get(`${API_URL}/attendance/summary`, {
    params: { userId, startDate, endDate }
  });
};
