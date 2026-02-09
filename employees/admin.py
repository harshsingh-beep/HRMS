from django.contrib import admin
from .models import Employee, Attendance


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'email', 'department', 'created_at']
    search_fields = ['employee_id', 'full_name', 'email']
    list_filter = ['department']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'status']
    list_filter = ['status', 'date']
    search_fields = ['employee__employee_id', 'employee__full_name']
