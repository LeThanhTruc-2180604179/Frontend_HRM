// LoginContainer.js
import React, { useState } from 'react';
import Login from './Login';
import Login2 from './Login2';

const LoginContainer = ({ setUserId }) => {
  const [isLoginClicked, setIsLoginClicked] = useState(false);

  const handleLoginClick = () => {
    setIsLoginClicked(true);
  };

  const handleBackClick = () => {
    setIsLoginClicked(false); // Quay trở lại Login.js
  };

  return (
    <div>
      {!isLoginClicked ? (
        <Login onLoginClick={handleLoginClick} />
      ) : (
        <Login2 setUserId={setUserId} onBackClick={handleBackClick} />
      )}
    </div>
  );
};

export default LoginContainer;
