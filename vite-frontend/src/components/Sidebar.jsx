import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { logout } from "../services/api.js";
import "../assets/styles.css";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công!");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(
        "Lỗi khi đăng xuất: " + (error.response?.data?.error || error.message)
      );
    }
  };

  return (
    <div className="gmail-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img
            src="/small-logo.png"
            alt="Spam Filter Logo"
            className="sidebar-logo-img"
          />
          <h1 className="sidebar-logo-text">Spam Filter</h1>
        </div>
      </div>
      <div className="sidebar-compose">
        <button
          className="btn-base btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#composeModal"
        >
          <i className="fas fa-plus me-2"></i> Soạn thư
        </button>
      </div>
      <ul className="sidebar-nav">
        <li className={currentPath === "/" ? "active" : ""}>
          <Link to="/">
            <i className="fas fa-inbox"></i> Hộp thư đến
          </Link>
        </li>
        <li className={currentPath === "/spam" ? "active" : ""}>
          <Link to="/spam">
            <i className="fas fa-exclamation-triangle"></i> Thư spam
          </Link>
        </li>
        <li className={currentPath === "/analyzer" ? "active" : ""}>
          <Link to="/analyzer">
            <i className="fas fa-search"></i> Phân tích email
          </Link>
        </li>
        <li className={currentPath === "/stats" ? "active" : ""}>
          <Link to="/stats">
            <i className="fas fa-chart-bar"></i> Thống kê
          </Link>
        </li>
      </ul>
      <div className="sidebar-footer glass-effect">
        <button
          className="btn-base btn-danger btn-logout"
          onClick={handleLogout}
        >
          <i className="fas fa-sign-out-alt me-2"></i> Đăng xuất
        </button>
        <p className="text-muted small mt-3">
          <i className="fas fa-shield-alt me-1"></i> Spam Filter v1.0
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
