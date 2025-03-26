// src/service/managerService.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const getDepartmentStats = (departmentId, startDate, endDate) => {
  return axios.get(`${API_URL}/attendance/manager/department/stats`, {
    params: { departmentId, startDate, endDate }
  });
};

export const getUsersStats = (departmentId, startDate, endDate) => {
  return axios.get(`${API_URL}/attendance/manager/users/stats`, {
    params: { departmentId, startDate, endDate }
  });
};

export const getOvertimeStats = (departmentId, startDate, endDate) => {
  return axios.get(`${API_URL}/attendance/manager/overtime/stats`, {
    params: { departmentId, startDate, endDate }
  });
};

export const exportAttendanceReport = (departmentId, startDate, endDate) => {
  return axios.get(`${API_URL}/attendance/manager/export`, {
    params: { departmentId, startDate, endDate },
    responseType: 'blob' // Để xử lý tệp Excel
  });
};

// Các chức năng quản lý khác tương tự...
