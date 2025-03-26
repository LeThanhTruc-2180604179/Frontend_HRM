import React, { useState, useEffect } from 'react';
import styles from './FileUpload.module.css';
import {
  FaWrench,
  FaFileAlt,
  FaSearch,
  FaCloudUploadAlt,
  FaCheckCircle,
} from 'react-icons/fa';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [userId, setUserId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmailData, setShareEmailData] = useState({
    fileName: '',
    toEmail: '',
    subject: '',
    body: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 5;
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    const fetchUserId = () => {
      const storedUserId = localStorage.getItem('userId');
      setUserId(storedUserId);
    };

    fetchUserId();
    if (userId) {
      fetchFilesList();
    }
  }, [userId]);

  const fetchFilesList = async () => {
    const response = await fetch(
      `http://localhost:8080/api/file/files/${userId}`
    );
    const data = await response.json();
    setFilesList(data);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setFile(event.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Vui lòng chọn file trước khi upload.');
      return;
    }
    if (!userId) {
      alert('Không thể xác định userId.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    await fetch('http://localhost:8080/api/file/upload', {
      method: 'POST',
      body: formData,
    });

    fetchFilesList();
    setFile(null);
    setShowUploadForm(false);
  };

  const handleDownload = async (fileName) => {
    const response = await fetch(
      `http://localhost:8080/api/file/download/${userId}/${fileName}`
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const handleDelete = async (fileName) => {
    await fetch(
      `http://localhost:8080/api/file/delete/${userId}/${fileName}`,
      {
        method: 'DELETE',
      }
    );
    fetchFilesList();
  };

  const handleShareViaEmail = (fileName) => {
    setShareEmailData({
      ...shareEmailData,
      fileName,
    });
    setShowShareModal(true);
  };

  const handleShareEmailChange = (event) => {
    const { name, value } = event.target;
    setShareEmailData({
      ...shareEmailData,
      [name]: value,
    });
  };

  const handleShareEmailSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('toEmail', shareEmailData.toEmail);
    formData.append('subject', shareEmailData.subject);
    formData.append('body', shareEmailData.body);
    formData.append('userId', userId);
    formData.append('fileName', shareEmailData.fileName);

    await fetch('http://localhost:8080/api/file/share/email', {
      method: 'POST',
      body: formData,
    });

    setLoading(false);
    setEmailSent(true);
  };

  const formatFileSize = (size) => {
    if (size < 1024) return size + ' bytes';
    else if (size >= 1024 && size < 1048576)
      return (size / 1024).toFixed(1) + ' KB';
    else if (size >= 1048576 && size < 1073741824)
      return (size / 1048576).toFixed(1) + ' MB';
    else return (size / 1073741824).toFixed(1) + ' GB';
  };

  const filteredFiles = filesList.filter((file) =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);

  const handleCancel = () => {
    setFile(null);
    setShowUploadForm(false);
  };

  return (
    <div className={styles.wrapper}>
      {/* Header card */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <h1>Quản lý và chia sẻ <span>File</span></h1>
          <p className={styles.headerSubtitle}>
           Bạn có thể chia sẻ và quản lý File đến bất cứ ai!
          </p>
          <button
            className={styles.addDocumentButton}
            onClick={() => setShowUploadForm(true)}
          >
            + Thêm tài liệu
          </button>
        </div>
        <div className={styles.headerRight}>
          {/* Gắn link URL cho ảnh minh họa */}
          <img 
            src="https://img.upanh.tv/2024/12/10/share.gif" 
            alt="Illustration"
            className={styles.headerImage}
          />
        </div>
      </div>

      {!showUploadForm && (
        <div className={styles.searchBoxOuter}>
          <div className={styles.searchBoxContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm theo tên tài liệu"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      )}

      {/* Nếu không có file và không show form upload */}
      {!showUploadForm && filesList.length === 0 && (
        <div className={styles.noFilesContainer}>
          <div className={styles.noFilesContent}>
            <img
              src="https://img.upanh.tv/2024/12/10/no-data.gif"
              alt="No files"
              className={styles.noFilesImage}
            />
            <p className={styles.noFilesText}>Chưa có tài liệu nào</p>
            <p className={styles.noteText}>Lưu ý: Upload tài liệu giới hạn tối đa 20Mb</p>
          </div>
        </div>
      )}

      {/* Nếu có file và không show form upload */}
      {!showUploadForm && filesList.length > 0 && (
        <div className={styles.fileListCard}>
          <div className={styles.fileListHeader}>
            <h2>Danh sách File của bạn</h2>
            <div className={styles.fileCountBadge}>Số lượng : {filesList.length}</div>
          </div>
          <ul className={styles.fileItems}>
            {currentFiles.map((file) => (
              <li key={file.fileName} className={styles.fileItem}>
                <div className={styles.fileInfo}>
                  <FaFileAlt className={styles.fileIcon} />
                  <div className={styles.fileNameContainer}>
                    <span
                      className={styles.fileName}
                      title={file.fileName}
                    >
                      {file.fileName}
                    </span>
                    {file.size && (
                      <span className={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.dropdown}>
                  <button className={styles.dropbtn}>
                    <FaWrench />
                  </button>
                  <div className={styles.dropdownContent}>
                    <button onClick={() => handleDownload(file.fileName)}>
                      Tải xuống
                    </button>
                    <button onClick={() => handleDelete(file.fileName)}>
                      Xóa
                    </button>
                    <button onClick={() => handleShareViaEmail(file.fileName)}>
                      Chia sẻ
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`${styles.pageButton} ${
                    currentPage === index + 1 ? styles.activePage : ''
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Upload */}
      {showUploadForm && (
        <div
          className={styles.uploadCard}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {file ? (
            <div className={styles.selectedFileContainer}>
              <h2>Tệp tin đã chọn</h2>
              <div className={styles.selectedFile}>
                <strong>{file.name}</strong>
              </div>
              <div className={styles.buttonGroup}>
              </div>
              <button className={styles.uploadButton} onClick={handleUpload}>
                Upload
              </button>
              {/* Nút hủy trở về danh sách */}
              <button className={styles.cancelButton} onClick={handleCancel}>
                Hủy
              </button>
            </div>
          ) : (
            <>
              <h2>Upload tệp tin</h2>
              <FaCloudUploadAlt className={styles.uploadIcon} />
              <p>Kéo thả tệp tin vào đây hoặc</p>
              <div className={styles.fileDropArea}>
                <input
                  type="file"
                  id="fileInput"
                  className={styles.fileInput}
                  onChange={handleFileChange}
                />
                <label htmlFor="fileInput" className={styles.fileLabel}>
                  Chọn tệp tin
                </label>
              </div>
              {/* Nút hủy trở về danh sách khi chưa chọn file */}
              <button className={styles.cancelButton} onClick={handleCancel}>
                Hủy
              </button>
            </>
          )}
        </div>
      )}

      {/* Modal share email */}
      {showShareModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button
              className={styles.modalClose}
              onClick={() => {
                setShowShareModal(false);
                setEmailSent(false);
                setShareEmailData({
                  fileName: '',
                  toEmail: '',
                  subject: '',
                  body: '',
                });
              }}
            >
              &times;
            </button>
            <h3>Thư mới</h3>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Đang gửi email...</p>
              </div>
            ) : emailSent ? (
              <div className={styles.successContainer}>
                <FaCheckCircle className={styles.successIcon} />
                <p>Email đã được gửi thành công!</p>
                <button
                  className={styles.primaryButton}
                  onClick={() => {
                    setShowShareModal(false);
                    setEmailSent(false);
                    setShareEmailData({
                      fileName: '',
                      toEmail: '',
                      subject: '',
                      body: '',
                    });
                  }}
                >
                  OK
                </button>
              </div>
            ) : (
              <form onSubmit={handleShareEmailSubmit}>
                <div className={styles.formGroup}>
                  <label>Đến Email:</label>
                  <input
                    type="email"
                    name="toEmail"
                    value={shareEmailData.toEmail}
                    onChange={handleShareEmailChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Tiêu đề:</label>
                  <input
                    type="text"
                    name="subject"
                    value={shareEmailData.subject}
                    onChange={handleShareEmailChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Nội dung:</label>
                  <textarea
                    name="body"
                    value={shareEmailData.body}
                    onChange={handleShareEmailChange}
                    required
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.primaryButton}>
                    Gửi Email
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setShowShareModal(false);
                      setEmailSent(false);
                      setShareEmailData({
                        fileName: '',
                        toEmail: '',
                        subject: '',
                        body: '',
                      });
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
