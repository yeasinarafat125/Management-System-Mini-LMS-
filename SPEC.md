# Mini LMS - Course Management System Specification

## 1. Project Overview

- **Project Name**: Mini LMS
- **Type**: Full-stack web application
- **Core Functionality**: A course management system where instructors create courses and students enroll/tracking progress
- **Target Users**: Students and Instructors

## 2. Tech Stack

- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: React 18 + Vite
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: SQLite (default, Django ORM)

## 3. User Roles

### Student
- Register & login
- View all courses
- Enroll in courses
- View lessons
- Track learning progress

### Instructor
- Create/edit/delete own courses
- Add/edit/delete lessons
- Manage own courses

## 4. Data Models

### User (Extended Django User)
- role: 'student' | 'instructor' (default: 'student')

### Course
- title (CharField, max 200)
- description (TextField)
- thumbnail (ImageField, nullable)
- instructor (ForeignKey to User)
- created_at (DateTimeField, auto_now_add)

### Lesson
- course (ForeignKey to Course)
- title (CharField, max 200)
- video_url (URLField)
- duration (IntegerField, minutes)
- order (PositiveIntegerField)

### Enrollment
- student (ForeignKey to User)
- course (ForeignKey to Course)
- enrolled_at (DateTimeField, auto_now_add)
- UniqueConstraint: (student, course)

### LessonProgress
- student (ForeignKey to User)
- lesson (ForeignKey to Lesson)
- completed (BooleanField, default False)
- completed_at (DateTimeField, nullable)
- UniqueConstraint: (student, lesson)

## 5. API Endpoints

### Auth
- POST /api/auth/register/ - Register new user
- POST /api/auth/login/ - Login (JWT)
- POST /api/auth/logout/ - Logout
- GET /api/auth/me/ - Current user info

### Courses
- GET /api/courses/ - List all courses (paginated)
- GET /api/courses/{id}/ - Course detail
- POST /api/courses/ - Create course (instructor only)
- PUT /api/courses/{id}/ - Update course (instructor only)
- DELETE /api/courses/{id}/ - Delete course (instructor only)

### Lessons
- GET /api/courses/{course_id}/lessons/ - List lessons
- POST /api/courses/{course_id}/lessons/ - Create lesson (instructor only)
- PUT /api/lessons/{id}/ - Update lesson (instructor only)
- DELETE /api/lessons/{id}/ - Delete lesson (instructor only)

### Enrollment
- POST /api/courses/{id}/enroll/ - Enroll in course
- GET /api/enrollments/my/ - My enrolled courses

### Progress
- POST /api/lessons/{id}/complete/ - Mark lesson complete
- GET /api/courses/{id}/progress/ - Get course progress

## 6. Frontend Pages

1. **Login** - JWT login form
2. **Register** - User registration form
3. **Course List** - All available courses
4. **Course Detail** - Course info + lessons list
5. **My Courses** - Student's enrolled courses
6. **Instructor Dashboard** - Manage own courses
7. **Lesson Viewer** - Watch lesson + mark complete

## 7. UI/UX Requirements

- Responsive design
- Clean, modern UI
- Loading states
- Form validation
- Protected routes
- JWT token storage (localStorage)
- Progress bar for enrolled courses

## 8. Acceptance Criteria

- [ ] User can register as student or instructor
- [ ] User can login and receive JWT token
- [ ] Instructor can create/edit/delete courses
- [ ] Instructor can add lessons to own courses
- [ ] Student can view all courses
- [ ] Student can enroll in courses
- [ ] Student cannot enroll twice in same course
- [ ] Student can view lessons in enrolled course
- [ ] Student can mark lessons as completed
- [ ] Progress percentage displayed correctly
- [ ] All API endpoints properly protected
- [ ] Pagination works on course list