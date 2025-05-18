from flask import Flask, render_template, jsonify, request, send_from_directory, session, redirect, url_for
from flask_cors import CORS
import os.path
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from naive_bayes import train_model, classify_email, preprocess_text, load_stopwords
import pandas as pd
from datetime import datetime
from collections import Counter
import sys
import io
import traceback

# Import Gmail OAuth service
from gmail_oauth import (
    get_authorization_url, get_credentials_from_code, get_gmail_service,
    get_emails, move_to_spam, move_to_inbox, send_email, mark_as_read,
    delete_email, get_mailbox_stats
)

# Thiết lập hỗ trợ UTF-8 cho stdout và stderr nếu cần thiết
if hasattr(sys.stdout, 'buffer') and not isinstance(sys.stdout, io.TextIOWrapper) or getattr(sys.stdout, 'encoding', '').lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'buffer') and not isinstance(sys.stderr, io.TextIOWrapper) or getattr(sys.stderr, 'encoding', '').lower() != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Set up Flask to serve Vite app
app = Flask(__name__, static_folder='vite-frontend/dist/assets', template_folder='vite-frontend/dist')
# Enable CORS for all routes
CORS(app, supports_credentials=True)
# Cấu hình session
app.secret_key = os.urandom(24)  # Cần thiết cho session
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 giờ
app.json.ensure_ascii = False  # Đảm bảo JSON không chuyển đổi ký tự Unicode thành chuỗi \uXXXX

# Đường dẫn lưu mô hình và vectorizer
MODEL_PATH = 'spam_model.pkl'
VECTORIZER_PATH = 'vectorizer.pkl'

# Biến toàn cục cho model và vectorizer
MODEL, VECTORIZER = None, None

def initialize_model(csv_file='spam_data.csv'):
    """Khởi tạo model và vectorizer một lần duy nhất."""
    global MODEL, VECTORIZER
    if MODEL is None or VECTORIZER is None:
        try:
            MODEL, VECTORIZER = train_model(csv_file)
        except Exception as e:
            print(f"Lỗi khi khởi tạo mô hình: {str(e)}")
            traceback.print_exc()
            raise
    return MODEL, VECTORIZER

# Serve Vite App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve the Vite app for all routes except API endpoints."""
    if path != "" and os.path.exists(os.path.join(app.template_folder, path)):
        return send_from_directory(app.template_folder, path)
    return render_template('index.html')

# Hàm này đã không còn sử dụng với OAuth 2.0

# Route đăng nhập với Google OAuth
@app.route('/login')
def login():
    """Chuyển hướng người dùng đến trang xác thực Google."""
    try:
        # Tạo URL xác thực
        authorization_url = get_authorization_url()
        if not authorization_url:
            return jsonify({'error': 'Không thể tạo URL xác thực'}), 500

        # Chuyển hướng đến trang xác thực Google
        return redirect(authorization_url)
    except Exception as e:
        print(f"Lỗi khi tạo URL xác thực: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Route xử lý callback từ Google OAuth
@app.route('/oauth2callback')
def oauth2callback():
    """Xử lý callback từ Google OAuth."""
    try:
        # In ra các tham số nhận được để debug
        print("OAuth callback received params:", request.args)

        # Kiểm tra xem có lỗi không
        if 'error' in request.args:
            error_msg = request.args.get('error')
            print(f"OAuth error: {error_msg}")
            return jsonify({'error': f'Lỗi xác thực OAuth: {error_msg}'}), 400

        # Kiểm tra state để ngăn CSRF (bỏ qua nếu không có state trong session)
        if 'state' in session and request.args.get('state') != session.get('state'):
            return redirect('/login')

        # Lấy credentials từ authorization code
        code = request.args.get('code')
        if not code:
            return jsonify({'error': 'Không nhận được mã xác thực'}), 400

        credentials = get_credentials_from_code(code)

        if not credentials:
            return jsonify({'error': 'Không thể lấy thông tin xác thực'}), 500

        # Lưu credentials vào session
        from gmail_oauth import save_credentials
        save_credentials(credentials)

        # Lấy thông tin người dùng
        service = get_gmail_service()
        if not service:
            return jsonify({'error': 'Không thể kết nối đến Gmail API'}), 500

        user_info = service.users().getProfile(userId='me').execute()

        # Lưu thông tin người dùng vào session
        session['user'] = {
            'email': user_info['emailAddress'],
            'username': user_info['emailAddress'].split('@')[0]
        }

        # Chuyển hướng về trang chủ
        return redirect('/')
    except Exception as e:
        print(f"Lỗi trong OAuth callback: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# API đăng nhập (giữ lại cho tương thích ngược)
@app.route('/api/login', methods=['POST'])
def api_login():
    """API đăng nhập người dùng (legacy)."""
    # Chuyển hướng đến đăng nhập OAuth
    return jsonify({
        'success': False,
        'redirect': True,
        'message': 'Sử dụng đăng nhập Google',
        'url': url_for('login', _external=True)
    })

# API đăng ký (giữ lại cho tương thích ngược)
@app.route('/api/register', methods=['POST'])
def register():
    """API đăng ký người dùng mới (legacy)."""
    # Chuyển hướng đến đăng nhập OAuth
    return jsonify({
        'success': False,
        'redirect': True,
        'message': 'Sử dụng đăng nhập Google',
        'url': url_for('login', _external=True)
    })

# API đăng xuất
@app.route('/api/logout', methods=['POST'])
def logout():
    """API đăng xuất người dùng."""
    try:
        # Xóa thông tin người dùng và credentials khỏi session
        session.pop('user', None)
        session.pop('credentials', None)
        session.pop('state', None)
        return jsonify({'success': True, 'message': 'Đăng xuất thành công'})
    except Exception as e:
        print(f"Lỗi đăng xuất: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# API kiểm tra trạng thái đăng nhập
@app.route('/api/check-auth')
def check_auth():
    """API kiểm tra trạng thái đăng nhập."""
    try:
        if 'credentials' in session and 'user' in session:
            # Kiểm tra xem credentials còn hợp lệ không
            service = get_gmail_service()
            if service:
                return jsonify({
                    'authenticated': True,
                    'username': session['user']['username'],
                    'email': session['user']['email']
                })

        # Nếu không có credentials hoặc không hợp lệ
        return jsonify({'authenticated': False})
    except Exception as e:
        print(f"Lỗi kiểm tra đăng nhập: {str(e)}")
        traceback.print_exc()
        return jsonify({'authenticated': False, 'error': str(e)})

@app.route('/emails')
def get_emails_route():
    """API lấy và phân loại email."""
    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        max_results = request.args.get('max', 20, type=int)
        search_query = request.args.get('q', '')
        page_token = request.args.get('pageToken', None)  # None thay vì chuỗi rỗng

        # Lấy Gmail service
        service = get_gmail_service()
        if not service:
            return jsonify({'error': 'Lỗi xác thực, vui lòng đăng nhập lại'}), 401

        # Lấy email từ INBOX
        result = get_emails(service, max_results, search_query, page_token, label_ids=['INBOX'])

        # Kiểm tra lỗi từ kết quả
        if 'error' in result:
            return jsonify({'error': result['error']}), 500

        # Trả về trực tiếp kết quả từ get_emails
        return jsonify({
            'emails': result['emails'],
            'nextPageToken': result['nextPageToken']
        })
    except Exception as e:
        print(f"Lỗi khi lấy emails: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/mark_spam', methods=['POST'])
def mark_spam():
    """API để đánh dấu email là spam."""
    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        data = request.json
        email_id = data.get('email_id')

        if not email_id:
            return jsonify({'error': 'ID email không được cung cấp'}), 400

        # Lấy Gmail service
        service = get_gmail_service()
        if not service:
            return jsonify({'error': 'Lỗi xác thực, vui lòng đăng nhập lại'}), 401

        success = move_to_spam(service, email_id)

        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Không thể đánh dấu email là spam'}), 500
    except Exception as e:
        print(f"Lỗi khi đánh dấu email là spam: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/mark_not_spam', methods=['POST'])
def mark_not_spam():
    """API để bỏ đánh dấu email là spam."""
    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        data = request.json
        email_id = data.get('email_id')

        if not email_id:
            return jsonify({'error': 'ID email không được cung cấp'}), 400

        # Lấy Gmail service
        service = get_gmail_service()
        if not service:
            return jsonify({'error': 'Lỗi xác thực, vui lòng đăng nhập lại'}), 401

        success = move_to_inbox(service, email_id)

        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Không thể bỏ đánh dấu email là spam'}), 500
    except Exception as e:
        print(f"Lỗi khi bỏ đánh dấu email là spam: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# API endpoint for stats - no template rendering needed

@app.route('/api/list-mailboxes')
def list_mailboxes_route():
    """API để liệt kê tất cả các thư mục trong Gmail."""
    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        # Lấy Gmail service
        service = get_gmail_service()
        if not service:
            return jsonify({'error': 'Lỗi xác thực, vui lòng đăng nhập lại'}), 401

        # Lấy danh sách thư mục
        labels = service.users().labels().list(userId='me').execute().get('labels', [])
        mailboxes = [label['name'] for label in labels]
        return jsonify({'mailboxes': mailboxes})
    except Exception as e:
        print(f"Lỗi khi liệt kê thư mục: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """API lấy thống kê về email."""
    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        # Lấy Gmail service
        service = get_gmail_service()
        if not service:
            return jsonify({'error': 'Lỗi xác thực, vui lòng đăng nhập lại'}), 401

        model, vectorizer = initialize_model()

        # Lấy thống kê hộp thư
        stats = get_mailbox_stats(service)
        inbox_count = stats['inbox_count']
        spam_count = stats['spam_count']

        # Lấy email từ cả INBOX và SPAM
        inbox_emails_result = get_emails(service, 100, label_ids=['INBOX'])
        spam_emails_result = get_emails(service, 100, label_ids=['SPAM'])
        spam_emails = spam_emails_result['emails']

        # Kết hợp danh sách email
        recent_emails = inbox_emails_result['emails'] + spam_emails
        recent_spam_detected = sum(1 for email in recent_emails if email['classification'] == 'spam')

        confidence_levels = {'high': 0, 'medium': 0, 'low': 0}
        for email in recent_emails:
            if email['classification'] == 'spam':
                if email['confidence'] > 90:
                    confidence_levels['high'] += 1
                elif email['confidence'] > 70:
                    confidence_levels['medium'] += 1
                else:
                    confidence_levels['low'] += 1

        data = pd.read_csv('spam_data.csv')
        training_size = len(data)
        X = data['text'].apply(preprocess_text)
        y = data['label']
        _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_test_vec = vectorizer.transform(X_test)
        y_pred = model.predict(X_test_vec)
        accuracy = accuracy_score(y_test, y_pred)

        # Tính các chỉ số hiệu suất
        precision = precision_score(y_test, y_pred, pos_label='spam')
        recall = recall_score(y_test, y_pred, pos_label='spam')
        f1 = f1_score(y_test, y_pred, pos_label='spam')
        conf_matrix = confusion_matrix(y_test, y_pred, labels=['ham', 'spam']).tolist()

        # Đã loại bỏ chức năng biểu đồ xu hướng theo thời gian

        # Phân tích các mẫu spam phổ biến dựa trên dữ liệu thực
        spam_df = data[data['label'] == 'spam']

        # Tìm các mẫu phổ biến trong tiêu đề và nội dung email spam
        common_patterns = [
            'khuyến mãi', 'trúng thưởng', 'thanh toán', 'tài khoản', 'cập nhật',
            'miễn phí', 'giảm giá', 'quà tặng', 'khẩn cấp', 'xác nhận', 'hết hạn'
        ]

        # Đếm các mẫu spam phổ biến
        pattern_counts = {}
        for text in spam_df['text']:
            text_lower = str(text).lower()
            for pattern in common_patterns:
                if pattern in text_lower:
                    pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1

        # Chuyển đổi thành danh sách các mẫu và tần suất
        spam_patterns = []
        for pattern, count in sorted(pattern_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
            # Chuyển đổi pattern thành dạng tiêu đề (viết hoa chữ cái đầu)
            formatted_pattern = ' '.join(word.capitalize() for word in pattern.split())
            spam_patterns.append({
                'pattern': formatted_pattern,
                'frequency': count
            })

        # Nếu không có đủ dữ liệu, thêm các mẫu mặc định
        if len(spam_patterns) < 5:
            default_patterns = [
                {'pattern': 'Khuyến mãi đặc biệt', 'frequency': 35},
                {'pattern': 'Trúng thưởng', 'frequency': 28},
                {'pattern': 'Thanh toán gấp', 'frequency': 22},
                {'pattern': 'Tài khoản bị khóa', 'frequency': 18},
                {'pattern': 'Cập nhật thông tin', 'frequency': 15}
            ]
            # Thêm các mẫu mặc định vào danh sách nếu cần
            for pattern in default_patterns:
                if len(spam_patterns) < 5 and not any(p['pattern'] == pattern['pattern'] for p in spam_patterns):
                    spam_patterns.append(pattern)

        # Phân tích từ khóa phổ biến trong spam sử dụng stopwords.txt
        import re

        # Lấy danh sách stopwords từ file
        stopwords = load_stopwords('stopwords.txt')

        # Đếm các từ xuất hiện trong spam
        words = []
        for text in spam_df['text']:
            words.extend(re.findall(r'\b\w+\b', str(text).lower()))

        # Lọc bỏ stopwords từ file
        filtered_words = [word for word in words if word not in stopwords and len(word) > 2]

        # Lấy top từ khóa phổ biến
        common_keywords = Counter(filtered_words).most_common(10)
        common_keywords = [{'word': word, 'count': count} for word, count in common_keywords]

        last_training = None
        if os.path.exists(MODEL_PATH):
            timestamp = os.path.getmtime(MODEL_PATH)
            last_training = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({
            'inbox_count': inbox_count,
            'spam_count': spam_count,
            'recent_emails': len(recent_emails),
            'recent_spam_detected': recent_spam_detected,
            'confidence_levels': confidence_levels,
            'training_size': training_size,
            'test_accuracy': f"{accuracy*100:.2f}%",
            'last_training': last_training,
            # Thêm dữ liệu mới
            'model_metrics': {
                'accuracy': round(accuracy * 100, 2),
                'precision': round(precision * 100, 2),
                'recall': round(recall * 100, 2),
                'f1_score': round(f1 * 100, 2),
                'confusion_matrix': conf_matrix
            },
            'spam_patterns': spam_patterns,
            'common_keywords': common_keywords
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/retrain', methods=['POST'])
def retrain_model():
    """API để huấn luyện lại mô hình."""
    try:
        if os.path.exists(MODEL_PATH):
            os.remove(MODEL_PATH)
        if os.path.exists(VECTORIZER_PATH):
            os.remove(VECTORIZER_PATH)

        global MODEL, VECTORIZER
        MODEL, VECTORIZER = train_model('spam_data.csv')

        return jsonify({'success': True, 'message': 'Đã huấn luyện lại mô hình thành công'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API endpoints for spam and analyzer - no template rendering needed

@app.route('/spam_emails')
def get_spam_emails_route():
    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        max_results = request.args.get('max', 20, type=int)
        search_query = request.args.get('q', '')
        page_token = request.args.get('pageToken', None)

        # Lấy Gmail service
        service = get_gmail_service()
        if not service:
            return jsonify({'error': 'Lỗi xác thực, vui lòng đăng nhập lại'}), 401

        result = get_emails(service, max_results, search_query, page_token, label_ids=['SPAM'])
        return jsonify({
            'emails': result['emails'],
            'nextPageToken': result['nextPageToken']
        })
    except Exception as e:
        print(f"Lỗi khi lấy email spam: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/mark_read', methods=['POST'])
def mark_read():
    """API để đánh dấu email là đã đọc."""
    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        data = request.json
        email_id = data.get('email_id')

        if not email_id:
            return jsonify({'error': 'ID email không được cung cấp'}), 400

        # Lấy Gmail service
        service = get_gmail_service()
        if not service:
            return jsonify({'error': 'Lỗi xác thực, vui lòng đăng nhập lại'}), 401

        success = mark_as_read(service, email_id)

        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Không thể đánh dấu email là đã đọc'}), 500
    except Exception as e:
        print(f"Lỗi khi đánh dấu email là đã đọc: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/delete_email', methods=['POST'])
def delete_email_route():
    """API để xóa vĩnh viễn email."""
    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        data = request.json
        email_id = data.get('email_id')

        if not email_id:
            return jsonify({'error': 'ID email không được cung cấp'}), 400

        # Lấy Gmail service
        service = get_gmail_service()
        if not service:
            return jsonify({'error': 'Lỗi xác thực, vui lòng đăng nhập lại'}), 401

        success = delete_email(service, email_id)

        return jsonify({'success': success})
    except Exception as e:
        print(f"Lỗi khi xóa email: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/analyze_text', methods=['POST'])
def analyze_text():
    """API để phân tích nội dung email."""
    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        data = request.json
        subject = data.get('subject', '')
        content = data.get('content', '')

        if not content:
            return jsonify({'error': 'Nội dung email không được để trống'}), 400

        model, vectorizer = initialize_model()
        result = classify_email(model, vectorizer, content, subject)

        return jsonify({
            'classification': result['classification'],
            'confidence': result['confidence'],
            'top_keywords': result.get('top_keywords', []),
            'email_stats': result.get('email_stats', {})
        })
    except Exception as e:
        print(f"Lỗi khi phân tích nội dung email: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/send_email', methods=['POST'])
def send_email_route():
    """API để gửi email mới."""
    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        data = request.json
        to = data.get('to')
        subject = data.get('subject')
        body = data.get('body')

        if not all([to, subject, body]):
            return jsonify({'error': 'Thiếu thông tin cần thiết'}), 400

        # Lấy Gmail service
        service = get_gmail_service()
        if not service:
            return jsonify({'error': 'Lỗi xác thực, vui lòng đăng nhập lại'}), 401

        success = send_email(service, to, subject, body)

        return jsonify({'success': success})
    except Exception as e:
        print(f"Lỗi khi gửi email: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/add_to_dataset', methods=['POST'])
def add_to_dataset():
    """API để thêm dữ liệu vào tập huấn luyện."""
    # Khai báo biến global ở đầu hàm
    global MODEL, VECTORIZER

    try:
        # Kiểm tra đăng nhập
        if 'credentials' not in session or 'user' not in session:
            return jsonify({'error': 'Chưa đăng nhập'}), 401

        data = request.json
        subject = data.get('subject', '')
        content = data.get('content', '')
        label = data.get('label')

        if not content or not label:
            return jsonify({'error': 'Thiếu nội dung hoặc nhãn'}), 400

        full_text = f"{subject}\n{content}" if subject else content
        df = pd.read_csv('spam_data.csv')

        # Kiểm tra xem dữ liệu đã tồn tại chưa
        existing_index = df[df['text'] == full_text].index

        if len(existing_index) > 0:
            # Dữ liệu đã tồn tại, kiểm tra nhãn
            existing_label = df.loc[existing_index[0], 'label']

            if existing_label == label:
                # Nếu nhãn giống nhau, không cho phép thêm
                return jsonify({
                    'success': False,
                    'message': f'Dữ liệu đã tồn tại với nhãn {label}',
                    'existing_label': existing_label
                }), 400
            else:
                # Nếu nhãn khác nhau, cập nhật nhãn
                df.loc[existing_index[0], 'label'] = label
                df.to_csv('spam_data.csv', index=False)

                # Huấn luyện lại mô hình
                MODEL, VECTORIZER = train_model('spam_data.csv')

                return jsonify({
                    'success': True,
                    'message': f'Đã cập nhật nhãn từ {existing_label} thành {label}',
                    'updated': True,
                    'old_label': existing_label,
                    'new_label': label
                })
        else:
            # Dữ liệu chưa tồn tại, thêm mới
            new_data = pd.DataFrame({'label': [label], 'text': [full_text]})
            df = pd.concat([df, new_data], ignore_index=True)
            df.to_csv('spam_data.csv', index=False)

            # Huấn luyện lại mô hình
            MODEL, VECTORIZER = train_model('spam_data.csv')

        return jsonify({'success': True, 'message': 'Đã thêm dữ liệu vào tập huấn luyện và cập nhật mô hình'})
    except Exception as e:
        print(f"Lỗi khi thêm dữ liệu vào tập huấn luyện: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)