import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, enrollmentAPI, progressAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await courseAPI.getCourse(id);
      setCourse(response.data);
      if (response.data.is_enrolled) {
        fetchProgress();
      }
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await progressAPI.getCourseProgress(id);
      setProgress(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollmentAPI.enroll(id);
      fetchCourse();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonClick = (lessonId) => {
    navigate(`/courses/${id}/lessons/${lessonId}`);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  const isInstructor = user?.id === course.instructor?.id;

  return (
    <div className="page-container">
      <div className="course-detail">
        <div className="course-header">
          <h1>{course.title}</h1>
          <p className="course-meta">By {course.instructor?.username} • {course.enrollment_count} enrolled</p>
        </div>

        {course.thumbnail && (
          <img src={course.thumbnail} alt={course.title} className="course-banner" />
        )}

        <p className="course-description-full">{course.description}</p>

        {progress && (
          <div className="progress-section">
            <h3>Your Progress</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress.progress_percentage}%` }}
              />
            </div>
            <p>{progress.completed_lessons} / {progress.total_lessons} lessons ({progress.progress_percentage}%)</p>
          </div>
        )}

        {course.is_enrolled || isInstructor ? (
          <div className="lessons-section">
            <h3>Lessons</h3>
            <div className="lesson-list">
              {course.lessons?.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`lesson-item ${lesson.is_completed ? 'completed' : ''}`}
                  onClick={() => handleLessonClick(lesson.id)}
                >
                  <span className="lesson-number">{index + 1}</span>
                  <div className="lesson-info">
                    <h4>{lesson.title}</h4>
                    <p>{lesson.duration} minutes</p>
                  </div>
                  {lesson.is_completed && <span className="completed-badge">✓</span>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="enroll-section">
            <button
              onClick={handleEnroll}
              className="btn-primary"
              disabled={enrolling}
            >
              {enrolling ? 'Enrolling...' : 'Enroll in this course'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;