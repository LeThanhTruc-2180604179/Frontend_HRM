import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './Calender.module.css';

const API_TIME_EVALUATE_ROLE_URL = 'http://localhost:8080/api/timeEvaluateRole';
const API_ACTIVITIES_URL = 'http://localhost:8080/api/activities';
const API_MEETINGS_URL = 'http://localhost:8080/api/meetings/list';

const ScheduleCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRoles, setTimeRoles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Đặt mặc định `view` là 'Lịch Cuộc Họp'
  const [view, setView] = useState('Lịch Cuộc Họp'); 
  const [selectedMeeting, setSelectedMeeting] = useState(null); // Cuộc họp được chọn để highlight

  const colors = ['primary', 'success', 'warning', 'danger', 'info', 'dark'];
  const [colorMap, setColorMap] = useState({});
  const role = localStorage.getItem('role'); 

  const weekViewRef = useRef(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentDate, role]);

  useEffect(() => {
    if (view === 'Lịch Cuộc Họp' && weekViewRef.current) {
      scrollToCurrentTime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, meetings]);

  useEffect(() => {
    if (selectedMeeting && view === 'Lịch Cuộc Họp' && weekViewRef.current) {
      scrollToSelectedMeeting(selectedMeeting);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMeeting, currentDate, meetings]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (view === 'Kỳ Đánh Giá') {
        const response = await axios.get(`${API_TIME_EVALUATE_ROLE_URL}/list`);
        const data = response.data;
        let filteredRoles = [];
        if (role === 'EMPLOYEE') {
          filteredRoles = data.filter((timeRole) => timeRole.role.name.toUpperCase() === 'EMPLOYEE');
        } else if (role === 'MANAGER' || role === 'ADMIN') {
          filteredRoles = data.filter((timeRole) => timeRole.role.name.toUpperCase() === 'MANAGER');
        }

        if (filteredRoles.length > 0) {
          const times = filteredRoles.map((timeRole) => ({
            id: timeRole.evaluate.id,
            name: timeRole.evaluate.name,
            startDay: timeRole.startDay ? new Date(timeRole.startDay) : null,
            endDay: timeRole.endDay ? new Date(timeRole.endDay) : null,
          }));

          const newColorMap = {};
          let colorIndex = 0;
          times.forEach((time) => {
            if (!newColorMap[time.name]) {
              newColorMap[time.name] = colors[colorIndex % colors.length];
              colorIndex++;
            }
          });
          setColorMap(newColorMap);
          setTimeRoles(times);
        } else {
          if (role === 'EMPLOYEE') {
            setError('Không tìm thấy thời gian cho EMPLOYEE.');
          } else if (role === 'MANAGER' || role === 'ADMIN') {
            setError('Không tìm thấy thời gian cho MANAGER.');
          }
          setTimeRoles([]);
        }
        setActivities([]);
        setMeetings([]);
        setSelectedMeeting(null);
      } else if (view === 'Kỳ Hoạt Động') {
        const response = await axios.get(API_ACTIVITIES_URL);
        const data = response.data;
        if (data.length > 0) {
          const activityData = data.map((activity) => ({
            id: activity.id,
            name: activity.activityName,
            startDay: activity.startDate ? new Date(activity.startDate) : null,
            endDay: activity.endDate ? new Date(activity.endDate) : null,
          }));

          const newColorMap = {};
          let colorIndex = 0;
          activityData.forEach((activity) => {
            if (!newColorMap[activity.name]) {
              newColorMap[activity.name] = colors[colorIndex % colors.length];
              colorIndex++;
            }
          });
          setColorMap(newColorMap);
          setActivities(activityData);
        } else {
          setError('Không có hoạt động nào.');
          setActivities([]);
        }
        setTimeRoles([]);
        setMeetings([]);
        setSelectedMeeting(null);
      } else if (view === 'Lịch Cuộc Họp') {
        const userId = localStorage.getItem('userId'); 
        if (!userId) {
          setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
          setMeetings([]);
          setSelectedMeeting(null);
        } else {
          const response = await axios.get(`${API_MEETINGS_URL}/${userId}`);
          const data = response.data;
          if (data.length > 0) {
            const meetingData = data.map((meeting) => ({
              id: meeting.id,
              name: meeting.meetingName,
              startDay: meeting.startTime ? new Date(meeting.startTime) : null,
              endDay: meeting.endTime ? new Date(meeting.endTime) : null,
            }));

            const newColorMap = {};
            let colorIndex = 0;
            meetingData.forEach((meeting) => {
              if (!newColorMap[meeting.name]) {
                newColorMap[meeting.name] = colors[colorIndex % colors.length];
                colorIndex++;
              }
            });

            setColorMap(newColorMap);
            setMeetings(meetingData);
          } else {
            setError('Không có cuộc họp nào.');
            setMeetings([]);
          }
          setTimeRoles([]);
          setActivities([]);
          setSelectedMeeting(null);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu.');
      setSelectedMeeting(null);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    let startingDay = firstDay.getDay();
    const monthLength = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let week = [];
    let day = 1;
    for (let i = 0; i < startingDay; i++) {
      week.push(null);
    }

    while (day <= monthLength) {
      for (let i = startingDay; i < 7; i++) {
        if (day > monthLength) {
          week.push(null);
        } else {
          week.push(new Date(year, month, day));
          day++;
        }
      }
      weeks.push(week);
      week = [];
      startingDay = 0;
    }
    return weeks;
  };

  const checkDateStatus = (date) => {
    const statuses = [];
    if (view === 'Kỳ Đánh Giá') {
      timeRoles.forEach((time) => {
        if (time.startDay && date.toDateString() === time.startDay.toDateString()) {
          statuses.push({ status: 'start', name: time.name });
        }
        if (time.endDay && date.toDateString() === time.endDay.toDateString()) {
          statuses.push({ status: 'end', name: time.name });
        }
      });
    } else if (view === 'Kỳ Hoạt Động') {
      activities.forEach((activity) => {
        if (activity.startDay && date.toDateString() === activity.startDay.toDateString()) {
          statuses.push({ status: 'start', name: activity.name });
        }
        if (activity.endDay && date.toDateString() === activity.endDay.toDateString()) {
          statuses.push({ status: 'end', name: activity.name });
        }
      });
    } else if (view === 'Lịch Cuộc Họp') {
      meetings.forEach((meeting) => {
        if (meeting.startDay && date.toDateString() === meeting.startDay.toDateString()) {
          statuses.push({ status: 'start', name: meeting.name });
        }
        if (meeting.endDay && date.toDateString() === meeting.endDay.toDateString()) {
          statuses.push({ status: 'end', name: meeting.name });
        }
      });
    }
    return statuses;
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const title = `${monthNames[month]} ${year}`;
  const weeks = generateCalendar();
  const today = new Date();

  // Mảng giờ
  const hours = [];
  for (let h = 0; h < 24; h++) {
    hours.push(h);
  }

  const weekDays = getWeekDates(currentDate);
  const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const getMeetingsForSlot = (day, hour) => {
    return meetings.filter(meeting => {
      if (!meeting.startDay || !meeting.endDay) return false;
      const isSameDay =
        meeting.startDay.getFullYear() === day.getFullYear() &&
        meeting.startDay.getMonth() === day.getMonth() &&
        meeting.startDay.getDate() === day.getDate();
      if (!isSameDay) return false;
  
      const meetingStartHour = meeting.startDay.getHours();
      // Chỉ so sánh đúng giờ bắt đầu mà không "nhảy" sang giờ tiếp theo
      return meetingStartHour === hour;
    });
  };
  

  const hourHeight = 60; // Chiều cao mỗi giờ
  const weekHeaderHeight = 50; // Chiều cao thanh header "Tuần của ..."
  const tableHeaderHeight = 60; // Chiều cao hàng thead của bảng tuần (tính ngày)
  const totalHeaderOffset = weekHeaderHeight + tableHeaderHeight; // 110px
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const currentLineTop = nowHour * hourHeight + totalHeaderOffset;

  const weekViewClass = view === 'Lịch Cuộc Họp' ? styles.meetingView : '';

  // Function to scroll to current time
  const scrollToCurrentTime = () => {
    if (weekViewRef.current) {
      const container = weekViewRef.current;
      const scrollPosition = currentLineTop - (2 * hourHeight);
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }
  };

  // Tính hôm nay và ngày mai
  let todayMeetings = [];
  let tomorrowMeetings = [];
  if (view === 'Lịch Cuộc Họp') {
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23,59,59,999);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23,59,59,999);

    todayMeetings = meetings.filter(m => m.startDay >= todayStart && m.startDay <= todayEnd);
    tomorrowMeetings = meetings.filter(m => m.startDay >= tomorrowStart && m.startDay <= tomorrowEnd);

    todayMeetings.sort((a,b)=>a.startDay - b.startDay);
    tomorrowMeetings.sort((a,b)=>a.startDay - b.startDay);
  }

  const goToMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    const mDay = new Date(meeting.startDay);
    const meetingWeekStart = new Date(mDay.getFullYear(), mDay.getMonth(), mDay.getDate() - mDay.getDay());
    const currentWeekStart = new Date(weekDays[0].getFullYear(), weekDays[0].getMonth(), weekDays[0].getDate());
    if (meetingWeekStart.toDateString() !== currentWeekStart.toDateString()) {
      setCurrentDate(mDay); 
    } else {
      scrollToSelectedMeeting(meeting);
    }
  };

  const scrollToSelectedMeeting = (meeting) => {
    if (weekViewRef.current && meeting.startDay) {
      const container = weekViewRef.current;
      const meetingHour = meeting.startDay.getHours();
      const meetingMinute = meeting.startDay.getMinutes();
      const scrollPosition = (meetingHour + meetingMinute / 60) * hourHeight + totalHeaderOffset - (2 * hourHeight); 
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }
  };

  let selectedMeetingLineTop = null;
  let selectedMeetingColor = '#000';
  if (selectedMeeting) {
    const startHH = selectedMeeting.startDay.getHours();
    const startMM = selectedMeeting.startDay.getMinutes();
    selectedMeetingLineTop = (startHH + startMM / 60) * hourHeight + totalHeaderOffset;

    const bgMap = {
      primary: '#a8d8ff', 
      success: '#b2f2b4',
      warning: '#ffeab2',
      danger: '#ffb2b2',
      info: '#b2efff',
      dark: '#cccccc'
    };
    selectedMeetingColor = bgMap[colorMap[selectedMeeting.name] || 'dark'];
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Chọn xem lịch</div>
        <div className={styles.sidebarGroup}>
          <div className={styles.sidebarGroupTitle}>Loại lịch</div>
          
          <button 
            className={`${styles.sidebarButton} ${view === 'Lịch Cuộc Họp' ? styles.active : ''}`}
            onClick={() => {setView('Lịch Cuộc Họp'); setSelectedMeeting(null);}}
          >
            <span>📆</span> Lịch Cuộc Họp
          </button>
          <button 
            className={`${styles.sidebarButton} ${view === 'Kỳ Đánh Giá' ? styles.active : ''}`}
            onClick={() => {setView('Kỳ Đánh Giá'); setSelectedMeeting(null);}}
          >
            <span>📅</span> Kỳ đánh giá
          </button>
          <button 
            className={`${styles.sidebarButton} ${view === 'Kỳ Hoạt Động' ? styles.active : ''}`}
            onClick={() => {setView('Kỳ Hoạt Động'); setSelectedMeeting(null);}}
          >
            <span>💼</span> Kỳ hoạt động
          </button>
        </div>

        {view === 'Lịch Cuộc Họp' && (
          <div className={styles.meetSchedules}>
            <div className={styles.meetScheduleBlock}>
              <div className={styles.meetScheduleTitle}>Lịch meet hôm nay</div>
              {todayMeetings.length > 0 ? (
                <ul className={styles.meetList}>
                  {todayMeetings.map((m) => {
                    const startHH = m.startDay.getHours();
                    const startMM = m.startDay.getMinutes();
                    const endHH = m.endDay.getHours();
                    const endMM = m.endDay.getMinutes();
                    const eventTime = `${startHH.toString().padStart(2,'0')}:${startMM.toString().padStart(2,'0')} - ${endHH.toString().padStart(2,'0')}:${endMM.toString().padStart(2,'0')}`;
                    return (
                      <li 
                        key={m.id} 
                        className={styles.meetItem} 
                        onClick={() => goToMeeting(m)}
                        title={m.name + ' ' + eventTime}
                      >
                        <span className={`${styles.meetDot} ${styles[colorMap[m.name] || 'dark']}`}></span>
                        <div className={styles.meetInfo}>
                          <div className={styles.meetName}>{m.name}</div>
                          <div className={styles.meetTime}>{eventTime}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={styles.noMeet}>
                  <div className={styles.noMeetIcon}>❓🔍</div>
                  <div>Không có lịch hôm nay</div>
                </div>
              )}
            </div>

            <div className={styles.meetScheduleBlock}>
              <div className={styles.meetScheduleTitle}>Lịch meet ngày mai</div>
              {tomorrowMeetings.length > 0 ? (
                <ul className={styles.meetList}>
                  {tomorrowMeetings.map((m) => {
                    const startHH = m.startDay.getHours();
                    const startMM = m.startDay.getMinutes();
                    const endHH = m.endDay.getHours();
                    const endMM = m.endDay.getMinutes();
                    const eventTime = `${startHH.toString().padStart(2,'0')}:${startMM.toString().padStart(2,'0')} - ${endHH.toString().padStart(2,'0')}:${endMM.toString().padStart(2,'0')}`;
                    return (
                      <li 
                        key={m.id} 
                        className={styles.meetItem}
                        onClick={() => goToMeeting(m)}
                        title={m.name + ' ' + eventTime}
                      >
                        <span className={`${styles.meetDot} ${styles[colorMap[m.name] || 'dark']}`}></span>
                        <div className={styles.meetInfo}>
                          <div className={styles.meetName}>{m.name}</div>
                          <div className={styles.meetTime}>{eventTime}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={styles.noMeet}>
                  <div className={styles.noMeetIcon}>❓🔍</div>
                  <div>Không có lịch ngày mai</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.mainContent}>
        {view !== 'Lịch Cuộc Họp' && (
          <div className={styles.headerBar}>
            <button className={styles.navArrow} onClick={prevMonth}><FaChevronLeft/></button>
            <span className={styles.headerTitle}>{title}</span>
            <button className={styles.navArrow} onClick={nextMonth}><FaChevronRight/></button>
          </div>
        )}

        {view !== 'Lịch Cuộc Họp' && !loading && !error && (
          <table className={styles.calendarTable}>
            <thead className={styles.calendarHead}>
              <tr>
                {dayNames.map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className={styles.calendarBody}>
              {weeks.map((week, index) => (
                <tr key={index}>
                  {week.map((date, idx) => {
                    if (!date) return <td key={idx}></td>;
                    const statuses = checkDateStatus(date);
                    const isToday =
                      date.toDateString() === today.toDateString() &&
                      month === today.getMonth() &&
                      year === today.getFullYear();

                    let cellClass = '';
                    if (statuses.some(s => s.status === 'start')) cellClass = styles.eventStart;
                    if (statuses.some(s => s.status === 'end')) cellClass = styles.eventEnd;
                    if (isToday) cellClass = styles.today;

                    return (
                      <td key={idx} className={cellClass}>
                        <div className={styles.dateNumber}>{date.getDate()}</div>
                        {statuses.length > 0 && (
                          <div className={styles.eventsContainer}>
                            {statuses.map((status, sIdx) => (
                              <div className={styles.eventRow} key={sIdx}>
                                <div
                                  className={`${styles.eventName} ${styles[colorMap[status.name] || 'dark']}`}
                                  title={status.name}
                                >
                                  {status.name}
                                </div>
                                <div
                                  className={styles.eventStatus}
                                  title={status.status === 'start' ? 'Bắt đầu' : 'Kết thúc'}
                                >
                                  {status.status === 'start' ? 'Bắt đầu' : 'Kết thúc'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {loading && <div className={styles.loading}>Đang tải...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {view === 'Lịch Cuộc Họp' && !loading && !error && (
          <div className={`${styles.weekViewContainer} ${weekViewClass}`} ref={weekViewRef}>
            <div className={styles.weekHeader}>
              <button className={styles.navArrow} onClick={()=>{
                const d = new Date(currentDate);
                d.setDate(d.getDate() - 7);
                setCurrentDate(d);
              }}><FaChevronLeft /></button>
              <span className={styles.headerTitle}>
                Tuần của {weekDays[0].getDate()}/{weekDays[0].getMonth()+1} - {weekDays[6].getDate()}/{weekDays[6].getMonth()+1}/{weekDays[0].getFullYear()}
              </span>
              <button className={styles.navArrow} onClick={()=>{
                const d = new Date(currentDate);
                d.setDate(d.getDate() + 7);
                setCurrentDate(d);
              }}><FaChevronRight /></button>
            </div>

            {currentLineTop !== null && (
              <div 
                className={styles.currentTimeLine}
                style={{ top: currentLineTop }}
              >
                <div className={styles.currentTimeDot}></div>
              </div>
            )}

            {selectedMeeting && selectedMeetingLineTop !== null && (
              <div 
                className={styles.meetingHighlightLine}
                style={{ top: selectedMeetingLineTop, background: selectedMeetingColor }}
              >
                <div 
                  className={styles.meetingHighlightDot} 
                  style={{ background: selectedMeetingColor }}
                ></div>
              </div>
            )}

            <table className={styles.weekTable}>
              <thead>
                <tr>
                  <th></th>
                  {weekDays.map((day, idx) => (
                    <th key={idx}>
                      {weekdayNames[day.getDay()]}<br/>
                      {day.getDate()}/{day.getMonth()+1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((h, i) => (
                  <tr key={i}>
                    <td className={styles.timeCell}>{`${h}:00`}</td>
                    {weekDays.map((day, dIdx) => {
                      const slotMeetings = getMeetingsForSlot(day, h);
                      return (
                        <td key={dIdx} className={styles.dayCell}>
                          {slotMeetings.length > 0 && slotMeetings.map((m, mIdx) => {
                            const startHH = m.startDay.getHours();
                            const startMM = m.startDay.getMinutes();
                            const endHH = m.endDay.getHours();
                            const endMM = m.endDay.getMinutes();

                            const eventTitle = m.name;
                            const eventTime = `${startHH.toString().padStart(2,'0')}:${startMM.toString().padStart(2,'0')} - ${endHH.toString().padStart(2,'0')}:${endMM.toString().padStart(2,'0')}`;

                            return (
                              <div 
                                key={mIdx} 
                                className={`${styles.eventBlock} ${styles[colorMap[m.name] || 'dark']}`}
                                title={eventTitle + ' ' + eventTime}
                              >
                                <div className={styles.eventTitle}>{eventTitle}</div>
                                <div className={styles.eventTime}>{eventTime}</div>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCalendar;
