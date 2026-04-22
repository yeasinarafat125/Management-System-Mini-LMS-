import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, progressAPI } from '../api/client';

const LessonViewer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (course?.lessons) {
      const lesson = course.lessons.find(l => l.id === parseInt(lessonId));
      setCurrentLesson(lesson);
    }
  }, [course, lessonId]);

  const fetchCourse = async () => {
    try {
      const response = await courseAPI.getCourse(courseId);
      setCourse(response.data);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      await progressAPI.markComplete(lessonId);
      fetchCourse();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark complete');
    } finally {
      setCompleting(false);
    }
  };

  const getVideoId = (url) => {
    if (!url) return null;
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) return youtubeMatch[1];
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return vimeoMatch[1];
    return null;
  };

  const renderVideo = () => {
    if (!currentLesson?.video_url) return null;

    if (currentLesson.video_url.includes('youtube') || currentLesson.video_url.includes('youtu.be')) {
      const videoId = getVideoId(currentLesson.video_url);
      return (
        <iframe
          width="100%"
          height="400"
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allowFullScreen
          title={currentLesson.title}
        />
      );
    }

    if (currentLesson.video_url.includes('vimeo')) {
      const videoId = getVideoId(currentLesson.video_url);
      return (
        <iframe
          width="100%"
          height="400"
          src={`https://player.vimeo.com/video/${videoId}`}
          frameBorder="0"
          allowFullScreen
          title={currentLesson.title}
        />
      );
    }

    return (
      <a href={currentLesson.video_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
        Open Video Link
      </a>
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const lessonIndex = course?.lessons?.findIndex(l => l.id === parseInt(lessonId));
  const isCompleted = currentLesson?.is_completed;

  return (
    <div className="page-container lesson-viewer">
      <button onClick={() => navigate(`/courses/${courseId}`)} className="btn-back">
        ← Back to Course
      </button>

      <div className="lesson-content">
        <h2>{currentLesson?.title}</h2>
        <p className="lesson-duration">{currentLesson?.duration} minutes</p>

        <div className="video-container">
          {renderVideo()}
        </div>

        <div className="lesson-actions">
          <button
            onClick={handleMarkComplete}
            className={`btn-primary ${isCompleted ? 'btn-completed' : ''}`}
            disabled={completing || isCompleted}
          >
            {completing ? 'Saving...' : isCompleted ? '✓ Completed' : 'Mark as Complete'}
          </button>
        </div>
      </div>

      <div className="lesson-sidebar">
        <h3>Course Lessons</h3>
        <div className="lesson-list">
          {course?.lessons?.map((lesson, index) => (
            <div
              key={lesson.id}
              className={`lesson-item ${lesson.id === parseInt(lessonId) ? 'active' : ''} ${lesson.is_completed ? 'completed' : ''}`}
              onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
            >
              <span className="lesson-number">{index + 1}</span>
              <div className="lesson-info">
                <h4>{lesson.title}</h4>
                <p>{lesson.duration} min</p>
              </div>
              {lesson.is_completed && <span className="completed-badge">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;