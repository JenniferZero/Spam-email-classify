import React, { useState, useRef, useEffect } from "react";
import { sendEmail, analyzeText } from "../services/api.js";
import { Modal } from "bootstrap";

const ComposeModal = () => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  // References for the modal element and instance
  const modalRef = useRef(null);
  const modalInstance = useRef(null);

  // Initialize modal when component mounts
  useEffect(() => {
    modalRef.current = document.getElementById("composeModal");

    if (modalRef.current) {
      modalInstance.current = new Modal(modalRef.current, {
        backdrop: false, // Tắt hoàn toàn backdrop theo yêu cầu
        keyboard: true,
      });

      // Add event listener for when modal is hidden
      modalRef.current.addEventListener("hidden.bs.modal", () => {
        // Reset form fields
        setTo("");
        setSubject("");
        setBody("");
        setAnalysisResult(null);
        setError("");
        setEmailError("");
      });
    }

    // Clean up function to dispose of the modal when component unmounts
    return () => {
      if (modalInstance.current) {
        modalInstance.current.dispose();
      }
      if (modalRef.current) {
        modalRef.current.removeEventListener("hidden.bs.modal", () => {});
      }
    };
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setError("");

    try {
      const response = await analyzeText(subject, body);
      setAnalysisResult(response.data);
    } catch (err) {
      setError(
        "Lỗi khi phân tích email: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  // Function to safely close the modal
  const closeModalSafely = () => {
    try {
      if (modalInstance.current) {
        modalInstance.current.hide();
      } else {
        const modalElement = document.getElementById("composeModal");
        if (modalElement) {
          const bsModalInstance = Modal.getInstance(modalElement);
          if (bsModalInstance) {
            bsModalInstance.hide();
          }
        }
      }
    } catch (error) {
      console.log("Error closing modal:", error);
      // Fallback: just reset the form
      setTo("");
      setSubject("");
      setBody("");
      setAnalysisResult(null);
      setError("");
      setEmailError("");
    }
  };

  const handleToChange = (e) => {
    const value = e.target.value;
    setTo(value);

    if (value && !validateEmail(value)) {
      setEmailError("Địa chỉ email không hợp lệ");
    } else {
      setEmailError("");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setError("");

    if (!to || !subject || !body) {
      setError("Vui lòng điền đầy đủ thông tin");
      setIsSending(false);
      return;
    }

    if (!validateEmail(to)) {
      setError("Địa chỉ email người nhận không hợp lệ");
      setIsSending(false);
      return;
    }

    try {
      await sendEmail(to, subject, body);
      // Close modal using the safe method
      closeModalSafely();

      // Show success toast
      window.showToast("Thành công", "Email đã được gửi", "success");
    } catch (err) {
      setError(
        "Lỗi khi gửi email: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="modal fade"
      id="composeModal"
      tabIndex="-1"
      aria-labelledby="composeModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content modal-dark">
          <div className="modal-header modal-header-dark">
            <h5 className="modal-title" id="composeModalLabel">
              Soạn email mới
            </h5>
            <button
              type="button"
              className="btn-close btn-close-light"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <form>
              <div className="mb-3">
                <label className="text-white" htmlFor="emailTo">
                  Người nhận:
                </label>
                <input
                  type="email"
                  className={`form-control form-control-dark ${
                    emailError ? "is-invalid" : ""
                  }`}
                  id="emailTo"
                  placeholder="Nhập địa chỉ email người nhận"
                  value={to}
                  onChange={handleToChange}
                />
                {emailError && (
                  <div className="invalid-feedback">{emailError}</div>
                )}
              </div>
              <div className="mb-3">
                <label className="text-white" htmlFor="emailSubject">
                  Tiêu đề:
                </label>
                <input
                  type="text"
                  className="form-control form-control-dark"
                  id="emailSubject"
                  placeholder="Nhập tiêu đề email"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="text-white" htmlFor="emailBody">
                  Nội dung:
                </label>
                <textarea
                  className="form-control form-control-dark"
                  id="emailBody"
                  rows="10"
                  placeholder="Nhập nội dung email"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                ></textarea>
              </div>
            </form>

            {analysisResult && (
              <div className="analysis-result mt-3">
                <div
                  className={`alert glass-card ${
                    analysisResult.classification === "spam"
                      ? "analysis-result-danger"
                      : "analysis-result-success"
                  }`}
                >
                  <h5>Kết quả phân tích:</h5>
                  <div className="d-flex align-items-center mb-2">
                    <strong className="me-2">Phân loại:</strong>
                    <span
                      className={`badge ${
                        analysisResult.classification === "spam"
                          ? "bg-danger"
                          : "bg-success"
                      } badge-classification`}
                    >
                      {analysisResult.classification === "spam"
                        ? "SPAM"
                        : "KHÔNG PHẢI SPAM"}
                    </span>
                  </div>

                  <div className="progress mb-2" style={{ height: "25px" }}>
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
                      {analysisResult.confidence}% độ tin cậy
                    </div>
                  </div>

                  <div className="alert alert-info mt-3">
                    <h6 className="mb-2">
                      <i className="fas fa-info-circle me-2"></i>Giải thích kết
                      quả phân tích:
                    </h6>
                    <p>
                      Thuật toán Naive Bayes đã phân tích nội dung email và
                      {analysisResult.classification === "spam"
                        ? " phân loại đây là email SPAM với độ tin cậy "
                        : " phân loại đây là email an toàn với độ tin cậy "}
                      <strong>{analysisResult.confidence}%</strong>.
                    </p>

                    <div className="card border-secondary mb-2">
                      <div className="card-header py-1 bg-light">
                        <strong>Cách thuật toán Naive Bayes hoạt động:</strong>
                      </div>
                      <div className="card-body py-2">
                        <small>
                          Thuật toán tính toán xác suất có điều kiện cho mỗi từ
                          trong email, so sánh xác suất xuất hiện trong email
                          spam và email thường, sau đó kết hợp các xác suất để
                          đưa ra quyết định cuối cùng.
                        </small>
                      </div>
                    </div>

                    {analysisResult.classification === "spam" ? (
                      <div>
                        <h6 className="mt-2 text-danger">
                          <i className="fas fa-exclamation-triangle me-1"></i>{" "}
                          Lý do phân loại là SPAM:
                        </h6>
                        <ul className="mb-0 ps-3">
                          <li>
                            Email chứa các từ khóa có xác suất cao xuất hiện
                            trong spam
                          </li>
                          {analysisResult.top_keywords &&
                            analysisResult.top_keywords.length > 0 && (
                              <li>
                                Các từ khóa đáng chú ý:{" "}
                                <strong>
                                  {analysisResult.top_keywords
                                    .slice(0, 3)
                                    .map((k) => k.word)
                                    .join(", ")}
                                </strong>
                              </li>
                            )}
                          {analysisResult.email_stats?.has_urls && (
                            <li>
                              Email chứa URL, một đặc điểm phổ biến trong email
                              spam
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <h6 className="mt-2 text-success">
                          <i className="fas fa-check-circle me-1"></i> Lý do
                          phân loại là KHÔNG PHẢI SPAM:
                        </h6>
                        <ul className="mb-0 ps-3">
                          <li>
                            Email chứa các từ khóa thường xuất hiện trong email
                            bình thường
                          </li>
                          {analysisResult.top_keywords &&
                            analysisResult.top_keywords.length > 0 && (
                              <li>
                                Các từ khóa đáng chú ý:{" "}
                                <strong>
                                  {analysisResult.top_keywords
                                    .slice(0, 3)
                                    .map((k) => k.word)
                                    .join(", ")}
                                </strong>
                              </li>
                            )}
                          {!analysisResult.email_stats?.has_urls && (
                            <li>Email không chứa URL, giảm khả năng là spam</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {analysisResult.top_keywords &&
                    analysisResult.top_keywords.length > 0 && (
                      <div className="mt-3">
                        <h6>
                          <i className="fas fa-key me-2"></i>Từ khóa ảnh hưởng
                          đến kết quả:
                        </h6>
                        <div>
                          {analysisResult.top_keywords
                            .slice(0, 5)
                            .map((keyword, index) => (
                              <span
                                key={index}
                                className="badge badge-keyword me-1 mb-1"
                                title="Từ khóa ảnh hưởng đến kết quả phân loại"
                              >
                                {keyword.word}
                              </span>
                            ))}
                        </div>
                        <small className="text-muted mt-1 d-block">
                          Các từ khóa này có trọng số cao trong việc xác định
                          email là spam hay không.
                        </small>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer modal-footer-dark">
            <button
              type="button"
              className="btn btn-glass-danger me-auto"
              onClick={closeModalSafely}
            >
              <i className="fas fa-times me-1"></i> Hủy
            </button>
            <button
              type="button"
              className="btn btn-glass-neutral"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !body}
            >
              {isAnalyzing ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Đang phân tích...
                </>
              ) : (
                <>
                  <i className="fas fa-search me-1"></i> Phân tích
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-glass-primary"
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Đang gửi...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-1"></i> Gửi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
