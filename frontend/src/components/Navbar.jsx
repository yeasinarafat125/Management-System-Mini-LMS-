import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">Mini LMS</Link>
        <ul className="nav-menu">
          <li><Link to="/">Courses</Link></li>
          {user ? (
            <>
              {user.profile?.role === 'instructor' && (
                <li><Link to="/instructor">My Courses</Link></li>
              )}
              {user.profile?.role === 'student' && (
                <li><Link to="/my-courses">My Enrolled</Link></li>
              )}
              <li className="nav-user">
                <span>{user.username}</span>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;