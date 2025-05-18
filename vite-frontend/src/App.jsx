import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
// Import Bootstrap 5 CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./assets/styles.css";

// Import react-toastify
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// API
import { checkAuth } from "./services/api.js";

// Pages
import LoginPage from "./pages/LoginPage.jsx";
import InboxPage from "./pages/InboxPage.jsx";
import SpamPage from "./pages/SpamPage.jsx";
import AnalyzerPage from "./pages/AnalyzerPage.jsx";
import StatsPage from "./pages/StatsPage.jsx";

// Components
import SplashScreen from "./components/SplashScreen.jsx";
import { RingLoader } from "react-spinners";

// Global toast notification function using react-toastify with glass background
window.showToast = (title, message, type = "info") => {
  const content = (
    <div>
      {title && <strong>{title}</strong>}
      {title && <br />}
      {message}
    </div>
  );

  // Common toast options with glass background
  const toastOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    style: {
      background: "rgba(20, 20, 30, 0.8)",
      backdropFilter: "blur(10px)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      color: "white",
      borderRadius: "8px",
    },
  };

  switch (type) {
    case "success":
      toast.success(content, {
        ...toastOptions,
        autoClose: 3000,
      });
      break;
    case "error":
      toast.error(content, {
        ...toastOptions,
        autoClose: 5000,
      });
      break;
    case "warning":
      toast.warning(content, {
        ...toastOptions,
        autoClose: 4000,
      });
      break;
    default:
      toast.info(content, {
        ...toastOptions,
        autoClose: 3000,
      });
      break;
  }
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await checkAuth();
        setIsAuthenticated(response.data.authenticated);

        if (!response.data.authenticated && location.pathname !== "/login") {
          navigate("/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        navigate("/login");
      }
    };

    verifyAuth();
  }, [navigate, location]);

  if (isAuthenticated === null) {
    // Still checking authentication
    return (
      <div className="loading-container">
        <RingLoader color="#5e60ce" size={80} />
        <p className="mt-3 loading-text">Đang xác thực tài khoản</p>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

function App() {
  const [loading, setLoading] = useState(true);

  // Load Bootstrap 5 JS and handle splash screen
  useEffect(() => {
    // Add Bootstrap 5 JS
    const bootstrap = document.createElement("script");
    bootstrap.src =
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
    bootstrap.integrity =
      "sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL";
    bootstrap.crossOrigin = "anonymous";
    bootstrap.async = true;
    document.body.appendChild(bootstrap);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {loading ? (
        <SplashScreen />
      ) : (
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <InboxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spam"
              element={
                <ProtectedRoute>
                  <SpamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analyzer"
              element={
                <ProtectedRoute>
                  <AnalyzerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <StatsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      )}

      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="glass-toast"
      />
    </>
  );
}

export default App;
