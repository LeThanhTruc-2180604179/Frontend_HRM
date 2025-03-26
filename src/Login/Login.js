import React, { useState, useEffect } from 'react';
import styles from './Login.module.css';

const Login = ({ onLoginClick }) => {
  const [textIndex, setTextIndex] = useState(0);

  const textArray = [
    'Chào mừng bạn đến với hệ thống!',
    'Quản lý nhân sự hiệu quả, đơn giản.',
    'Chúng tôi ở đây để hỗ trợ bạn.',
    'Đăng nhập để bắt đầu trải nghiệm!',
  ];

  const featureImages = [
    'https://img.upanh.tv/2024/11/17/Hosonhanvien.png',
    'https://img.upanh.tv/2024/11/17/contractmaagement_FRT3vlExv.webp',
    'https://img.upanh.tv/2024/11/17/Importance-of-Monitoring-Employee-Performance.png',
    'https://img.upanh.tv/2024/11/17/pngtree-business-analysis-concept-people-in-the-desk-meeting-table-and-presentation-png-image_7303112.png',
  ];

  const featureTitles = [
    'Quản lý hồ sơ nhân viên',
    'Quản lý hợp đồng',
    'Theo dõi hiệu suất công việc',
    'Quản lý đào tạo và phát triển'
  ];

  const featureDescriptions = [
    'Lưu trữ và quản lý toàn bộ thông tin của nhân viên từ khi bắt đầu làm việc, bao gồm các chi tiết cá nhân, kỹ năng và hồ sơ công tác.',
    'Theo dõi và quản lý tất cả các hợp đồng nhân sự, từ hợp đồng lao động đến các loại hợp đồng bổ sung, đảm bảo tính minh bạch và đúng quy định.',
    'Đánh giá hiệu quả làm việc của nhân viên thông qua các chỉ số KPIs và báo cáo hiệu suất, giúp nâng cao năng suất lao động.',
    'Xây dựng các chương trình đào tạo và phát triển kỹ năng, hỗ trợ nhân viên nâng cao năng lực và chuẩn bị cho cơ hội thăng tiến.'
  ];

  const advantageImages = [
    'https://img.upanh.tv/2024/11/17/hinh-thien-nhien-3d-002.jpg',
    'https://example.com/images/advantage2.jpg',
    'https://example.com/images/advantage3.jpg',
    'https://example.com/images/advantage4.jpg',
    'https://example.com/images/advantage5.jpg',
    'https://example.com/images/advantage6.jpg',
  ];

  const largeAdvantageVideo = '/videos/a334.mp4'; // Đường dẫn video thay thế cho largeAdvantageImage

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prevIndex) => (prevIndex + 1) % textArray.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <div className={styles.logo}>COMPANY</div>
        <div className={styles.menu}>
          <a href="/">Home</a>
          <a href="/our-cases">Our Cases</a>
          <a href="/blog">Blog</a>
          <a href="/news">News</a>
          <a href="/contact">Contact</a>
          <a onClick={onLoginClick} className={styles.loginLink}>Đăng nhập</a>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.intro}>
          <h1>QUẢN LÝ NHÂN SỰ</h1>
          <h2>{textArray[textIndex]}</h2>
          <p>Chào mừng đến với hệ thống quản lý nhân sự chuyên nghiệp, nơi bạn có thể dễ dàng quản lý thông tin nhân viên, theo dõi hiệu suất và phát triển nguồn nhân lực hiệu quả.</p>
          <button className={styles.loginButtonStage1}>Next</button>
        </div>
        <div className={styles.videoSection}>
          <video autoPlay muted loop className={styles.videoBackground}>
           <source src="/videos/a3.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
      <h2>HỖ TRỢ CÔNG VIỆC ĐA DẠNG</h2>
      <div className={styles.content}>
        <div className={styles.features}>
          {featureImages.map((imgSrc, index) => (
            <div key={index} className={styles.feature}>
              <div className={styles.imagePlaceholder} style={{ backgroundImage: `url(${imgSrc})` }}></div>
              <h3>{featureTitles[index]}</h3>
              <p>{featureDescriptions[index]}</p>
            </div>
          ))}
        </div>
       
      </div>
    </div>
  );
};

export default Login;
