import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: '',  // Empty baseURL to use relative paths with the proxy
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a response interceptor to handle redirects
api.interceptors.response.use(
  (response) => {
    // If the response contains redirect information, handle it
    if (response.data && response.data.redirect && response.data.url) {
      window.location.href = response.data.url;
      return Promise.reject('Redirecting...');
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication API
export const authenticate = () => {
  return api.get('/authenticate');
};

export const login = (username, password) => {
  return api.post('/api/login', { username, password });
};

export const logout = () => {
  return api.post('/api/logout');
};

export const register = (username, password, email, password_email) => {
  return api.post('/api/register', { username, password, email, password_email });
};

export const checkAuth = () => {
  return api.get('/api/check-auth');
};

// Email API
export const getEmails = (maxResults = 20, searchQuery = '', pageToken = null) => {
  return api.get('/emails', {
    params: {
      max: maxResults,
      q: searchQuery,
      pageToken: pageToken,
    },
  });
};

export const getSpamEmails = (maxResults = 20, searchQuery = '', pageToken = null) => {
  return api.get('/spam_emails', {
    params: {
      max: maxResults,
      q: searchQuery,
      pageToken: pageToken,
    },
  });
};

export const markAsSpam = (emailId) => {
  return api.post('/mark_spam', { email_id: emailId });
};

export const markAsNotSpam = (emailId) => {
  return api.post('/mark_not_spam', { email_id: emailId });
};

export const markAsRead = (emailId) => {
  return api.post('/mark_read', { email_id: emailId });
};

export const deleteEmail = (emailId) => {
  return api.post('/delete_email', { email_id: emailId });
};

// Email Analysis API
export const analyzeText = (subject, content) => {
  return api.post('/analyze_text', { subject, content });
};

// Email Composition API
export const sendEmail = (to, subject, body) => {
  return api.post('/send_email', { to, subject, body });
};

// Statistics API
export const getStats = () => {
  return api.get('/api/stats');
};

// Model Training API
export const retrainModel = () => {
  return api.post('/retrain');
};

export const addToDataset = (subject, content, label) => {
  return api.post('/add_to_dataset', { subject, content, label });
};

export default api;
