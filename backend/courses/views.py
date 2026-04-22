from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count

from .models import UserProfile, Course, Lesson, Enrollment, LessonProgress
from .serializers import (
    UserSerializer, UserProfileSerializer, RegisterSerializer,
    CourseListSerializer, CourseDetailSerializer, CourseCreateSerializer,
    LessonSerializer, LessonCreateSerializer,
    EnrollmentSerializer, EnrollmentCreateSerializer,
    LessonProgressSerializer, CourseProgressSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'profile': UserProfileSerializer(user.profile).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'profile': UserProfileSerializer(user.profile).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Successfully logged out'})
        except Exception:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user.profile


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CourseCreateSerializer
        return CourseDetailSerializer

    def get_queryset(self):
        queryset = Course.objects.annotate(
            lesson_count=Count('lessons')
        ).select_related('instructor')
        return queryset

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'profile') or self.request.user.profile.role != 'instructor':
            return Response(
                {'error': 'Only instructors can create courses'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save(instructor=self.request.user)

    def create(self, request, *args, **kwargs):
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'instructor':
            return Response(
                {'error': 'Only instructors can create courses'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.instructor != request.user:
            return Response(
                {'error': 'You can only update your own courses'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.instructor != request.user:
            return Response(
                {'error': 'You can only delete your own courses'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = LessonSerializer

    def get_queryset(self):
        course_id = self.kwargs.get('course_pk')
        if course_id:
            return Lesson.objects.filter(course_id=course_id).order_by('order')
        return Lesson.objects.none()

    def perform_create(self, serializer):
        course = Course.objects.get(pk=self.kwargs.get('course_pk'))
        if course.instructor != self.request.user:
            return Response(
                {'error': 'You can only add lessons to your own courses'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save(course=course)

    def create(self, request, *args, **kwargs):
        course = Course.objects.get(pk=self.kwargs.get('course_pk'))
        if course.instructor != request.user:
            return Response(
                {'error': 'You can only add lessons to your own courses'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.course.instructor != request.user:
            return Response(
                {'error': 'You can only update lessons in your own courses'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.course.instructor != request.user:
            return Response(
                {'error': 'You can only delete lessons from your own courses'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return EnrollmentCreateSerializer
        return EnrollmentSerializer

    def get_queryset(self):
        return Enrollment.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    def create(self, request, *args, **kwargs):
        course_id = self.kwargs.get('course_pk')
        course = Course.objects.get(pk=course_id)

        if Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response(
                {'error': 'Already enrolled in this course'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='my')
    def my_enrollments(self, request):
        enrollments = Enrollment.objects.filter(student=request.user).select_related('course', 'course__instructor')
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)


class ProgressViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='lessons/(?P<lesson_id>[^/.]+)/complete')
    def mark_complete(self, request, lesson_id=None):
        try:
            lesson = Lesson.objects.get(pk=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)

        enrollment = Enrollment.objects.filter(student=request.user, course=lesson.course).first()
        if not enrollment:
            return Response(
                {'error': 'You must be enrolled to mark lessons complete'},
                status=status.HTTP_403_FORBIDDEN
            )

        progress, created = LessonProgress.objects.get_or_create(
            student=request.user,
            lesson=lesson,
            defaults={'completed': True, 'completed_at': timezone.now()}
        )

        if not created and not progress.completed:
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.save()

        serializer = LessonProgressSerializer(progress)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='courses/(?P<course_id>[^/.]+)/progress')
    def course_progress(self, request, course_id=None):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

        enrollment = Enrollment.objects.filter(student=request.user, course=course).first()
        if not enrollment:
            return Response(
                {'error': 'You must be enrolled to view progress'},
                status=status.HTTP_403_FORBIDDEN
            )

        total_lessons = course.lessons.count()
        completed_lessons = LessonProgress.objects.filter(
            student=request.user,
            lesson__course=course,
            completed=True
        ).count()

        progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0

        data = {
            'course_id': course_id,
            'total_lessons': total_lessons,
            'completed_lessons': completed_lessons,
            'progress_percentage': round(progress_percentage, 2)
        }
        return Response(data)