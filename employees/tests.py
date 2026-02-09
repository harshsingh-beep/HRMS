from datetime import date, timedelta
from django.test import TestCase
from django.db import IntegrityError
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Employee, Attendance


# ==================== MODEL TESTS ====================

class EmployeeModelTest(TestCase):
    def test_create_employee_success(self):
        emp = Employee.objects.create(
            employee_id='EMP001',
            full_name='John Doe',
            email='john@example.com',
            department='Engineering',
        )
        self.assertEqual(emp.employee_id, 'EMP001')
        self.assertEqual(str(emp), 'EMP001 - John Doe')

    def test_duplicate_employee_id_raises_error(self):
        Employee.objects.create(
            employee_id='EMP001',
            full_name='John Doe',
            email='john@example.com',
            department='Engineering',
        )
        with self.assertRaises(IntegrityError):
            Employee.objects.create(
                employee_id='EMP001',
                full_name='Jane Doe',
                email='jane@example.com',
                department='HR',
            )

    def test_duplicate_email_raises_error(self):
        Employee.objects.create(
            employee_id='EMP001',
            full_name='John Doe',
            email='john@example.com',
            department='Engineering',
        )
        with self.assertRaises(IntegrityError):
            Employee.objects.create(
                employee_id='EMP002',
                full_name='Jane Doe',
                email='john@example.com',
                department='HR',
            )


class AttendanceModelTest(TestCase):
    def setUp(self):
        self.employee = Employee.objects.create(
            employee_id='EMP001',
            full_name='John Doe',
            email='john@example.com',
            department='Engineering',
        )

    def test_duplicate_attendance_same_date_raises_error(self):
        Attendance.objects.create(
            employee=self.employee,
            date=date.today(),
            status='Present',
        )
        with self.assertRaises(IntegrityError):
            Attendance.objects.create(
                employee=self.employee,
                date=date.today(),
                status='Absent',
            )


# ==================== EMPLOYEE API TESTS ====================

class EmployeeAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.valid_data = {
            'employee_id': 'EMP001',
            'full_name': 'John Doe',
            'email': 'john@example.com',
            'department': 'Engineering',
        }

    def test_create_employee_success(self):
        response = self.client.post('/api/employees/', self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['employee_id'], 'EMP001')
        self.assertEqual(response.data['full_name'], 'John Doe')

    def test_create_employee_missing_fields(self):
        response = self.client.post('/api/employees/', {'employee_id': 'EMP001'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('details', response.data)

    def test_create_employee_duplicate_id(self):
        self.client.post('/api/employees/', self.valid_data, format='json')
        duplicate = self.valid_data.copy()
        duplicate['email'] = 'other@example.com'
        response = self.client.post('/api/employees/', duplicate, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_create_employee_invalid_email(self):
        data = self.valid_data.copy()
        data['email'] = 'not-an-email'
        response = self.client.post('/api/employees/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_employees(self):
        self.client.post('/api/employees/', self.valid_data, format='json')
        response = self.client.get('/api/employees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)

    def test_get_employee_detail(self):
        self.client.post('/api/employees/', self.valid_data, format='json')
        response = self.client.get('/api/employees/EMP001/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['employee_id'], 'EMP001')
        self.assertIn('total_present_days', response.data)

    def test_delete_employee_cascades_attendance(self):
        self.client.post('/api/employees/', self.valid_data, format='json')
        self.client.post('/api/attendance/', {
            'employee': 'EMP001',
            'date': str(date.today()),
            'status': 'Present',
        }, format='json')
        response = self.client.delete('/api/employees/EMP001/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Employee.objects.count(), 0)
        self.assertEqual(Attendance.objects.count(), 0)

    def test_get_nonexistent_employee_returns_404(self):
        response = self.client.get('/api/employees/FAKE/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ==================== ATTENDANCE API TESTS ====================

class AttendanceAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.employee = Employee.objects.create(
            employee_id='EMP001',
            full_name='John Doe',
            email='john@example.com',
            department='Engineering',
        )
        self.valid_data = {
            'employee': 'EMP001',
            'date': str(date.today()),
            'status': 'Present',
        }

    def test_mark_attendance_success(self):
        response = self.client.post('/api/attendance/', self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['employee'], 'EMP001')
        self.assertEqual(response.data['status'], 'Present')

    def test_duplicate_attendance_same_date(self):
        self.client.post('/api/attendance/', self.valid_data, format='json')
        response = self.client.post('/api/attendance/', self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_attendance_by_employee(self):
        self.client.post('/api/attendance/', self.valid_data, format='json')
        response = self.client.get('/api/attendance/?employee=EMP001')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_attendance_by_date(self):
        self.client.post('/api/attendance/', self.valid_data, format='json')
        response = self.client.get(f'/api/attendance/?date={date.today()}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_attendance_for_nonexistent_employee(self):
        data = {
            'employee': 'FAKE999',
            'date': str(date.today()),
            'status': 'Present',
        }
        response = self.client.post('/api/attendance/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ==================== DASHBOARD API TEST ====================

class DashboardAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.emp1 = Employee.objects.create(
            employee_id='EMP001', full_name='John Doe',
            email='john@example.com', department='Engineering',
        )
        self.emp2 = Employee.objects.create(
            employee_id='EMP002', full_name='Jane Doe',
            email='jane@example.com', department='HR',
        )
        Attendance.objects.create(employee=self.emp1, date=date.today(), status='Present')
        Attendance.objects.create(employee=self.emp2, date=date.today(), status='Absent')

    def test_dashboard_returns_correct_counts(self):
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_employees'], 2)
        self.assertEqual(response.data['present_today'], 1)
        self.assertEqual(response.data['absent_today'], 1)
        self.assertEqual(len(response.data['departments']), 2)
