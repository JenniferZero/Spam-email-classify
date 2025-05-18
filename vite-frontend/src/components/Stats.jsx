import React, { useState, useEffect } from "react";
import { getStats, retrainModel } from "../services/api.js";
// Import Notiflix for better confirm dialogs
import { Confirm } from "notiflix/build/notiflix-confirm-aio";
// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
// Import ClipLoader from react-spinners
import { ScaleLoader, ClipLoader } from "react-spinners";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRetraining, setIsRetraining] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getStats();
      setStats(response.data);
    } catch (err) {
      setError(
        "Lỗi khi tải thống kê: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRetrain = async () => {
    Confirm.show(
      "Huấn luyện lại mô hình",
      "Bạn có chắc chắn muốn huấn luyện lại mô hình? Quá trình này có thể mất vài phút.",
      "Huấn luyện",
      "Hủy",
      async () => {
        setIsRetraining(true);
        setError("");

        try {
          await retrainModel();
          window.showToast(
            "Thành công",
            "Đã huấn luyện lại mô hình thành công",
            "success"
          );
          fetchStats();
        } catch (err) {
          setError(
            "Lỗi khi huấn luyện lại mô hình: " +
              (err.response?.data?.error || err.message)
          );
        } finally {
          setIsRetraining(false);
        }
      },
      () => {},
      {
        titleColor: "#0d6efd",
        okButtonBackground: "#0d6efd",
        borderRadius: "8px",
        width: "320px",
        messageMaxLength: 500,
        buttonsFontSize: "14px",
        buttonsTextDecoration: "none",
        cssAnimationStyle: "zoom",
      }
    );
  };

  return (
    <div className="stats-container">
      <div
        className="card glass-card mb-4"
        style={{
          background: "var(--glass-bg-light)",
          border: "1px solid var(--glass-border-medium)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          className="card-header d-flex justify-content-between align-items-center"
          style={{
            background: "var(--glass-bg-heavy)",
            borderBottom: "1px solid var(--glass-border-medium)",
            color: "var(--text-high)",
          }}
        >
          <h4>Thống kê hệ thống</h4>
          <div>
            <button
              className="btn btn-sm glass-btn me-2"
              style={{
                background: "var(--glass-bg-medium)",
                color: "var(--text-high)",
                border: "1px solid var(--glass-border-light)",
                backdropFilter: "blur(5px)",
              }}
              onClick={fetchStats}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-1"></i> Làm mới
            </button>
            <button
              className="btn btn-sm glass-btn"
              style={{
                background: "var(--primary-500)",
                color: "var(--text-high)",
                border: "1px solid var(--glass-border-light)",
                backdropFilter: "blur(5px)",
              }}
              onClick={handleRetrain}
              disabled={isRetraining}
            >
              {isRetraining ? (
                <div className="d-flex align-items-center">
                  <ClipLoader
                    size={16}
                    color="#ffffff"
                    loading={true}
                    aria-label="Loading Spinner"
                  />
                  <span className="ms-2">Đang huấn luyện...</span>
                </div>
              ) : (
                <>
                  <i className="fas fa-cogs me-1"></i> Huấn luyện lại mô hình
                </>
              )}
            </button>
          </div>
        </div>
        <div className="card-body" style={{ color: "var(--text-high)" }}>
          {error && (
            <div className="alert alert-danger glass-card">{error}</div>
          )}

          {loading ? (
            <div className="d-flex flex-column justify-content-center align-items-center p-5">
              <ScaleLoader size={50} color="var(--text-high)" loading={true} />
              <p className="mt-3">Đang tải thống kê...</p>
            </div>
          ) : stats ? (
            <div className="row">
              <div className="col-md-12 mb-4">
                <div
                  className="card glass-card"
                  style={{
                    background: "var(--glass-bg-light)",
                    border: "1px solid var(--glass-border-light)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    className="card-header"
                    style={{
                      background: "var(--primary-500)",
                      color: "var(--text-high)",
                      borderBottom: "1px solid var(--glass-border-medium)",
                    }}
                  >
                    <h5 className="mb-0">
                      <i className="fas fa-chart-pie me-2"></i>Thống kê tổng
                      quan
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3 col-sm-6 mb-3">
                        <div
                          className="card glass-card"
                          style={{
                            background: "var(--glass-bg-light)",
                            border: "1px solid var(--glass-border-light)",
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <div className="card-body text-center">
                            <h2 className="text-primary">
                              {stats.inbox_count}
                            </h2>
                            <p className="mb-0">Email trong hộp thư đến</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 col-sm-6 mb-3">
                        <div
                          className="card glass-card"
                          style={{
                            background: "var(--glass-bg-light)",
                            border: "1px solid var(--glass-border-light)",
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <div className="card-body text-center">
                            <h2 className="text-danger">{stats.spam_count}</h2>
                            <p className="mb-0">Email trong thư mục spam</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 col-sm-6 mb-3">
                        <div
                          className="card glass-card"
                          style={{
                            background: "var(--glass-bg-light)",
                            border: "1px solid var(--glass-border-light)",
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <div className="card-body text-center">
                            <h2 className="text-info">{stats.recent_emails}</h2>
                            <p className="mb-0">Email gần đây</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 col-sm-6 mb-3">
                        <div
                          className="card glass-card"
                          style={{
                            background: "var(--glass-bg-light)",
                            border: "1px solid var(--glass-border-light)",
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <div className="card-body text-center">
                            <h2 className="text-warning">
                              {stats.recent_spam_detected}
                            </h2>
                            <p className="mb-0">Spam được phát hiện</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-12 mb-4">
                <div
                  className="card glass-card h-100"
                  style={{
                    background: "var(--glass-bg-light)",
                    border: "1px solid var(--glass-border-light)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    className="card-header"
                    style={{
                      background: "var(--warning)",
                      color: "var(--text-high)",
                      borderBottom: "1px solid var(--glass-border-medium)",
                    }}
                  >
                    <h5 className="mb-0">
                      <i className="fas fa-shield-alt me-2"></i>Độ tin cậy phát
                      hiện spam
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="confidence-bars">
                      <div className="confidence-item">
                        <div className="d-flex justify-content-between">
                          <span>Độ tin cậy cao (&gt;90%)</span>
                          <span className="badge bg-danger">
                            {stats.confidence_levels.high}
                          </span>
                        </div>
                        <div
                          className="progress mb-3 glass-progress"
                          style={{
                            height: "20px",
                            background: "var(--glass-bg-medium)",
                          }}
                        >
                          <div
                            className="progress-bar bg-danger"
                            style={{
                              width: `${
                                (stats.confidence_levels.high /
                                  Math.max(stats.recent_spam_detected, 1)) *
                                100
                              }%`,
                              boxShadow: "0 0 10px rgba(239, 71, 111, 0.5)",
                            }}
                          >
                            {stats.confidence_levels.high > 0
                              ? `${Math.round(
                                  (stats.confidence_levels.high /
                                    Math.max(stats.recent_spam_detected, 1)) *
                                    100
                                )}%`
                              : ""}
                          </div>
                        </div>
                      </div>
                      <div className="confidence-item">
                        <div className="d-flex justify-content-between">
                          <span>Độ tin cậy trung bình (70-90%)</span>
                          <span className="badge bg-warning text-dark">
                            {stats.confidence_levels.medium}
                          </span>
                        </div>
                        <div
                          className="progress mb-3 glass-progress"
                          style={{
                            height: "20px",
                            background: "var(--glass-bg-medium)",
                          }}
                        >
                          <div
                            className="progress-bar bg-warning"
                            style={{
                              width: `${
                                (stats.confidence_levels.medium /
                                  Math.max(stats.recent_spam_detected, 1)) *
                                100
                              }%`,
                              boxShadow: "0 0 10px rgba(255, 209, 102, 0.5)",
                            }}
                          >
                            {stats.confidence_levels.medium > 0
                              ? `${Math.round(
                                  (stats.confidence_levels.medium /
                                    Math.max(stats.recent_spam_detected, 1)) *
                                    100
                                )}%`
                              : ""}
                          </div>
                        </div>
                      </div>
                      <div className="confidence-item">
                        <div className="d-flex justify-content-between">
                          <span>Độ tin cậy thấp (&lt;70%)</span>
                          <span className="badge bg-info">
                            {stats.confidence_levels.low}
                          </span>
                        </div>
                        <div
                          className="progress mb-3 glass-progress"
                          style={{
                            height: "20px",
                            background: "var(--glass-bg-medium)",
                          }}
                        >
                          <div
                            className="progress-bar bg-info"
                            style={{
                              width: `${
                                (stats.confidence_levels.low /
                                  Math.max(stats.recent_spam_detected, 1)) *
                                100
                              }%`,
                              boxShadow: "0 0 10px rgba(17, 138, 178, 0.5)",
                            }}
                          >
                            {stats.confidence_levels.low > 0
                              ? `${Math.round(
                                  (stats.confidence_levels.low /
                                    Math.max(stats.recent_spam_detected, 1)) *
                                    100
                                )}%`
                              : ""}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4" style={{ height: "200px" }}>
                      <Pie
                        data={{
                          labels: [
                            "Độ tin cậy cao",
                            "Độ tin cậy trung bình",
                            "Độ tin cậy thấp",
                          ],
                          datasets: [
                            {
                              data: [
                                stats.confidence_levels.high,
                                stats.confidence_levels.medium,
                                stats.confidence_levels.low,
                              ],
                              backgroundColor: [
                                "rgba(239, 71, 111, 0.7)",
                                "rgba(255, 209, 102, 0.7)",
                                "rgba(17, 138, 178, 0.7)",
                              ],
                              borderColor: [
                                "rgba(239, 71, 111, 1)",
                                "rgba(255, 209, 102, 1)",
                                "rgba(17, 138, 178, 1)",
                              ],
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: {
                                color: "var(--text-high)",
                                font: {
                                  family: "'Nunito', sans-serif",
                                },
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6 mb-4">
                <div
                  className="card glass-card"
                  style={{
                    background: "var(--glass-bg-light)",
                    border: "1px solid var(--glass-border-light)",
                    backdropFilter: "blur(10px)",
                    height: "100%",
                  }}
                >
                  <div
                    className="card-header"
                    style={{
                      background: "var(--success)",
                      color: "var(--text-high)",
                      borderBottom: "1px solid var(--glass-border-medium)",
                    }}
                  >
                    <h5 className="mb-0">
                      <i className="fas fa-chart-bar me-2"></i>Hiệu suất mô hình
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="model-metrics">
                          <div className="metric-item mb-3">
                            <h6>Độ chính xác (Accuracy)</h6>
                            <div
                              className="progress glass-progress"
                              style={{
                                height: "25px",
                                background: "var(--glass-bg-medium)",
                              }}
                            >
                              <div
                                className="progress-bar"
                                style={{
                                  background: "var(--success)",
                                  width: `${stats.model_metrics.accuracy}%`,
                                  boxShadow: "0 0 10px rgba(6, 214, 160, 0.5)",
                                }}
                              >
                                {stats.model_metrics.accuracy}%
                              </div>
                            </div>
                          </div>
                          <div className="metric-item mb-3">
                            <h6>Độ chính xác (Precision)</h6>
                            <div
                              className="progress glass-progress"
                              style={{
                                height: "25px",
                                background: "var(--glass-bg-medium)",
                              }}
                            >
                              <div
                                className="progress-bar"
                                style={{
                                  background: "var(--info)",
                                  width: `${stats.model_metrics.precision}%`,
                                  boxShadow: "0 0 10px rgba(17, 138, 178, 0.5)",
                                }}
                              >
                                {stats.model_metrics.precision}%
                              </div>
                            </div>
                          </div>
                          <div className="metric-item mb-3">
                            <h6>Độ nhạy (Recall)</h6>
                            <div
                              className="progress glass-progress"
                              style={{
                                height: "25px",
                                background: "var(--glass-bg-medium)",
                              }}
                            >
                              <div
                                className="progress-bar"
                                style={{
                                  background: "var(--warning)",
                                  width: `${stats.model_metrics.recall}%`,
                                  boxShadow:
                                    "0 0 10px rgba(255, 209, 102, 0.5)",
                                }}
                              >
                                {stats.model_metrics.recall}%
                              </div>
                            </div>
                          </div>
                          <div className="metric-item">
                            <h6>Điểm F1 (F1 Score)</h6>
                            <div
                              className="progress glass-progress"
                              style={{
                                height: "25px",
                                background: "var(--glass-bg-medium)",
                              }}
                            >
                              <div
                                className="progress-bar"
                                style={{
                                  background: "var(--primary-500)",
                                  width: `${stats.model_metrics.f1_score}%`,
                                  boxShadow: "0 0 10px rgba(0, 123, 255, 0.5)",
                                }}
                              >
                                {stats.model_metrics.f1_score}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="text-center mb-3">
                          Ma trận nhầm lẫn (Confusion Matrix)
                        </h6>
                        <div className="confusion-matrix">
                          <table
                            className="table table-bordered text-center glass-table"
                            style={{
                              background: "var(--glass-bg-light)",
                              color: "var(--text-high)",
                              border: "1px solid var(--glass-border-light)",
                            }}
                          >
                            <thead>
                              <tr>
                                <th scope="col"></th>
                                <th scope="col">Dự đoán: Ham</th>
                                <th scope="col">Dự đoán: Spam</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <th scope="row">Thực tế: Ham</th>
                                <td className="bg-success bg-opacity-25">
                                  {stats.model_metrics.confusion_matrix[0][0]}
                                </td>
                                <td className="bg-danger bg-opacity-25">
                                  {stats.model_metrics.confusion_matrix[0][1]}
                                </td>
                              </tr>
                              <tr>
                                <th scope="row">Thực tế: Spam</th>
                                <td className="bg-danger bg-opacity-25">
                                  {stats.model_metrics.confusion_matrix[1][0]}
                                </td>
                                <td className="bg-success bg-opacity-25">
                                  {stats.model_metrics.confusion_matrix[1][1]}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="text-center mt-2">
                          <small style={{ color: "var(--text-medium)" }}>
                            <span
                              className="badge"
                              style={{
                                background: "rgba(6, 214, 160, 0.2)",
                                color: "var(--text-high)",
                              }}
                            >
                              Đúng
                            </span>
                            <span
                              className="badge ms-1"
                              style={{
                                background: "rgba(239, 71, 111, 0.2)",
                                color: "var(--text-high)",
                              }}
                            >
                              Sai
                            </span>
                          </small>
                        </div>
                      </div>
                    </div>

                    <div
                      className="model-info mt-3 glass-card p-3"
                      style={{
                        background: "var(--glass-bg-light)",
                        border: "1px solid var(--glass-border-light)",
                        borderRadius: "8px",
                      }}
                    >
                      <div className="row">
                        <div className="col-md-12">
                          <div className="info-item">
                            <strong>Kích thước tập huấn luyện:</strong>
                            <span
                              className="badge ms-2"
                              style={{
                                background: "var(--primary-500)",
                                color: "var(--text-high)",
                              }}
                            >
                              {stats.training_size} mẫu
                            </span>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="info-item">
                            <strong>Độ chính xác trên tập kiểm thử:</strong>
                            <span
                              className="badge ms-2"
                              style={{
                                background: "var(--success)",
                                color: "var(--text-high)",
                              }}
                            >
                              {stats.test_accuracy}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="info-item">
                            <strong>Lần huấn luyện cuối:</strong>
                            <span
                              className="badge ms-2"
                              style={{
                                background: "var(--info)",
                                color: "var(--text-high)",
                              }}
                            >
                              {stats.last_training || "Chưa có thông tin"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6 mb-4">
                <div
                  className="card glass-card"
                  style={{
                    background: "var(--glass-bg-light)",
                    border: "1px solid var(--glass-border-light)",
                    backdropFilter: "blur(10px)",
                    height: "100%",
                  }}
                >
                  <div
                    className="card-header"
                    style={{
                      background: "var(--danger)",
                      color: "var(--text-high)",
                      borderBottom: "1px solid var(--glass-border-medium)",
                    }}
                  >
                    <h5 className="mb-0">
                      <i className="fas fa-exclamation-triangle me-2"></i>Mẫu
                      spam phổ biến
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <h6 className="mb-3">Các mẫu spam phổ biến</h6>
                        <div style={{ height: "250px", width: "100%" }}>
                          <Bar
                            data={{
                              labels: stats.spam_patterns.map(
                                (item) => item.pattern
                              ),
                              datasets: [
                                {
                                  label: "Tần suất xuất hiện",
                                  data: stats.spam_patterns.map(
                                    (item) => item.frequency
                                  ),
                                  backgroundColor: "rgba(239, 71, 111, 0.7)",
                                  borderColor: "rgba(239, 71, 111, 1)",
                                  borderWidth: 1,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              indexAxis: "y",
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    font: {
                                      size: 10,
                                    },
                                    color: "var(--text-medium)",
                                  },
                                  grid: {
                                    color: "rgba(255, 255, 255, 0.1)",
                                  },
                                },
                                x: {
                                  ticks: {
                                    color: "var(--text-medium)",
                                  },
                                  grid: {
                                    color: "rgba(255, 255, 255, 0.1)",
                                  },
                                },
                              },
                              plugins: {
                                legend: {
                                  display: false,
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Từ khóa phổ biến trong spam</h6>
                        <div
                          className="common-keywords glass-card p-2"
                          style={{
                            background: "var(--glass-bg-light)",
                            border: "1px solid var(--glass-border-light)",
                            borderRadius: "8px",
                            minHeight: "200px",
                          }}
                        >
                          {stats.common_keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="badge me-2 mb-2 p-2"
                              style={{
                                background: "var(--danger)",
                                color: "var(--text-high)",
                                fontSize: `${Math.max(
                                  0.8,
                                  Math.min(1.5, 0.8 + keyword.count / 20)
                                )}rem`,
                                boxShadow: "0 2px 10px rgba(239, 71, 111, 0.3)",
                              }}
                            >
                              {keyword.word} ({keyword.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h6>Thông tin về mô hình:</h6>
                      <p
                        className="small"
                        style={{ color: "var(--text-medium)" }}
                      >
                        Mô hình sử dụng thuật toán Naive Bayes kết hợp với
                        TF-IDF để phân loại email. Mô hình được huấn luyện trên
                        tập dữ liệu gồm các email spam và không spam, với các
                        đặc trưng được trích xuất từ nội dung email.
                      </p>
                      <div
                        className="alert glass-card"
                        style={{
                          background: "rgba(17, 138, 178, 0.2)",
                          color: "var(--text-high)",
                          border: "1px solid var(--glass-border-light)",
                          backdropFilter: "blur(5px)",
                        }}
                      >
                        <i className="fas fa-info-circle me-2"></i>
                        Để cải thiện độ chính xác của mô hình, bạn có thể thêm
                        các email bị phân loại sai vào tập dữ liệu huấn luyện và
                        huấn luyện lại mô hình bằng nút "Huấn luyện lại mô
                        hình".
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-12 mb-4">
                <div
                  className="card glass-card"
                  style={{
                    background: "var(--glass-bg-light)",
                    border: "1px solid var(--glass-border-light)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    className="card-header"
                    style={{
                      background: "var(--glass-bg-heavy)",
                      color: "var(--text-high)",
                      borderBottom: "1px solid var(--glass-border-medium)",
                    }}
                  >
                    <h5 className="mb-0">
                      <i className="fas fa-info-circle me-2"></i>Hướng dẫn sử
                      dụng
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12">
                        <div
                          className="usage-guide glass-card p-3"
                          style={{
                            background: "var(--glass-bg-light)",
                            border: "1px solid var(--glass-border-light)",
                            borderRadius: "8px",
                          }}
                        >
                          <p>
                            <i className="fas fa-check-circle text-success me-2"></i>
                            <strong>Hộp thư đến:</strong> Xem và quản lý email,
                            đánh dấu email là spam nếu cần.
                          </p>
                          <p>
                            <i className="fas fa-exclamation-triangle text-danger me-2"></i>
                            <strong>Thư mục spam:</strong> Xem các email bị đánh
                            dấu là spam, khôi phục nếu cần.
                          </p>
                          <p>
                            <i className="fas fa-search text-primary me-2"></i>
                            <strong>Phân tích email:</strong> Phân tích nội dung
                            email để xác định có phải spam không.
                          </p>
                          <p>
                            <i className="fas fa-cogs text-secondary me-2"></i>
                            <strong>Huấn luyện lại mô hình:</strong> Cập nhật mô
                            hình với dữ liệu mới để cải thiện độ chính xác.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="alert alert-warning glass-card"
              style={{
                background: "rgba(255, 209, 102, 0.2)",
                color: "var(--text-high)",
                border: "1px solid var(--glass-border-light)",
              }}
            >
              Không thể tải thống kê. Vui lòng thử lại sau.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;
