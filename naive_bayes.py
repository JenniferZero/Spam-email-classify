import re
import os
import pandas as pd
import joblib
import unicodedata
from underthesea import word_tokenize
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report

# Đường dẫn lưu mô hình và vectorizer
MODEL_PATH = 'spam_model.pkl'
VECTORIZER_PATH = 'vectorizer.pkl'

# Đọc danh sách stopwords từ file CSV
def load_stopwords(file_path='stopwords.txt'):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            stopwords = set(word.strip() for word in f.readlines())
        return stopwords
    except Exception as e:
        print(f"Lỗi khi đọc file stopwords: {e}")
        return set()

STOPWORDS = load_stopwords()

def preprocess_text(text):
    """Tiền xử lý văn bản nâng cao cho tiếng Việt với chuẩn hóa dấu."""
    if isinstance(text, str):
        # Loại bỏ thẻ HTML
        text = re.sub(r'<[^>]+>', '', text)
        # Chuẩn hóa URL
        text = re.sub(r'http[s]?://\S+', 'URL', text)
        # Chuẩn hóa email
        text = re.sub(r'\S+@\S+', 'EMAIL', text)
        # Chuẩn hóa số điện thoại
        text = re.sub(r'\b\d{10,11}\b', 'PHONE', text)

        # Chuẩn hóa dấu tiếng Việt - sử dụng NFC để chuẩn hóa Unicode
        text = unicodedata.normalize('NFC', text)

        # Xử lý dấu tiếng Việt không đúng chuẩn
        vietnamese_chars = {
            'à': 'à', 'á': 'á', 'ả': 'ả', 'ã': 'ã', 'ạ': 'ạ',
            'ă': 'ă', 'ằ': 'ằ', 'ắ': 'ắ', 'ẳ': 'ẳ', 'ẵ': 'ẵ', 'ặ': 'ặ',
            'â': 'â', 'ầ': 'ầ', 'ấ': 'ấ', 'ẩ': 'ẩ', 'ẫ': 'ẫ', 'ậ': 'ậ',
            'è': 'è', 'é': 'é', 'ẻ': 'ẻ', 'ẽ': 'ẽ', 'ẹ': 'ẹ',
            'ê': 'ê', 'ề': 'ề', 'ế': 'ế', 'ể': 'ể', 'ễ': 'ễ', 'ệ': 'ệ',
            'ì': 'ì', 'í': 'í', 'ỉ': 'ỉ', 'ĩ': 'ĩ', 'ị': 'ị',
            'ò': 'ò', 'ó': 'ó', 'ỏ': 'ỏ', 'õ': 'õ', 'ọ': 'ọ',
            'ô': 'ô', 'ồ': 'ồ', 'ố': 'ố', 'ổ': 'ổ', 'ỗ': 'ỗ', 'ộ': 'ộ',
            'ơ': 'ơ', 'ờ': 'ờ', 'ớ': 'ớ', 'ở': 'ở', 'ỡ': 'ỡ', 'ợ': 'ợ',
            'ù': 'ù', 'ú': 'ú', 'ủ': 'ủ', 'ũ': 'ũ', 'ụ': 'ụ',
            'ư': 'ư', 'ừ': 'ừ', 'ứ': 'ứ', 'ử': 'ử', 'ữ': 'ữ', 'ự': 'ự',
            'ỳ': 'ỳ', 'ý': 'ý', 'ỷ': 'ỷ', 'ỹ': 'ỹ', 'ỵ': 'ỵ',
            'đ': 'đ'
        }

        for wrong, correct in vietnamese_chars.items():
            text = text.replace(wrong, correct)

        # Chuyển về chữ thường
        text = text.lower()

        # Tách từ tiếng Việt
        text = word_tokenize(text, format='text')

        # Loại bỏ từ ngắn và stopwords
        text = ' '.join([word for word in text.split() if len(word) > 2 and word not in STOPWORDS])
        return text
    return ""

def train_model(csv_file):
    """Huấn luyện mô hình Naive Bayes với TF-IDF và GridSearchCV."""
    # Kiểm tra xem mô hình đã được huấn luyện chưa
    if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
        print("Đang tải mô hình và vectorizer đã huấn luyện...")
        model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)
        return model, vectorizer

    print("Đang huấn luyện mô hình mới...")
    # Tải dữ liệu
    data = pd.read_csv(csv_file)

    # Kiểm tra và lọc hàng có giá trị null
    data = data.dropna()

    # Kiểm tra tỷ lệ lớp để phát hiện mất cân bằng
    class_counts = data['label'].value_counts()
    print("Tỷ lệ lớp trong dữ liệu:")
    print(class_counts)

    # Tính toán class_weight để cân bằng prior probability
    total_samples = len(data)
    n_classes = len(class_counts)
    class_weights = {}
    for label, count in class_counts.items():
        # Công thức cân bằng: tổng số mẫu / (số lớp * số mẫu của lớp đó)
        class_weights[label] = total_samples / (n_classes * count)

    print("Class weights để cân bằng prior probability:")
    print(class_weights)

    # Tiền xử lý dữ liệu
    data['processed_text'] = data['text'].apply(preprocess_text)

    # Tách dữ liệu
    X_train, X_test, y_train, y_test = train_test_split(
        data['processed_text'], data['label'], test_size=0.2, random_state=42, stratify=data['label']
    )

    # Xây dựng pipeline với MultinomialNB
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(min_df=2, max_df=0.95)),
        ('classifier', MultinomialNB(class_prior=None))
    ])

    # Các tham số để tìm kiếm - mở rộng phạm vi alpha để xử lý tốt hơn các từ không có trong tập huấn luyện
    param_grid = {
        'tfidf__max_features': [None, 5000, 10000],
        'tfidf__ngram_range': [(1, 1), (1, 2)],
        'classifier__alpha': [0.001, 0.01, 0.1, 0.5, 1.0, 2.0],  # Thêm các giá trị alpha
    }

    # Tìm tham số tốt nhất
    grid_search = GridSearchCV(pipeline, param_grid, cv=5, n_jobs=-1, verbose=1, scoring='f1_weighted')
    grid_search.fit(X_train, y_train)

    # Lấy mô hình tốt nhất
    best_model = grid_search.best_estimator_
    vectorizer = best_model.named_steps['tfidf']
    model = best_model.named_steps['classifier']

    # Đánh giá mô hình
    y_pred = best_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)
    print(f"Độ chính xác: {accuracy}")
    print("Báo cáo phân loại:")
    print(report)

    # Lưu mô hình và vectorizer
    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)

    return model, vectorizer

def classify_email(model, vectorizer, email_text, email_subject=None):
    """Phân loại email với độ tin cậy và thông tin chi tiết."""
    preprocessed_text = preprocess_text(email_text)

    # Kết hợp tiêu đề và nội dung nếu có
    if email_subject:
        preprocessed_subject = preprocess_text(email_subject)
        combined_text = preprocessed_subject + " " + preprocessed_text
    else:
        combined_text = preprocessed_text

    # Chuyển đổi văn bản sang vector đặc trưng
    text_vec = vectorizer.transform([combined_text])

    # Dự đoán và lấy xác suất
    prediction = model.predict(text_vec)[0]
    probabilities = model.predict_proba(text_vec)[0]

    # Lấy độ tin cậy
    confidence = max(probabilities) * 100

    # Phân tích các từ khóa quan trọng
    feature_names = vectorizer.get_feature_names_out()
    if prediction == 'spam':
        coef_index = 1  # Chỉ số cho lớp spam
    else:
        coef_index = 0  # Chỉ số cho lớp ham

    # Lấy các từ khóa và trọng số
    try:
        # Lấy log probabilities từ mô hình
        feature_weights = model.feature_log_prob_[coef_index]
        present_features = text_vec.toarray()[0] > 0

        # Tạo danh sách từ khóa với trọng số và giải thích
        keywords = []
        for i, present in enumerate(present_features):
            if present:
                word = feature_names[i]
                weight = float(feature_weights[i])
                # Tính toán tỷ lệ log-likelihood giữa spam và ham cho từ này
                if coef_index == 1:  # Nếu là spam
                    other_weight = float(model.feature_log_prob_[0][i])
                else:  # Nếu là ham
                    other_weight = float(model.feature_log_prob_[1][i])

                # Tính toán mức độ ảnh hưởng (càng lớn càng quan trọng)
                impact = weight - other_weight

                # Thêm giải thích
                if impact > 0:
                    explanation = "Từ này thường xuất hiện trong " + ("spam" if prediction == "spam" else "email thường")
                else:
                    explanation = "Từ này ít khi xuất hiện trong " + ("spam" if prediction == "spam" else "email thường")

                keywords.append({
                    'word': word,
                    'weight': weight,
                    'impact': impact,
                    'explanation': explanation
                })

        # Sắp xếp theo mức độ ảnh hưởng
        keywords.sort(key=lambda x: abs(x['impact']), reverse=True)
        top_keywords = keywords[:20]  # Giới hạn số lượng từ khóa trả về
    except Exception as e:
        print(f"Lỗi khi phân tích từ khóa: {e}")
        top_keywords = []

    # Phân tích độ dài và cấu trúc email
    email_stats = {
        'total_length': len(email_text),
        'word_count': len(email_text.split()),
        'uppercase_ratio': sum(1 for c in email_text if c.isupper()) / max(len(email_text), 1),
        'has_urls': 'url' in combined_text.lower(),
        'has_numbers': any(c.isdigit() for c in combined_text),
        'special_char_count': sum(1 for c in email_text if c in '!@#$%^&*')
    }

    return {
        'classification': prediction,
        'confidence': round(confidence, 2),
        'top_keywords': top_keywords,
        'email_stats': email_stats
    }