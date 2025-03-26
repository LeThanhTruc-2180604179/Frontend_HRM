// Content.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FaVideo, // Đã thêm FaVideo
  FaBriefcase,
  FaClipboardCheck,
  FaFileAlt,
  FaSearch,
  FaFilter,
} from 'react-icons/fa';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import styles from './Content.module.css';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export default function Content() {
  // State variables
  const [meetings, setMeetings] = useState([]);
  const [meetingCount, setMeetingCount] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [positions, setPositions] = useState([]);
  const [positionCount, setPositionCount] = useState(0);
  const [evaluations, setEvaluations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const evaluationsPerPage = 10;
  const [currentDate, setCurrentDate] = useState('');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  // Pie chart state
  const [completedCount, setCompletedCount] = useState(0);
  const [notCompletedCount, setNotCompletedCount] = useState(0);

  // Classification chart state
  const [daDatCount, setDaDatCount] = useState(0);
  const [khaCount, setKhaCount] = useState(0);
  const [khongDatCount, setKhongDatCount] = useState(0);

  // Fetch data on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');

    if (userId) {
      fetchUserInfo(userId);
      fetchEvaluations(userId);
      fetchMeetings(userId);
    }
    fetchDepartments();
    fetchPositions();

    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('vi-VN', options));
  }, []);

  // Fetch user info
  const fetchUserInfo = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/user/profile?id=${userId}`);
      setUserName(response.data.name);

      const imageResponse = await axios.get(`http://localhost:8080/api/user/${userId}/image`);
      setUserAvatar(imageResponse.data ? `data:image/jpeg;base64,${imageResponse.data}` : '');
    } catch (error) {
      console.error('Error fetching user info or avatar:', error);
    }
  };

  // Fetch meetings
  const fetchMeetings = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/meetings/list/${userId}`);
      setMeetings(response.data);
      setMeetingCount(response.data.length);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setMeetings([]);
        setMeetingCount(0);
      } else {
        console.error('Error fetching meetings:', error);
      }
    }
  };

  // Fetch departments (evaluation periods)
  const fetchDepartments = async () => {
    try {
      const evaluationsResponse = await axios.get('http://localhost:8080/api/evaluate/list');
      const allEvaluations = evaluationsResponse.data;

      setDepartments(allEvaluations);
      setDepartmentCount(allEvaluations.length);
    } catch (error) {
      console.error('Error fetching evaluation periods:', error);
    }
  };

  // Fetch positions
  const fetchPositions = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/position/list');
      setPositions(response.data);
      setPositionCount(response.data.length);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  // Fetch evaluations and scores
  const fetchEvaluations = async (userId) => {
    try {
      const evaluationsResponse = await axios.get('http://localhost:8080/api/evaluate/list');
      const allEvaluations = evaluationsResponse.data;

      const userEvaluationsResponse = await axios.get(
        'http://localhost:8080/api/userEvaluate/listUserEvaluates',
        {
          params: { userId },
        }
      );
      const userEvaluations = userEvaluationsResponse.data;

      const userEvaluationMap = {};
      userEvaluations.forEach((evaluation) => {
        userEvaluationMap[evaluation.evaluate.id] = evaluation;
      });

      const combinedEvaluations = await Promise.all(
        allEvaluations.map(async (evaluation) => {
          const userEvaluation = userEvaluationMap[evaluation.id] || {};

          // User's score
          const userScoreResponse = await axios.get(
            'http://localhost:8080/api/userEvaluate/calculateTotalScore',
            {
              params: { userId, evaluateId: evaluation.id },
            }
          );
          const totalScoreUser = userScoreResponse.data || 0;

          // Manager's score
          const managerScoreResponse = await axios.get(
            'http://localhost:8080/api/userEvaluate/calculateTotalScoreManager',
            {
              params: { userId, evaluateId: evaluation.id },
            }
          );
          const totalScoreManager = managerScoreResponse.data || 0;

          // Classification
          let totalScore = null;
          let classification = 'Chưa chấm';

          if (totalScoreManager > 0) {
            totalScore = totalScoreManager;
            if (totalScore > 80) {
              classification = 'Đạt';
            } else if (totalScore >= 50) {
              classification = 'Khá';
            } else {
              classification = 'Không đạt';
            }
          }

          return {
            evaluateId: evaluation.id,
            evaluateName: evaluation.name,
            totalScoreUser,
            totalScoreManager,
            totalScore,
            classification,
          };
        })
      );

      // Sort evaluations by classification
      combinedEvaluations.sort((a, b) => {
        const order = { 'Đạt': 1, 'Khá': 2, 'Không đạt': 3, 'Chưa chấm': 4 };
        return order[a.classification] - order[b.classification];
      });

      setEvaluations(combinedEvaluations);

      // Pie chart data
      const completed = combinedEvaluations.filter(
        (evaluation) => evaluation.totalScore !== null
      ).length;
      const notCompleted = combinedEvaluations.length - completed;

      setCompletedCount(completed);
      setNotCompletedCount(notCompleted);

      // Classification counts
      const daDat = combinedEvaluations.filter(e => e.classification === 'Đạt').length;
      const kha = combinedEvaluations.filter(e => e.classification === 'Khá').length;
      const khongDat = combinedEvaluations.filter(e => e.classification === 'Không đạt').length;

      setDaDatCount(daDat);
      setKhaCount(kha);
      setKhongDatCount(khongDat);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle filter option change
  const handleFilterChange = (e) => {
    setFilterOption(e.target.value);
    setCurrentPage(1);
  };

  // Filter and paginate evaluations
  const filteredEvaluations = evaluations.filter((evaluation) => {
    const nameMatches = evaluation.evaluateName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    let filterMatches = true;

    if (filterOption !== 'all') {
      filterMatches = evaluation.classification === filterOption;
    }

    return nameMatches && filterMatches;
  });

  const totalPages = Math.ceil(filteredEvaluations.length / evaluationsPerPage);

  const indexOfLastEvaluation = currentPage * evaluationsPerPage;
  const indexOfFirstEvaluation = indexOfLastEvaluation - evaluationsPerPage;
  const currentEvaluations = filteredEvaluations.slice(
    indexOfFirstEvaluation,
    indexOfLastEvaluation
  );

  // Pie chart data - Progress
  const pieDataProgress = {
    labels: ['Đã hoàn thành', 'Chưa hoàn thành'],
    datasets: [
      {
        data: [completedCount, notCompletedCount],
        backgroundColor: ['#2DD4BF', '#8C62FF'],
        hoverBackgroundColor: ['#2DD4BF', '#8C62FF'],
      },
    ],
  };

  // Pie chart data - Classification
  const pieDataClassification = {
    labels: ['Đạt', 'Khá', 'Không đạt'],
    datasets: [
      {
        data: [daDatCount, khaCount, khongDatCount],
        backgroundColor: ['#5cb85c', '#f0ad4e', '#d9534f'],
        hoverBackgroundColor: ['#66bb6a', '#f7b924', '#e57373'],
      },
    ],
  };

  // Pie chart options
  const pieOptions = {
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        formatter: (value, context) => {
          const dataset = context.chart.data.datasets[0].data;
          const total = dataset.reduce((a, b) => a + b, 0);
          const percentage = total ? ((value / total) * 100).toFixed(1) + '%' : '0%';
          return percentage;
        },
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14,
        },
      },
    },
  };

  return (
    <div className={styles['dashboard-container']}>
      {/* Welcome Section */}
      <div className={styles['welcome-header']}>
        <div className={styles['welcome-content']}>
          <img
            src={userAvatar || 'https://via.placeholder.com/64'}
            alt="User Avatar"
            className={styles['user-avatar']}
          />
          <span className={styles['welcome-text']}>Chào mừng {userName}</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className={styles['horizontal-card-container']}>
        <div className={styles['meeting-count-card']}>
          <div className={styles['card-content']}>
            <span>Cuộc họp</span>
            <h2>{meetingCount}</h2>
          </div>
          <div className={styles['icon-container']}>
            <FaVideo /> {/* Thay thế FaUsers bằng FaVideo */}
          </div>
        </div>
        <div className={styles['department-count-card']}>
          <div className={styles['card-content']}>
            <span>Kỳ đánh giá</span>
            <h2>{departmentCount}</h2>
          </div>
          <div className={styles['icon-container']}>
            <FaClipboardCheck />
          </div>
        </div>
        <div className={styles['position-count-card']}>
          <div className={styles['card-content']}>
            <span>Chức vụ</span>
            <h2>{positionCount}</h2>
          </div>
          <div className={styles['icon-container']}>
            <FaBriefcase />
          </div>
        </div>
        <div className={styles['evaluation-count-card']}>
          <div className={styles['card-content']}>
            <span>Đánh giá</span>
            <h2>{evaluations.length}</h2>
          </div>
          <div className={styles['icon-container']}>
            <FaFileAlt />
          </div>
        </div>
      </div>

      {/* Main Content: Left and Right Sections */}
      <div className={styles['main-content']}>
        {/* Left Section: Progress and Classification Cards */}
        <div className={styles['left-section']}>
          {/* Progress Card */}
          <div className={styles['progress-card']}>
            <div className={styles['progress-header']}>
              <div className={styles['progress-title']}>
                <h2 className={styles['progress-heading']}>Tiến độ</h2>
                <p className={styles['progress-date']}>
                  Tính đến thời điểm hiện tại {currentDate}.
                </p>
              </div>
            </div>

            <div className={styles['chart-container']}>
              <Pie data={pieDataProgress} options={pieOptions} />
            </div>

            <div className={styles['legend']}>
              <div className={styles['legend-item']}>
                <span className={styles['legend-color']} style={{ backgroundColor: '#2DD4BF' }}></span>
                <span>Đã hoàn thành</span>
              </div>
              <div className={styles['legend-item']}>
                <span className={styles['legend-color']} style={{ backgroundColor: '#8C62FF' }}></span>
                <span>Chưa hoàn thành</span>
              </div>
            </div>
          </div>

          {/* Classification Card */}
          <div className={styles['classification-card']}>
            <div className={styles['classification-header']}>
              <div className={styles['classification-title']}>
                <h2 className={styles['classification-heading']}>Phân loại</h2>
                <p className={styles['classification-date']}>
                  Tính đến thời điểm hiện tại {currentDate}.
                </p>
              </div>
            </div>

            <div className={styles['chart-container']}>
              <Pie data={pieDataClassification} options={pieOptions} />
            </div>

            <div className={styles['legend']}>
              <div className={styles['legend-item']}>
                <span className={styles['legend-color']} style={{ backgroundColor: '#5cb85c' }}></span>
                <span>Đạt</span>
              </div>
              <div className={styles['legend-item']}>
                <span className={styles['legend-color']} style={{ backgroundColor: '#f0ad4e' }}></span>
                <span>Khá</span>
              </div>
              <div className={styles['legend-item']}>
                <span className={styles['legend-color']} style={{ backgroundColor: '#d9534f' }}></span>
                <span>Không đạt</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Evaluation List Card */}
        <div className={styles['evaluation-section']}>
          <div className={styles['evaluation-card']}>
            {/* Evaluation Header */}
            <div className={styles['evaluation-header']}>
              <div className={styles['header-title']}>
                <h2 className={styles['welcome-text']}>Danh sách kỳ đánh giá</h2>
                <p className={styles['date-text']}>{currentDate}</p>
              </div>
            </div>

            {/* Classification Metrics */}
            <div className={styles['metrics-container']}>
              <div className={styles['metric-card']}>
                <div className={styles['metric-label']}>Đã đạt</div>
                <div className={styles['metric-value']}>{daDatCount}</div>
              </div>
              <div className={styles['metric-card']}>
                <div className={styles['metric-label']}>Chưa đạt</div>
                <div className={styles['metric-value']}>{khongDatCount}</div>
              </div>
              <div className={styles['metric-card']}>
                <div className={styles['metric-label']}>Khá</div>
                <div className={styles['metric-value']}>{khaCount}</div>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className={styles['search-filter-container']}>
              <div className={styles['search-bar']}>
                <FaSearch className={styles['search-icon']} />
                <input
                  type="text"
                  placeholder="Tìm kiếm kỳ đánh giá..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  aria-label="Search Evaluations"
                  className={styles['search-input']}
                />
              </div>

              <div className={styles['filter-dropdown']}>
                <FaFilter className={styles['filter-icon']} />
                <select
                  value={filterOption}
                  onChange={handleFilterChange}
                  aria-label="Filter Evaluations"
                  className={styles['filter-select']}
                >
                  <option value="all">Tất cả</option>
                  <option value="Đạt">Đạt</option>
                  <option value="Khá">Khá</option>
                  <option value="Không đạt">Không đạt</option>
                  <option value="Chưa chấm">Chưa chấm</option>
                </select>
              </div>
            </div>

            {/* Evaluation Table */}
            <div className={styles['evaluation-table']} role="table">
              {/* Table Header */}
              <div className={styles['table-header']} role="row">
                <div className={styles['table-cell']} role="columnheader">STT</div>
                <div className={styles['table-cell']} role="columnheader">Tên kỳ đánh giá</div>
                <div className={styles['table-cell']} role="columnheader">Tổng kết</div>
                <div className={styles['table-cell']} role="columnheader">Phân loại</div>
              </div>

              {/* Table Rows */}
              {currentEvaluations.map((evaluation, index) => (
                <div className={styles['table-row']} role="row" key={evaluation.evaluateId}>
                  <div className={styles['table-cell']} role="cell">
                    {indexOfFirstEvaluation + index + 1}
                  </div>
                  <div className={styles['table-cell']} role="cell">
                    {evaluation.evaluateName}
                  </div>
                  <div className={styles['table-cell']} role="cell" style={{ textAlign: 'center' }}>
                    {evaluation.totalScore !== null ? evaluation.totalScore : '_'}
                  </div>
                  <div className={styles['table-cell']} role="cell">
                    <span
                      className={styles['status']}
                      style={{
                        backgroundColor:
                          evaluation.classification === 'Đạt'
                            ? '#5cb85c'
                            : evaluation.classification === 'Khá'
                            ? '#f0ad4e'
                            : evaluation.classification === 'Không đạt'
                            ? '#d9534f'
                            : '#6c757d',
                      }}
                    >
                      {evaluation.classification}
                    </span>
                  </div>
                </div>
              ))}

              {/* No Data */}
              {filteredEvaluations.length === 0 && (
                <div className={styles['table-row']} role="row">
                  <div className={styles['table-cell']} role="cell" colSpan="4" style={{ textAlign: 'center' }}>
                    Không có dữ liệu.
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className={styles['pagination']}>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`${styles['pageButton']} ${
                    currentPage === index + 1 ? styles['activePage'] : ''
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Removed Bottom Row */}
    </div>
  );
}
