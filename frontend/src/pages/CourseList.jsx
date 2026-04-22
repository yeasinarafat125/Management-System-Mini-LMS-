import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../api/client';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [page]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseAPI.getCourses(page);
      setCourses(response.data.results || response.data);
      setHasNext(response.data.next !== null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Available Courses</h1>
      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : (
        <>
          <div className="course-grid">
            {courses.map((course) => (
              <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
                <div className="course-thumbnail">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className="course-placeholder">📚</div>
                  )}
                </div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  <p className="course-meta">
                    By {course.instructor?.username} • {course.lesson_count} lessons
                  </p>
                  {course.is_enrolled && (
                    <span className="enrolled-badge">Enrolled</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary"
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNext}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CourseList;