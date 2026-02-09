from rest_framework import serializers
from django.db.models import Count, Q
from .models import Employee, Attendance


class EmployeeSerializer(serializers.ModelSerializer):
    total_present_days = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Employee
        fields = ['employee_id', 'full_name', 'email', 'department', 'created_at', 'total_present_days']
        read_only_fields = ['created_at']

    def validate_employee_id(self, value):
        if self.instance is None and Employee.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("Employee with this ID already exists.")
        return value

    def validate_email(self, value):
        if self.instance is None and Employee.objects.filter(email=value).exists():
            raise serializers.ValidationError("Employee with this email already exists.")
        return value


class AttendanceSerializer(serializers.ModelSerializer):
    employee = serializers.SlugRelatedField(
        slug_field='employee_id',
        queryset=Employee.objects.all(),
    )
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'employee', 'employee_name', 'date', 'status']
        validators = []  # Disable default unique_together validator; handled in validate()

    def validate(self, data):
        employee = data.get('employee')
        date = data.get('date')
        if employee and date:
            if Attendance.objects.filter(employee=employee, date=date).exists():
                raise serializers.ValidationError(
                    "Attendance already marked for this employee on this date."
                )
        return data
