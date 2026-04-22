import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { enrollmentAPI, progressAPI } from '../api/client';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const response = await enrollmentAPI.getMyEnrollments();
      setEnrollments(response.data);

      const progressPromises = response.data.map(async (enrollment) => {
        try {
          const progressRes = await progressAPI.getCourseProgress(enrollment.course.id);
          return { courseId: enrollment.course.id, progress: progressRes.data };
        } catch {
          return { courseId: enrollment.course.id, progress: null };
        }
      });

      const progressResults = await Promise.all(progressPromises);
      const progressObj = {};
      progressResults.forEach(({ courseId, progress }) => {
        progressObj[courseId] = progress;
      });
      setProgressMap(progressObj);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="page-container">
      <h1>My Enrolled Courses</h1>
      {enrollments.length === 0 ? (
        <div className="empty-state">
          <p>You haven't enrolled in any courses yet.</p>
          <Link to="/" className="btn-primary">Browse Courses</Link>
        </div>
      ) : (
        <div className="course-grid">
          {enrollments.map((enrollment) => {
            const progress = progressMap[enrollment.course.id];
            return (
              <Link to={`/courses/${enrollment.course.id}`} key={enrollment.id} className="course-card">
                <div className="course-thumbnail">
                  {enrollment.course.thumbnail ? (
                    <img src={enrollment.course.thumbnail} alt={enrollment.course.title} />
                  ) : (
                    <div className="course-placeholder">📚</div>
                  )}
                </div>
                <div className="course-info">
                  <h3>{enrollment.course.title}</h3>
                  <p className="course-meta">By {enrollment.course.instructor?.username}</p>
                  <p className="enrolled-date">Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
                  {progress && (
                    <div className="progress-mini">
                      <div className="progress-bar-mini">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress.progress_percentage}%` }}
                        />
                      </div>
                      <span>{progress.progress_percentage}%</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCourses;