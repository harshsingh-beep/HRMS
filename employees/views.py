from datetime import date, datetime
from django.db.models import Count, Q
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Employee, Attendance
from .serializers import EmployeeSerializer, AttendanceSerializer


class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        return Employee.objects.annotate(
            total_present_days=Count(
                'attendance_records',
                filter=Q(attendance_records__status='Present'),
            )
        ).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            # Check for duplicate employee_id or email — return 409
            if 'employee_id' in errors:
                for err in errors['employee_id']:
                    if 'already exists' in str(err).lower():
                        return Response(
                            {'error': 'Employee with this ID already exists.'},
                            status=status.HTTP_409_CONFLICT,
                        )
            if 'email' in errors:
                for err in errors['email']:
                    if 'already exists' in str(err).lower():
                        return Response(
                            {'error': 'Employee with this email already exists.'},
                            status=status.HTTP_409_CONFLICT,
                        )
            return Response(
                {'error': 'Validation failed.', 'details': errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EmployeeDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = EmployeeSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        return Employee.objects.annotate(
            total_present_days=Count(
                'attendance_records',
                filter=Q(attendance_records__status='Present'),
            )
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        employee_id = instance.employee_id
        self.perform_destroy(instance)
        return Response(
            {'message': f'Employee {employee_id} deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT,
        )


class AttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        queryset = Attendance.objects.select_related('employee')
        employee_id = self.request.query_params.get('employee')
        date_filter = self.request.query_params.get('date')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if date_filter:
            try:
                datetime.strptime(date_filter, '%Y-%m-%d')
            except ValueError:
                return queryset.none()
            queryset = queryset.filter(date=date_filter)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            # Check for duplicate attendance error
            if 'non_field_errors' in errors:
                for err in errors['non_field_errors']:
                    if 'already marked' in str(err).lower():
                        return Response(
                            {'error': str(err)},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
            return Response(
                {'error': 'Validation failed.', 'details': errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DashboardView(APIView):
    def get(self, request):
        today = date.today()
        total_employees = Employee.objects.count()
        present_today = Attendance.objects.filter(date=today, status='Present').count()
        absent_today = Attendance.objects.filter(date=today, status='Absent').count()

        departments = (
            Employee.objects
            .values('department')
            .annotate(count=Count('employee_id'))
            .order_by('department')
        )

        return Response({
            'total_employees': total_employees,
            'present_today': present_today,
            'absent_today': absent_today,
            'departments': list(departments),
        })
