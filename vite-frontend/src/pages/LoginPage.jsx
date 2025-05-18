import React from "react";
import "../assets/styles.css";

const LoginPage = () => {
  const handleGoogleLogin = () => {
    // Chuyển hướng đến route /login trên backend
    window.location.href = "/login";
  };

  return (
    <div className="login-container">
      {/* Background shapes */}
      <div className="bg-shape bg-shape-1"></div>
      <div className="bg-shape bg-shape-2"></div>
      <div className="bg-shape bg-shape-3"></div>

      <div className="login-split">
        {/* Left side - Branding */}
        <div className="login-brand">
          <div className="login-brand-overlay"></div>
          <div className="login-brand-content">
            <div className="login-logo-container">
              <img
                src="/login-thumb.png"
                alt="Login Thumb"
                className="login-logo"
              />
            </div>

            <h1 className="login-brand-title">Spam Filter App</h1>
            <p className="login-brand-subtitle">
              Ứng dụng phân loại email spam.
            </p>

            <div className="login-features">
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="login-feature-text">
                  Phát hiện spam chính xác với AI
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="login-feature-text">
                  Phân tích chi tiết nội dung email
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <i className="fas fa-sync-alt"></i>
                </div>
                <div className="login-feature-text">
                  Tự động cập nhật và học hỏi liên tục
                </div>
              </div>
            </div>
          </div>

          <div className="login-brand-footer">
            &copy; {new Date().getFullYear()} Spam Filter for Gmail. All rights
            reserved.
          </div>
        </div>

        {/* Right side - Form */}
        <div className="login-form-container">
          <h2 className="login-form-title">Chào mừng đến với Spam Filter</h2>
          <p className="login-form-subtitle">
            Đăng nhập bằng tài khoản Google để tiếp tục
          </p>

          <div className="login-form">
            <button onClick={handleGoogleLogin} className="btn btn-google">
              <i className="fab fa-google me-2"></i>
              Đăng nhập với Google
            </button>
          </div>

          <div className="login-footer">
            <p>
              Ứng dụng này sẽ yêu cầu quyền truy cập vào tài khoản Gmail của bạn
              để phát hiện và quản lý email spam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
