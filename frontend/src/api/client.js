import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/login/`, {
            refresh: refreshToken,
          }, {
            headers: { 'Content-Type': 'application/json' }
          });
          const { access } = response.data.tokens;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (e) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (username, password) => api.post('/auth/login/', { username, password }),
  logout: () => api.post('/auth/logout/', { refresh: localStorage.getItem('refresh_token') }),
  getCurrentUser: () => api.get('/auth/me/'),
};

export const courseAPI = {
  getCourses: (page = 1) => api.get(`/courses/?page=${page}`),
  getCourse: (id) => api.get(`/courses/${id}/`),
  createCourse: (data) => api.post('/courses/', data),
  updateCourse: (id, data) => api.put(`/courses/${id}/`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}/`),
};

export const lessonAPI = {
  getLessons: (courseId) => api.get(`/courses/${courseId}/lessons/`),
  createLesson: (courseId, data) => api.post(`/courses/${courseId}/lessons/`, data),
  updateLesson: (courseId, lessonId, data) => api.put(`/courses/${courseId}/lessons/${lessonId}/`, data),
  deleteLesson: (courseId, lessonId) => api.delete(`/courses/${courseId}/lessons/${lessonId}/`),
};

export const enrollmentAPI = {
  enroll: (courseId) => api.post(`/courses/${courseId}/enrollments/`),
  getMyEnrollments: () => api.get('/enrollments/my/'),
};

export const progressAPI = {
  markComplete: (lessonId) => api.post(`/progress/lessons/${lessonId}/complete/`),
  getCourseProgress: (courseId) => api.get(`/progress/courses/${courseId}/progress/`),
};

export default api;