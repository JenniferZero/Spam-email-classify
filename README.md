# Phân Loại Email Spam

Ứng dụng này là một hệ thống phân loại email spam sử dụng học máy để phát hiện và quản lý email spam trong tài khoản Gmail của bạn. Ứng dụng sử dụng Gmail API với OAuth 2.0 để kết nối an toàn với Gmail, cho phép bất kỳ người dùng nào cũng có thể sử dụng ứng dụng mà không cần cấu hình phức tạp.

## Tính Năng

- Tích hợp với Gmail thông qua Gmail API với xác thực OAuth 2.0
- Đăng nhập an toàn với tài khoản Google mà không cần cung cấp mật khẩu
- Phát hiện spam dựa trên học máy với mô hình Naive Bayes
- Phân tích và phân loại email tự động
- Theo dõi thống kê và hiệu suất mô hình
- Giao diện người dùng thân thiện dựa trên React và Vite
- Sử dụng Bootstrap 5 và React-Toastify cho trải nghiệm người dùng tốt hơn

## Cấu Trúc Dự Án

### Backend (Python/Flask)

- `app.py`: API backend Flask, xử lý các yêu cầu từ frontend, xử lý đăng nhập OAuth và điều phối các dịch vụ
- `gmail_oauth.py`: Tích hợp Gmail API với OAuth 2.0, xử lý việc đọc, gửi và quản lý email
- `naive_bayes.py`: Mô hình học máy Naive Bayes cho việc phân loại spam, được huấn luyện trên dữ liệu tiếng Việt
- `client_secret.json`: File chứa thông tin xác thực OAuth 2.0 cho Gmail API
- `spam_data.csv`: Dữ liệu huấn luyện cho mô hình phân loại spam
- `templates/`: Thư mục chứa các template HTML (không sử dụng trong phiên bản hiện tại)
- `static/`: Thư mục chứa các tài nguyên tĩnh (CSS, JS, hình ảnh)

### Frontend (React + Vite)

- `vite-frontend/`: Ứng dụng frontend React sử dụng Vite
  - `src/components/`: Các component React (EmailList, ComposeModal, EmailAnalyzer, Stats, Sidebar)
  - `src/pages/`: Các trang React (InboxPage, SpamPage, AnalyzerPage, StatsPage, LoginPage)
  - `src/services/`: Các dịch vụ API để giao tiếp với backend
  - `src/assets/`: Tài nguyên như CSS, hình ảnh và logo
  - `dist/`: Thư mục chứa các tệp build của ứng dụng (được tạo sau khi build)

## Luồng Xử Lý Dữ Liệu

1. **Đăng nhập với OAuth 2.0**:

   - Người dùng nhấp vào nút "Đăng nhập với Google"
   - Hệ thống chuyển hướng người dùng đến trang xác thực của Google
   - Người dùng đăng nhập vào tài khoản Google và cấp quyền cho ứng dụng
   - Google chuyển hướng người dùng trở lại ứng dụng với mã xác thực
   - Ứng dụng sử dụng mã xác thực để lấy token truy cập và lưu vào phiên làm việc

2. **Quản lý Email**:

   - Đọc email từ Gmail thông qua Gmail API (hộp thư đến và thư mục spam)
   - Phân tích nội dung email để trích xuất đặc trưng
   - Áp dụng mô hình Naive Bayes để dự đoán xác suất spam
   - Hiển thị kết quả cho người dùng với giao diện trực quan

3. **Phân Tích Email**:

   - Người dùng có thể phân tích nội dung email mới
   - Mô hình dự đoán xác suất spam và hiển thị các từ khóa quan trọng
   - Người dùng có thể thêm email vào tập dữ liệu huấn luyện

4. **Thống Kê và Hiệu Suất**:
   - Hiển thị thống kê về số lượng email spam/ham
   - Theo dõi hiệu suất mô hình (độ chính xác, độ nhạy, độ đặc hiệu)
   - Biểu đồ trực quan hóa phân phối email theo thời gian

## Cài Đặt và Thiết Lập

### Yêu Cầu Hệ Thống

- Python 3.7+
- Node.js và npm
- Tài khoản Google
- Dự án Google Cloud với Gmail API được bật

### Thiết Lập Backend

1. Cài đặt các thư viện Python:

   ```
   pip install flask scikit-learn pandas underthesea google-auth google-auth-oauthlib google-api-python-client
   ```

2. Thiết lập OAuth 2.0 cho Gmail API:

   - Truy cập [Google Cloud Console](https://console.cloud.google.com/)
   - Tạo dự án mới hoặc chọn dự án hiện có
   - Bật Gmail API
   - Tạo OAuth Client ID:
     - Chọn "Create Credentials" > "OAuth client ID"
     - Chọn "Web application" làm Application type
     - Thêm cả hai URI sau vào Authorized redirect URIs:
       - `http://localhost:5000/oauth2callback`
       - `http://127.0.0.1:5000/oauth2callback`
     - Tải xuống file JSON và đổi tên thành `client_secret.json`
     - Đặt file `client_secret.json` vào thư mục gốc của dự án

3. Cấp quyền truy cập

   - Truy cập [Google Cloud Console](https://console.cloud.google.com/)
   - Chọn dự án hiện có
   - Vào mục APIs & Services -> chọn OAuth consent screen
   - Chọn loại cho ứng dụng (2 cách là Publish hoặc Test)
   - Nếu chọn Publish -> Bất kì người dùng nào cũng có thể truy cập (Cần phải đợi duyệt và cần cấu hình)
   - Nếu chọn Test -> Add User(Email) vào để cấp quyền truy cập vào project.

4. Truy cập ứng dụng tại `http://localhost:5000`

## Cách Sử Dụng

1. **Khởi động ứng dụng**:

   1. Cách 1

   - Khởi động terminal và cd vite-frontend rồi chạy `npm install` để cài đặt các thư viện Node.js
   - Chạy file `run_app.bat`
   - Ứng dụng sẽ chạy trên http://localhost:5000

   2. Cách 2

   - Khởi động terminal và cd vite-frontend rồi chạy `npm install` để cài đặt các thư viện Node.js
   - cd vite-frontend rồi chạy `npm run build` để build frontend
   - cd trở lại thư mục gốc rồi chạy `python app.py` để build backend
   - Ứng dụng sẽ chạy trên http://localhost:5000

2. **Đăng nhập với Google**:

   - Truy cập ứng dụng và nhấp vào nút "Đăng nhập với Google"
   - Hệ thống sẽ chuyển hướng bạn đến trang xác thực của Google
   - Đăng nhập vào tài khoản Google và cấp quyền cho ứng dụng
   - Sau khi xác thực, bạn sẽ được chuyển hướng trở lại ứng dụng

### Xử lý lỗi OAuth

Nếu bạn gặp lỗi "redirect_uri_mismatch" khi đăng nhập:

1. Kiểm tra lại các URI chuyển hướng trong Google Cloud Console:

   - Đảm bảo đã thêm cả `http://localhost:5000/oauth2callback` và `http://127.0.0.1:5000/oauth2callback`
   - Đảm bảo URI trong file `gmail_oauth.py` khớp với URI đã đăng ký

2. Xóa cache trình duyệt và cookie:

   - Xóa cache và cookie của trình duyệt
   - Thử đăng nhập lại

3. Kiểm tra console của ứng dụng để xem thông báo lỗi chi tiết

### Sử dụng ứng dụng

- Xem và quản lý email trong hộp thư đến
- Kiểm tra email spam trong thư mục spam
- Phân tích nội dung email để xác định xem đó có phải là spam hay không
- Xem thống kê về email và hiệu suất của mô hình
- Soạn và gửi email mới từ giao diện ứng dụng

## Công Nghệ Sử Dụng

- **Backend**:

  - Flask: Framework web Python
  - Gmail API: API chính thức của Google để truy cập Gmail
  - OAuth 2.0: Giao thức xác thực an toàn
  - scikit-learn: Thư viện học máy cho mô hình Naive Bayes
  - pandas: Xử lý dữ liệu
  - underthesea: Xử lý ngôn ngữ tiếng Việt

- **Frontend**:

  - React: Thư viện JavaScript cho giao diện người dùng
  - Vite: Công cụ build và phát triển
  - Bootstrap 5: Framework CSS
  - React Router: Định tuyến trong ứng dụng React
  - React-Toastify: Hiển thị thông báo
  - Font Awesome: Thư viện biểu tượng

- **Lưu Trữ Dữ Liệu**:
  - Pickle: Lưu mô hình Naive Bayes
  - Flask Session: Lưu thông tin phiên làm việc và token xác thực
  - CSV: Lưu dữ liệu huấn luyện

## Giấy Phép

Dự án này được cấp phép theo Giấy phép MIT - xem tệp LICENSE để biết chi tiết.

## Thành viên thực hiện

- Trần Công Minh
- Nguyễn Hữu Thắng
- Lê Đức Trung
