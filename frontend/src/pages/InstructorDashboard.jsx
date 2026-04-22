import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI, lessonAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', thumbnail: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', video_url: '', duration: '', order: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.profile?.role !== 'instructor') {
      navigate('/');
      return;
    }
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseAPI.getCourses();
      const allCourses = response.data.results || response.data;
      const myCourses = allCourses.filter(c => c.instructor?.id === user.id);
      setCourses(myCourses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCourse) {
        await courseAPI.updateCourse(editingCourse.id, formData);
      } else {
        await courseAPI.createCourse(formData);
      }
      setShowCourseForm(false);
      setEditingCourse(null);
      setFormData({ title: '', description: '', thumbnail: '' });
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await courseAPI.deleteCourse(courseId);
      fetchCourses();
    } catch (err) {
      alert('Failed to delete course');
    }
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await lessonAPI.createLesson(selectedCourse.id, lessonForm);
      setShowLessonForm(false);
      setLessonForm({ title: '', video_url: '', duration: '', order: '' });
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (courseId, lessonId) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await lessonAPI.deleteLesson(courseId, lessonId);
      fetchCourses();
    } catch (err) {
      alert('Failed to delete lesson');
    }
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail || ''
    });
    setShowCourseForm(true);
  };

  const openAddLesson = (course) => {
    setSelectedCourse(course);
    setLessonForm({
      title: '',
      video_url: '',
      duration: '',
      order: course.lesson_count + 1
    });
    setShowLessonForm(true);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="page-container">
      <div className="instructor-header">
        <h1>Instructor Dashboard</h1>
        <button onClick={() => {
          setEditingCourse(null);
          setFormData({ title: '', description: '', thumbnail: '' });
          setShowCourseForm(true);
        }} className="btn-primary">
          + Create Course
        </button>
      </div>

      {showCourseForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingCourse ? 'Edit Course' : 'Create Course'}</h2>
            <form onSubmit={handleCourseSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Thumbnail URL</label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCourseForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLessonForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Lesson to {selectedCourse?.title}</h2>
            <form onSubmit={handleLessonSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Video URL (YouTube/Vimeo)</label>
                <input
                  type="url"
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Order</label>
                  <input
                    type="number"
                    value={lessonForm.order}
                    onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowLessonForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="instructor-courses">
        {courses.length === 0 ? (
          <div className="empty-state">
            <p>You haven't created any courses yet.</p>
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="instructor-course-card">
              <div className="course-main">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <p className="course-meta">{course.lesson_count} lessons • {course.enrollments_count || 0} students</p>
                <div className="course-actions">
                  <button onClick={() => openEditCourse(course)} className="btn-secondary">Edit</button>
                  <button onClick={() => handleDeleteCourse(course.id)} className="btn-danger">Delete</button>
                </div>
              </div>
              <div className="course-lessons">
                <h4>Lessons</h4>
                {course.lessons?.length > 0 ? (
                  <ul>
                    {course.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <span>{lesson.order}. {lesson.title}</span>
                        <button
                          onClick={() => handleDeleteLesson(course.id, lesson.id)}
                          className="btn-small-danger"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-lessons">No lessons yet</p>
                )}
                <button onClick={() => openAddLesson(course)} className="btn-secondary btn-small">
                  + Add Lesson
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;