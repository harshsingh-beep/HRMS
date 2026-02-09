from django.urls import path
from .views import (
    EmployeeListCreateView,
    EmployeeDetailView,
    AttendanceListCreateView,
    DashboardView,
)

urlpatterns = [
    path('employees/', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<str:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('attendance/', AttendanceListCreateView.as_view(), name='attendance-list-create'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
