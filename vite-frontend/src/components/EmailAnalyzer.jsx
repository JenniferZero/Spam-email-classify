import React, { useState } from "react";
import { analyzeText, addToDataset } from "../services/api.js";
import { ClipLoader } from "react-spinners";

// Hàm loại bỏ các thẻ HTML từ văn bản - phiên bản cải tiến
const stripHtmlTags = (html) => {
  if (!html) return "";

  try {
    // Phương pháp 1: Sử dụng DOM API
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Loại bỏ các phần tử script và style
    const scripts = tempDiv.getElementsByTagName("script");
    const styles = tempDiv.getElementsByTagName("style");

    // Xóa từ cuối lên đầu để tránh vấn đề với NodeList động
    for (let i = scripts.length - 1; i >= 0; i--) {
      scripts[i].parentNode.removeChild(scripts[i]);
    }

    for (let i = styles.length - 1; i >= 0; i--) {
      styles[i].parentNode.removeChild(styles[i]);
    }

    // Lấy văn bản thuần túy
    let text = tempDiv.textContent || tempDiv.innerText || "";

    // Phương pháp 2: Sử dụng regex để đảm bảo loại bỏ tất cả các thẻ còn sót lại
    // Loại bỏ tất cả các thẻ HTML còn sót lại
    text = text.replace(/<[^>]*>/g, "");

    // Loại bỏ khoảng trắng thừa và ký tự đặc biệt
    text = text.replace(/\s+/g, " ").trim();

    return text;
  } catch (error) {
    console.error("Lỗi khi loại bỏ HTML:", error);

    // Phương pháp dự phòng: Sử dụng regex
    return html
      .replace(/<[^>]*>/g, "") // Loại bỏ tất cả các thẻ HTML
      .replace(/&nbsp;/g, " ") // Thay thế &nbsp; bằng khoảng trắng
      .replace(/&amp;/g, "&") // Thay thế &amp; bằng &
      .replace(/&lt;/g, "<") // Thay thế &lt; bằng <
      .replace(/&gt;/g, ">") // Thay thế &gt; bằng >
      .replace(/&quot;/g, '"') // Thay thế &quot; bằng "
      .replace(/&#39;/g, "'") // Thay thế &#39; bằng '
      .replace(/\s+/g, " ") // Loại bỏ khoảng trắng thừa
      .trim(); // Loại bỏ khoảng trắng ở đầu và cuối
  }
};

const EmailAnalyzer = () => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  // Đã loại bỏ state error vì đã sử dụng toast
  const [isAddingToDataset, setIsAddingToDataset] = useState(false);
  const [datasetLabel, setDatasetLabel] = useState("");
  // Đã loại bỏ state datasetSuccess vì đã sử dụng toast

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);

    if (!content) {
      window.showToast(
        "Lỗi",
        "Vui lòng nhập nội dung email để phân tích",
        "error"
      );
      setIsAnalyzing(false);
      return;
    }

    try {
      // Xử lý nội dung và tiêu đề trước khi phân tích
      // Loại bỏ các thẻ HTML
      let plainSubject = stripHtmlTags(subject);
      let plainContent = stripHtmlTags(content);

      // Loại bỏ các ký tự đặc biệt và khoảng trắng thừa
      plainSubject = plainSubject.replace(/\s+/g, " ").trim();
      plainContent = plainContent.replace(/\s+/g, " ").trim();

      const response = await analyzeText(plainSubject, plainContent);
      setAnalysisResult(response.data);

      // Hiển thị thông báo kết quả phân tích
      const isSpam = response.data.is_spam;
      const confidence = response.data.confidence;
      const resultMessage = isSpam
        ? `Email này có khả năng là SPAM (${confidence}% độ tin cậy)`
        : `Email này có vẻ an toàn (${confidence}% độ tin cậy)`;

      window.showToast(
        "Kết quả phân tích",
        resultMessage,
        isSpam ? "warning" : "success"
      );
    } catch (err) {
      const errorMessage =
        "Lỗi khi phân tích email: " +
        (err.response?.data?.error || err.message);
      window.showToast("Lỗi", errorMessage, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Hàm reset để xóa nội dung đã nhập
  const handleReset = () => {
    setSubject("");
    setContent("");
    setAnalysisResult(null);
    setDatasetLabel("");
    window.showToast("Thông báo", "Đã xóa tất cả nội dung", "info");
  };

  const handleAddToDataset = async () => {
    if (!datasetLabel) {
      window.showToast("Lỗi", "Vui lòng chọn nhãn cho dữ liệu", "error");
      return;
    }

    if (!content) {
      window.showToast("Lỗi", "Vui lòng nhập nội dung email", "error");
      return;
    }

    setIsAddingToDataset(true);

    try {
      // Xử lý nội dung và tiêu đề trước khi thêm vào dataset
      // Loại bỏ các thẻ HTML
      let plainSubject = stripHtmlTags(subject);
      let plainContent = stripHtmlTags(content);

      // Loại bỏ các ký tự đặc biệt và khoảng trắng thừa
      plainSubject = plainSubject.replace(/\s+/g, " ").trim();
      plainContent = plainContent.replace(/\s+/g, " ").trim();

      await addToDataset(plainSubject, plainContent, datasetLabel);
      window.showToast(
        "Thành công",
        "Đã thêm dữ liệu vào tập huấn luyện thành công!",
        "success"
      );
      setDatasetLabel("");
    } catch (err) {
      // Kiểm tra các trường hợp phản hồi từ server
      if (err.response?.status === 400 && err.response?.data) {
        // Nếu là trường hợp cập nhật nhãn thành công
        if (err.response.data.updated) {
          window.showToast("Thành công", err.response.data.message, "success");
          // Reset trạng thái form
          setDatasetLabel("");
          return; // Thoát sớm vì đây không phải lỗi thực sự
        }
        // Nếu là trường hợp dữ liệu đã tồn tại với cùng nhãn
        else if (err.response.data.message) {
          window.showToast("Thông báo", err.response.data.message, "info");
        }
      } else {
        // Lỗi khác
        const errorMessage =
          "Lỗi khi thêm vào tập dữ liệu: " +
          (err.response?.data?.error || err.message);
        window.showToast("Lỗi", errorMessage, "error");
      }
    } finally {
      setIsAddingToDataset(false);
    }
  };

  return (
    <div className="analyzer-container">
      <div className="card glass-card">
        <div className="card-header glass-header">
          <h4 style={{ color: "var(--text-high)" }}>
            Phân tích nội dung email
          </h4>
        </div>
        <div className="card-body glass-body">
          {/* Đã loại bỏ div alert vì đã sử dụng toast */}

          <form onSubmit={handleAnalyze}>
            <div className="mb-3">
              <label
                htmlFor="emailSubject"
                styles={{ color: "var(--text-high)" }}
              >
                Tiêu đề:
              </label>
              <input
                type="text"
                className="form-control form-control-dark"
                id="emailSubject"
                placeholder="Nhập tiêu đề email (không bắt buộc)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  background: "var(--glass-bg-light)",
                  color: "var(--text-high)",
                }}
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="emailContent"
                styles={{ color: "var(--text-high)" }}
              >
                Nội dung email:
              </label>
              <textarea
                className="form-control form-control-dark"
                id="emailContent"
                rows="10"
                placeholder="Dán nội dung email cần phân tích vào đây"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                style={{
                  background: "var(--glass-bg-light)",
                  color: "var(--text-high)",
                }}
              ></textarea>
            </div>
            <div className="mb-3 d-flex">
              <button
                type="submit"
                className="btn glass-btn me-2"
                style={{ background: "var(--primary-500)" }}
                disabled={isAnalyzing || !content}
              >
                {isAnalyzing ? (
                  <div className="d-flex align-items-center">
                    <ClipLoader
                      size={16}
                      color="#ffffff"
                      loading={true}
                      aria-label="Loading Spinner"
                    />
                    <span className="ms-2">Đang phân tích...</span>
                  </div>
                ) : (
                  <>
                    <i className="fas fa-search me-1"></i> Phân tích
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn glass-btn"
                style={{ background: "var(--glass-bg-medium)" }}
                onClick={handleReset}
                disabled={
                  isAnalyzing || (!subject && !content && !analysisResult)
                }
              >
                <i className="fas fa-redo-alt me-1"></i> Xóa nội dung
              </button>
            </div>
          </form>

          {analysisResult && (
            <div className="analysis-result mt-4">
              <h5>Kết quả phân tích:</h5>
              <div
                className={`alert glass-card ${
                  analysisResult.classification === "spam"
                    ? "alert-danger"
                    : "alert-success"
                }`}
                style={{
                  background:
                    analysisResult.classification === "spam"
                      ? "rgba(239, 71, 111, 0.2)"
                      : "rgba(6, 214, 160, 0.2)",
                  color: "var(--text-high)",
                }}
              >
                <div className="row mb-3">
                  <div className="col-12 mb-3">
                    <div className="d-flex align-items-center">
                      <strong className="me-2 fs-5">Phân loại:</strong>
                      <span
                        className={`badge ${
                          analysisResult.classification === "spam"
                            ? "bg-danger"
                            : "bg-success"
                        } fs-5 p-2`}
                      >
                        {analysisResult.classification === "spam"
                          ? "SPAM"
                          : "KHÔNG PHẢI SPAM"}
                      </span>
                    </div>

                    <div className="mt-3">
                      <label className="form-label fw-bold">
                        Độ tin cậy: {analysisResult.confidence}%
                      </label>
                      <div className="progress" style={{ height: "25px" }}>
                        <div
                          className={`progress-bar ${
                            analysisResult.classification === "spam"
                              ? "bg-danger"
                              : "bg-success"
                          }`}
                          role="progressbar"
                          style={{ width: `${analysisResult.confidence}%` }}
                          aria-valuenow={analysisResult.confidence}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          {analysisResult.confidence}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="card glass-card mb-3">
                      <div
                        className="card-header glass-header"
                        style={{
                          background: "var(--primary-500)",
                          color: "var(--text-high)",
                        }}
                      >
                        <i className="fas fa-info-circle me-2"></i>Giải thích
                        kết quả
                      </div>
                      <div className="card-body glass-body">
                        <p>
                          Thuật toán Naive Bayes đã phân tích nội dung email và
                          {analysisResult.classification === "spam"
                            ? " phân loại đây là email SPAM với độ tin cậy "
                            : " phân loại đây là email an toàn với độ tin cậy "}
                          <strong>{analysisResult.confidence}%</strong>.
                        </p>

                        <div
                          className="alert glass-card"
                          style={{
                            background: "var(--glass-bg-light)",
                            color: "var(--text-high)",
                          }}
                        >
                          <h6 className="fw-bold">
                            Cách thuật toán Naive Bayes hoạt động:
                          </h6>
                          <ol className="mb-0">
                            <li>
                              Tính toán xác suất có điều kiện cho mỗi từ xuất
                              hiện trong email
                            </li>
                            <li>
                              So sánh xác suất từ đó xuất hiện trong email spam
                              và email thường
                            </li>
                            <li>
                              Kết hợp các xác suất để đưa ra quyết định cuối
                              cùng
                            </li>
                          </ol>
                        </div>

                        {analysisResult.classification === "spam" ? (
                          <div className="mt-2">
                            <h6 className="fw-bold">
                              Lý do phân loại là SPAM:
                            </h6>
                            <ul>
                              <li>
                                Email chứa các từ khóa có xác suất cao xuất hiện
                                trong spam
                              </li>
                              {analysisResult.email_stats?.has_urls && (
                                <li>
                                  Email chứa URL, một đặc điểm phổ biến trong
                                  email spam
                                </li>
                              )}
                              {analysisResult.email_stats?.uppercase_ratio >
                                0.3 && (
                                <li>
                                  Email có tỷ lệ chữ hoa cao (
                                  {(
                                    analysisResult.email_stats
                                      ?.uppercase_ratio * 100
                                  ).toFixed(1)}
                                  %), thường thấy trong spam
                                </li>
                              )}
                              {analysisResult.email_stats?.special_char_count >
                                10 && (
                                <li>
                                  Email chứa nhiều ký tự đặc biệt, thường gặp
                                  trong email spam
                                </li>
                              )}
                            </ul>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <h6 className="fw-bold">
                              Lý do phân loại là KHÔNG PHẢI SPAM:
                            </h6>
                            <ul>
                              <li>
                                Email chứa các từ khóa thường xuất hiện trong
                                email bình thường
                              </li>
                              {!analysisResult.email_stats?.has_urls && (
                                <li>
                                  Email không chứa URL, giảm khả năng là spam
                                </li>
                              )}
                              {analysisResult.email_stats?.uppercase_ratio <
                                0.2 && (
                                <li>
                                  Email có tỷ lệ chữ hoa thấp, phù hợp với email
                                  bình thường
                                </li>
                              )}
                              {analysisResult.email_stats?.word_count > 20 && (
                                <li>
                                  Email có độ dài hợp lý (
                                  {analysisResult.email_stats?.word_count} từ),
                                  phù hợp với email bình thường
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card glass-card mb-3">
                      <div
                        className="card-header glass-header"
                        style={{
                          background: "var(--primary-500)",
                          color: "var(--text-high)",
                        }}
                      >
                        <i className="fas fa-chart-bar me-2"></i>Thống kê email
                      </div>
                      <div className="card-body glass-body">
                        <ul className="list-group list-group-flush glass-list">
                          <li
                            className="list-group-item glass-item d-flex justify-content-between align-items-center"
                            style={{
                              background: "var(--glass-bg-light)",
                              color: "var(--text-high)",
                            }}
                          >
                            Độ dài
                            <span className="badge bg-primary rounded-pill">
                              {analysisResult.email_stats?.total_length ||
                                "N/A"}{" "}
                              ký tự
                            </span>
                          </li>
                          <li
                            className="list-group-item glass-item d-flex justify-content-between align-items-center"
                            style={{
                              background: "var(--glass-bg-light)",
                              color: "var(--text-high)",
                            }}
                          >
                            Số từ
                            <span className="badge bg-primary rounded-pill">
                              {analysisResult.email_stats?.word_count || "N/A"}
                            </span>
                          </li>
                          <li
                            className="list-group-item glass-item d-flex justify-content-between align-items-center"
                            style={{
                              background: "var(--glass-bg-light)",
                              color: "var(--text-high)",
                            }}
                          >
                            Tỷ lệ chữ hoa
                            <span className="badge bg-primary rounded-pill">
                              {analysisResult.email_stats?.uppercase_ratio?.toFixed(
                                2
                              ) || "N/A"}
                            </span>
                          </li>
                          <li
                            className="list-group-item glass-item d-flex justify-content-between align-items-center"
                            style={{
                              background: "var(--glass-bg-light)",
                              color: "var(--text-high)",
                            }}
                          >
                            Có URL
                            <span
                              className={`badge ${
                                analysisResult.email_stats?.has_urls
                                  ? "bg-warning"
                                  : "bg-success"
                              } rounded-pill`}
                            >
                              {analysisResult.email_stats?.has_urls
                                ? "Có"
                                : "Không"}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {analysisResult.top_keywords &&
                  analysisResult.top_keywords.length > 0 && (
                    <div className="card mt-3">
                      <div
                        className="card-header"
                        style={{
                          background: "var(--primary-500)",
                          color: "var(--text-high)",
                        }}
                      >
                        <i className="fas fa-key me-2"></i>Từ khóa ảnh hưởng đến
                        kết quả
                      </div>
                      <div className="card-body">
                        <p
                          style={{ color: "var(--text-high)" }}
                          className="mb-2"
                        >
                          Các từ khóa sau có ảnh hưởng đến việc xác định email
                          là spam hay không (sắp xếp theo mức độ ảnh hưởng):
                        </p>
                        <div className="table-responsive">
                          <table className="table table-striped table-hover">
                            <thead>
                              <tr>
                                <th>Từ khóa</th>
                                <th>Mức độ ảnh hưởng</th>
                                <th>Giải thích</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analysisResult.top_keywords
                                .slice(0, 10)
                                .map((keyword, index) => (
                                  <tr key={index}>
                                    <td>
                                      <span
                                        className={`badge ${
                                          Math.abs(keyword.impact) > 1
                                            ? "bg-danger"
                                            : "bg-secondary"
                                        } me-1 p-2`}
                                        style={{ fontSize: "0.9rem" }}
                                      >
                                        {keyword.word}
                                      </span>
                                    </td>
                                    <td>
                                      <div
                                        className="progress"
                                        style={{ height: "20px" }}
                                      >
                                        <div
                                          className={`progress-bar ${
                                            keyword.impact > 0
                                              ? "bg-danger"
                                              : "bg-success"
                                          }`}
                                          role="progressbar"
                                          style={{
                                            width: `${Math.min(
                                              Math.abs(keyword.impact * 20),
                                              100
                                            )}%`,
                                          }}
                                          aria-valuenow={Math.abs(
                                            keyword.impact
                                          )}
                                          aria-valuemin="0"
                                          aria-valuemax="5"
                                        >
                                          {Math.abs(keyword.impact).toFixed(2)}
                                        </div>
                                      </div>
                                    </td>
                                    <td>{keyword.explanation}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                        <p
                          style={{ color: "var(--text-medium)" }}
                          className="small mt-3"
                        >
                          <i className="fas fa-info-circle me-1"></i>
                          Mức độ ảnh hưởng càng cao, từ khóa càng quan trọng
                          trong việc phân loại email. Màu đỏ thể hiện xu hướng
                          phân loại là spam, màu xanh thể hiện xu hướng phân
                          loại là email thường.
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              <div className="mt-4">
                <h5>Thêm vào tập dữ liệu huấn luyện:</h5>
                <p style={{ color: "var(--text-medium)" }}>
                  Nếu kết quả phân loại không chính xác, bạn có thể thêm email
                  này vào tập dữ liệu huấn luyện với nhãn đúng.
                </p>
                <div className="mb-3">
                  <label style={{ color: "var(--text-high)" }}>
                    Chọn nhãn:
                  </label>
                  <div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="datasetLabel"
                        id="labelHam"
                        value="ham"
                        checked={datasetLabel === "ham"}
                        onChange={() => setDatasetLabel("ham")}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="labelHam"
                        style={{ color: "var(--text-high)" }}
                      >
                        Không phải spam
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="datasetLabel"
                        id="labelSpam"
                        value="spam"
                        checked={datasetLabel === "spam"}
                        onChange={() => setDatasetLabel("spam")}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="labelSpam"
                        style={{ color: "var(--text-high)" }}
                      >
                        Spam
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  className="btn glass-btn"
                  onClick={handleAddToDataset}
                  disabled={isAddingToDataset || !datasetLabel}
                >
                  {isAddingToDataset ? (
                    <div className="d-flex align-items-center justify-content-center">
                      <ClipLoader
                        size={16}
                        color="var(--primary-400)"
                        loading={true}
                        aria-label="Loading Spinner"
                      />
                      <span className="ms-2">Đang thêm...</span>
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-plus me-1"></i> Thêm vào tập dữ liệu
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailAnalyzer;
