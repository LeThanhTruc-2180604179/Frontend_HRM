// JoinMeeting.js
import React, { useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const JoinMeeting = ({ roomId }) => {
  const containerRef = useRef(null);
  const zpRef = useRef(null);

  useEffect(() => {
    if (!roomId) {
      console.error("roomId is missing");
      return;
    }

    // Lấy userId từ localStorage (ví dụ đã lưu sau khi login)
    const userID = localStorage.getItem('userId') || "testUser"; 
    const userName = userID; // Dùng userID làm userName, hoặc lấy thêm từ localStorage nếu có

    // Kiểm tra appID, serverSecret phải đúng của bạn
    const appID = 759155258; // Thay bằng appID thực tế của bạn từ ZEGOCLOUD
    const serverSecret = "8bc1bec5c258fe0ba02cfd57a9b3fa9f"; // Thay bằng serverSecret thực tế
    // roomId: Chuỗi đơn giản, ví dụ "room_123"

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      String(roomId), // Chắc chắn chuyển roomId về string
      String(userID),
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zpRef.current = zp;

    zp.joinRoom({
      container: containerRef.current,
      sharedLinks: [
        {
          name: 'Liên kết tham gia',
          url: window.location.origin + '/join-meeting?roomID=' + roomId,
        }
      ],
      // Có thể cấu hình thêm UI/feature:
      scenario: {
        mode: ZegoUIKitPrebuilt.VideoConference, // hoặc OneONoneCall, ...
      },
      maxUsers: 50,
      turnOnMicrophoneWhenJoining: true,
      turnOnCameraWhenJoining: true,
    });

    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
      }
    };
  }, [roomId]);

  return (
    <div style={{ width: '100%', height: '600px' }} ref={containerRef}>
      {/* UI của Zego sẽ gắn vào đây */}
    </div>
  );
};

export default JoinMeeting;
