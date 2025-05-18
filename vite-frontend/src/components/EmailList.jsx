import React, { useState, useEffect, useRef } from "react";
import {
  getEmails,
  getSpamEmails,
  markAsSpam,
  markAsNotSpam,
  markAsRead,
  deleteEmail,
  addToDataset,
} from "../services/api.js";
import { Modal } from "bootstrap";
import "bootstrap";
import { Confirm } from "notiflix/build/notiflix-confirm-aio";
import { ScaleLoader, ClipLoader } from "react-spinners";

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

const EmailList = ({ type = "inbox" }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [datasetLabel, setDatasetLabel] = useState("");
  const [isAddingToDataset, setIsAddingToDataset] = useState(false);
  const emailModalRef = useRef(null);
  const modalInstance = useRef(null);

  const fetchEmails = async (query = "", token = null) => {
    setLoading(true);
    setError("");

    try {
      const response =
        type === "inbox"
          ? await getEmails(20, query, token)
          : await getSpamEmails(20, query, token);

      setEmails(response.data.emails);
      setNextPageToken(response.data.nextPageToken);
    } catch (err) {
      setError(
        "Lỗi khi tải email: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [type]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmails(searchQuery);
  };

  const handleLoadMore = () => {
    if (nextPageToken) {
      fetchEmails(searchQuery, nextPageToken);
    }
  };

  const handleEmailClick = async (email) => {
    if (!email.read) {
      try {
        await markAsRead(email.id);
        // Update the email in the list
        setEmails(
          emails.map((e) => (e.id === email.id ? { ...e, read: true } : e))
        );
      } catch (err) {
        console.error("Error marking email as read:", err);
      }
    }
    setSelectedEmail(email);
    setDatasetLabel(""); // Reset dataset label when viewing a new email

    // Show the modal using Bootstrap's Modal API
    if (emailModalRef.current) {
      if (!modalInstance.current) {
        modalInstance.current = new Modal(emailModalRef.current, {
          backdrop: false, // Tắt hoàn toàn backdrop theo yêu cầu
          keyboard: true,
        });
      }

      // Show the modal
      modalInstance.current.show();
    }
  };

  // Close modal and handle backdrop removal
  const closeModal = () => {
    try {
      if (modalInstance.current) {
        modalInstance.current.hide();
      }
      // Always reset selected email, even if modal closing fails
      setSelectedEmail(null);
    } catch (error) {
      console.log("Error closing modal:", error);
      // Still reset selected email
      setSelectedEmail(null);
    }
  };

  // Initialize modal event listener
  useEffect(() => {
    if (emailModalRef.current) {
      // Cấu hình modal với backdrop false theo yêu cầu
      if (!modalInstance.current) {
        modalInstance.current = new Modal(emailModalRef.current, {
          backdrop: false, // Tắt hoàn toàn backdrop theo yêu cầu
          keyboard: true,
        });
      }

      // Add event listener for when modal is hidden
      const handleModalHidden = () => {
        setSelectedEmail(null);
        setDatasetLabel("");
      };

      emailModalRef.current.addEventListener(
        "hidden.bs.modal",
        handleModalHidden
      );

      return () => {
        // Cleanup - dispose of the modal instance
        if (modalInstance.current) {
          modalInstance.current.dispose();
          modalInstance.current = null;
        }
        if (emailModalRef.current) {
          emailModalRef.current.removeEventListener(
            "hidden.bs.modal",
            handleModalHidden
          );
        }
      };
    }
  }, []);

  const handleMarkSpam = async (emailId) => {
    try {
      await markAsSpam(emailId);
      // Remove the email from the list if we're in inbox
      if (type === "inbox") {
        setEmails(emails.filter((email) => email.id !== emailId));
      }

      // Close the modal
      closeModal();

      window.showToast(
        "Thành công",
        "Email đã được đánh dấu là spam",
        "success"
      );
    } catch (err) {
      setError(
        "Lỗi khi đánh dấu email là spam: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleMarkNotSpam = async (emailId) => {
    try {
      await markAsNotSpam(emailId);
      // Remove the email from the list if we're in spam folder
      if (type === "spam") {
        setEmails(emails.filter((email) => email.id !== emailId));
      }

      // Close the modal
      closeModal();

      window.showToast(
        "Thành công",
        "Email đã được đánh dấu không phải là spam",
        "success"
      );
    } catch (err) {
      setError(
        "Lỗi khi bỏ đánh dấu email là spam: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleDeleteEmail = async (emailId) => {
    // Sử dụng Notiflix Confirm thay vì window.confirm
    Confirm.show(
      "Xóa email",
      "Bạn có chắc chắn muốn xóa email này không?",
      "Xóa",
      "Hủy",
      async () => {
        // Xử lý khi người dùng nhấn Xóa
        try {
          await deleteEmail(emailId);
          setEmails(emails.filter((email) => email.id !== emailId));

          // Close the modal
          closeModal();

          window.showToast("Thành công", "Email đã được xóa", "success");
        } catch (err) {
          setError(
            "Lỗi khi xóa email: " + (err.response?.data?.error || err.message)
          );
        }
      },
      () => {
        // Xử lý khi người dùng nhấn Hủy (không cần làm gì)
      },
      {
        // Tùy chỉnh giao diện
        titleColor: "#dc3545",
        okButtonBackground: "#dc3545",
        borderRadius: "8px",
        width: "320px",
        messageMaxLength: 500,
        // Bỏ gạch chân cho các nút
        buttonsFontSize: "14px",
        buttonsTextDecoration: "none",
        cssAnimationStyle: "zoom",
      }
    );
  };

  const handleAddToDataset = async () => {
    if (!datasetLabel) {
      window.showToast("Lỗi", "Vui lòng chọn nhãn cho dữ liệu", "error");
      return;
    }

    if (!selectedEmail) {
      window.showToast("Lỗi", "Không có email được chọn", "error");
      return;
    }

    setIsAddingToDataset(true);

    try {
      // Xử lý nội dung email trước khi thêm vào dataset
      // Ưu tiên sử dụng plain_content nếu có
      let plainContent = "";

      if (selectedEmail.plain_content && selectedEmail.plain_content.trim()) {
        // Nếu có plain_content, vẫn cần loại bỏ các thẻ HTML có thể còn sót lại
        plainContent = stripHtmlTags(selectedEmail.plain_content);
      } else {
        // Nếu không có plain_content, sử dụng content và loại bỏ HTML
        plainContent = stripHtmlTags(selectedEmail.content);
      }

      // Loại bỏ các ký tự đặc biệt và khoảng trắng thừa
      plainContent = plainContent.replace(/\s+/g, " ").trim();

      await addToDataset(selectedEmail.subject, plainContent, datasetLabel);

      // Hiển thị thông báo thành công ngay lập tức
      window.showToast(
        "Thành công",
        "Đã thêm email vào tập huấn luyện thành công!",
        "success"
      );

      // Reset trạng thái của form, không đóng modal
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
    <div className="email-container">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="email-toolbar glass-card">
        <div
          className="toolbar-left"
          style={{
            flex: "2",
            gap: "5px",
          }}
        >
          <form className="search-form" onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="text"
                className="form-control rounded-pill"
                placeholder="Tìm kiếm email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <button
            className="btn btn-outline-secondary ms-2 rounded-pill"
            onClick={handleSearch}
          >
            <i className="fas fa-search"></i>
          </button>
        </div>
        <div className="toolbar-right">
          <button
            className="btn btn-sm btn-glass-secondary"
            onClick={() => fetchEmails()}
          >
            <i className="fas fa-sync-alt"></i> Làm mới
          </button>
        </div>
      </div>

      <div className="email-list-container">
        <div className="email-list full-width">
          {loading ? (
            <div className="d-flex flex-column justify-content-center align-items-center p-5">
              <ScaleLoader size={50} color="var(--text-high)" loading={true} />
              <p className="mt-3">Đang tải email...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center p-5">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <p>Không có email nào</p>
            </div>
          ) : (
            <>
              <ul className="list-group">
                {emails.map((email) => (
                  <li
                    key={email.id}
                    className={`list-group-item ${!email.read ? "unread" : ""}`}
                    onClick={() => handleEmailClick(email)}
                  >
                    <div className="email-content">
                      <div className="email-header">
                        <span className="email-sender">{email.sender}</span>
                        <span className="email-date">{email.date}</span>
                      </div>
                      <div className="email-subject">{email.subject}</div>
                      <div className="email-body">
                        <div>
                          {/* Sử dụng hàm stripHtmlTags cải tiến để hiển thị nội dung email */}
                          {(() => {
                            // Ưu tiên sử dụng plain_content nếu có
                            const textContent = email.plain_content
                              ? stripHtmlTags(email.plain_content)
                              : stripHtmlTags(email.content);

                            // Giới hạn độ dài và thêm dấu ... ở cuối
                            return textContent.length > 100
                              ? textContent.substring(0, 100) + "..."
                              : textContent;
                          })()}
                        </div>
                        <div className="email-classification-badges">
                          {email.classification === "spam" ? (
                            <span className="badge badge-danger">
                              Spam ({email.confidence}%)
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              Ham ({email.confidence}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {nextPageToken && (
                <div className="text-center p-3">
                  <button
                    className="btn-base btn-primary glass-effect"
                    onClick={handleLoadMore}
                  >
                    Tải thêm
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Email Detail Modal */}
        <div
          className="modal fade"
          id="emailDetailModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="emailDetailModalLabel"
          aria-hidden="true"
          ref={emailModalRef}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered"
            role="document"
          >
            <div className="modal-content modal-dark">
              {selectedEmail && (
                <>
                  <div className="modal-header modal-header-dark">
                    <h5 className="modal-title" id="emailDetailModalLabel">
                      {selectedEmail.subject}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-light"
                      onClick={closeModal}
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body p-0">
                    <div className="row g-0">
                      {/* Left column - Email content */}
                      <div className="col-md-8 border-end">
                        {/* Header cố định */}
                        <div className="email-detail-meta glass">
                          <div className="email-detail-sender">
                            <strong>Từ:</strong> {selectedEmail.sender}
                          </div>
                          <div className="email-detail-date">
                            <strong>Ngày:</strong> {selectedEmail.date}
                          </div>
                        </div>

                        {/* Phần nội dung có thể cuộn */}
                        <div className="email-detail-body">
                          {/* Tab điều hướng để chuyển đổi giữa HTML và Plain Text */}
                          <ul
                            className="nav nav-tabs nav-tabs-dark"
                            id="emailContentTabs"
                            role="tablist"
                          >
                            <li className="nav-item" role="presentation">
                              <button
                                className="nav-link active"
                                id="html-tab"
                                data-bs-toggle="tab"
                                data-bs-target="#html-content"
                                type="button"
                                role="tab"
                                aria-controls="html-content"
                                aria-selected="true"
                              >
                                HTML
                              </button>
                            </li>
                            <li className="nav-item" role="presentation">
                              <button
                                className="nav-link"
                                id="text-tab"
                                data-bs-toggle="tab"
                                data-bs-target="#text-content"
                                type="button"
                                role="tab"
                                aria-controls="text-content"
                                aria-selected="false"
                              >
                                Plain Text
                              </button>
                            </li>
                          </ul>

                          {/* Nội dung tab */}
                          <div
                            className="tab-content"
                            id="emailContentTabsContent"
                          >
                            {/* Tab HTML */}
                            <div
                              className="tab-pane fade show active"
                              id="html-content"
                              role="tabpanel"
                              aria-labelledby="html-tab"
                            >
                              <div
                                className="email-content-wrapper"
                                dangerouslySetInnerHTML={{
                                  __html: selectedEmail.content,
                                }}
                              ></div>
                            </div>

                            {/* Tab Plain Text */}
                            <div
                              className="tab-pane fade"
                              id="text-content"
                              role="tabpanel"
                              aria-labelledby="text-tab"
                            >
                              <div className="email-content-wrapper plain-text">
                                <pre
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "inherit",
                                  }}
                                >
                                  {selectedEmail.plain_content
                                    ? stripHtmlTags(selectedEmail.plain_content)
                                    : stripHtmlTags(selectedEmail.content)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right column - Evaluation and dataset */}
                      <div className="col-md-4">
                        <div className="p-3">
                          {/* Classification result */}
                          <div className="card mb-3 glass-card">
                            <div className="card-header glass">
                              <h5 className="card-title mb-0">
                                <i className="fas fa-shield-alt me-2"></i>
                                Kết quả phân loại
                              </h5>
                            </div>
                            <div className="card-body glass-bg-light">
                              <div className="d-flex align-items-center mb-2">
                                <strong className="me-2">Phân loại:</strong>
                                <span
                                  className={`badge ${
                                    selectedEmail.classification === "spam"
                                      ? "bg-danger"
                                      : "bg-success"
                                  } badge-classification`}
                                >
                                  {selectedEmail.classification === "spam"
                                    ? "SPAM"
                                    : "KHÔNG PHẢI SPAM"}
                                </span>
                              </div>

                              <div className="mt-3">
                                <label className="form-label fw-bold">
                                  Độ tin cậy: {selectedEmail.confidence}%
                                </label>
                                <div
                                  className="progress"
                                  style={{ height: "20px" }}
                                >
                                  <div
                                    className={`progress-bar ${
                                      selectedEmail.classification === "spam"
                                        ? "bg-danger"
                                        : "bg-success"
                                    }`}
                                    role="progressbar"
                                    style={{
                                      width: `${selectedEmail.confidence}%`,
                                    }}
                                    aria-valuenow={selectedEmail.confidence}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  >
                                    {selectedEmail.confidence}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Explanation */}
                          <div className="card mb-3 glass-card">
                            <div className="card-header card-header-info">
                              <i className="fas fa-info-circle me-2"></i>
                              Giải thích kết quả
                            </div>
                            <div className="card-body">
                              {selectedEmail.classification === "spam" ? (
                                <div>
                                  <h6 className="fw-bold text-danger">
                                    Lý do phân loại là SPAM:
                                  </h6>
                                  <ul className="mb-0">
                                    <li>
                                      Email chứa các từ khóa có xác suất cao
                                      xuất hiện trong spam
                                    </li>
                                    {selectedEmail.email_stats?.has_urls && (
                                      <li>
                                        Email chứa URL, một đặc điểm phổ biến
                                        trong email spam
                                      </li>
                                    )}
                                    {selectedEmail.email_stats
                                      ?.uppercase_ratio > 0.3 && (
                                      <li>
                                        Email có tỷ lệ chữ hoa cao (
                                        {(
                                          selectedEmail.email_stats
                                            ?.uppercase_ratio * 100
                                        ).toFixed(1)}
                                        %), thường thấy trong spam
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              ) : (
                                <div>
                                  <h6 className="fw-bold text-white">
                                    Lý do phân loại là KHÔNG PHẢI SPAM:
                                  </h6>
                                  <ul className="mb-0">
                                    <li>
                                      Email chứa các từ khóa thường xuất hiện
                                      trong email bình thường
                                    </li>
                                    {!selectedEmail.email_stats?.has_urls && (
                                      <li>
                                        Email không chứa URL, giảm khả năng là
                                        spam
                                      </li>
                                    )}
                                    {selectedEmail.email_stats
                                      ?.uppercase_ratio < 0.2 && (
                                      <li>
                                        Email có tỷ lệ chữ hoa thấp, phù hợp với
                                        email bình thường
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Email stats */}
                          <div className="card mb-3 glass-card">
                            <div className="card-header card-header-secondary">
                              <i className="fas fa-chart-bar me-2"></i>Thống kê
                              email
                            </div>
                            <div className="card-body">
                              <ul className="list-group list-group-flush">
                                <li className="list-group-item list-group-item-dark d-flex justify-content-between align-items-center text-white">
                                  Độ dài
                                  <span className="badge bg-primary rounded-pill">
                                    {selectedEmail.email_stats?.total_length ||
                                      "N/A"}{" "}
                                    ký tự
                                  </span>
                                </li>
                                <li className="list-group-item list-group-item-dark d-flex justify-content-between align-items-center text-white">
                                  Số từ
                                  <span className="badge bg-primary rounded-pill">
                                    {selectedEmail.email_stats?.word_count ||
                                      "N/A"}
                                  </span>
                                </li>
                                <li className="list-group-item list-group-item-dark d-flex justify-content-between align-items-center text-white">
                                  Tỷ lệ chữ hoa
                                  <span className="badge bg-primary rounded-pill">
                                    {selectedEmail.email_stats?.uppercase_ratio?.toFixed(
                                      2
                                    ) || "N/A"}
                                  </span>
                                </li>
                                <li className="list-group-item list-group-item-dark d-flex justify-content-between align-items-center text-white">
                                  Có URL
                                  <span
                                    className={`badge ${
                                      selectedEmail.email_stats?.has_urls
                                        ? "bg-warning"
                                        : "bg-success"
                                    } rounded-pill`}
                                  >
                                    {selectedEmail.email_stats?.has_urls
                                      ? "Có"
                                      : "Không"}
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>

                          {/* Keywords section - only show if available */}
                          {selectedEmail.top_keywords &&
                            selectedEmail.top_keywords.length > 0 && (
                              <div className="card mb-3 glass-effect-medium">
                                <div className="card-header card-header-dark">
                                  <i className="fas fa-key me-2"></i>Từ khóa ảnh
                                  hưởng
                                </div>
                                <div className="card-body">
                                  <p className="text-muted small mb-2">
                                    Các từ khóa có ảnh hưởng đến việc xác định
                                    email:
                                  </p>
                                  <div>
                                    {selectedEmail.top_keywords
                                      .slice(0, 5)
                                      .map((keyword, index) => (
                                        <span
                                          key={index}
                                          className="badge badge-keyword me-1 mb-1"
                                          title={`Mức độ ảnh hưởng: ${Math.abs(
                                            keyword.impact
                                          ).toFixed(2)}`}
                                        >
                                          {keyword.word}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            )}

                          {/* Add to dataset */}
                          <div className="card mb-3 glass-card">
                            <div className="card-header card-header-primary">
                              <i className="fas fa-database me-2"></i>
                              Thêm vào tập dữ liệu
                            </div>
                            <div className="card-body">
                              <p className="text-muted small">
                                Nếu kết quả phân loại không chính xác, bạn có
                                thể thêm email này vào tập dữ liệu huấn luyện
                                với nhãn đúng.
                              </p>
                              <div className="mb-3">
                                <label className="form-label">Chọn nhãn:</label>
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
                                    >
                                      Spam
                                    </label>
                                  </div>
                                </div>
                              </div>
                              <button
                                className="btn btn-glass-primary w-100"
                                onClick={handleAddToDataset}
                                disabled={isAddingToDataset || !datasetLabel}
                              >
                                {isAddingToDataset ? (
                                  <div className="d-flex align-items-center justify-content-center">
                                    <ClipLoader
                                      size={16}
                                      color="#4285f4"
                                      loading={true}
                                      aria-label="Loading Spinner"
                                    />
                                    <span className="ms-2">Đang thêm...</span>
                                  </div>
                                ) : (
                                  <>
                                    <i className="fas fa-plus-circle me-1"></i>{" "}
                                    Thêm vào tập dữ liệu
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer modal-footer-dark">
                    <button
                      type="button"
                      className="btn btn-glass-danger me-auto"
                      onClick={closeModal}
                    >
                      <i className="fas fa-times me-1"></i> Đóng
                    </button>
                    {type === "inbox" ? (
                      <button
                        className="btn btn-glass-danger"
                        onClick={() => handleMarkSpam(selectedEmail.id)}
                      >
                        <i className="fas fa-exclamation-triangle me-1"></i>{" "}
                        Đánh dấu là spam
                      </button>
                    ) : (
                      <button
                        className="btn btn-glass-success"
                        onClick={() => handleMarkNotSpam(selectedEmail.id)}
                      >
                        <i className="fas fa-check me-1"></i> Không phải spam
                      </button>
                    )}
                    <button
                      className="btn btn-glass-neutral"
                      onClick={() => handleDeleteEmail(selectedEmail.id)}
                    >
                      <i className="fas fa-trash-alt me-1"></i> Xóa
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailList;
