import os
import sys
import django
import random
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_lite.settings')
django.setup()

from employees.models import Employee, Attendance

DEPARTMENTS = {
    'Engineering': [
        ('EMP001', 'Aarav Sharma', 'aarav.sharma@company.com'),
        ('EMP002', 'Priya Patel', 'priya.patel@company.com'),
        ('EMP003', 'Rohan Gupta', 'rohan.gupta@company.com'),
        ('EMP004', 'Sneha Reddy', 'sneha.reddy@company.com'),
        ('EMP005', 'Vikram Joshi', 'vikram.joshi@company.com'),
        ('EMP006', 'Ananya Iyer', 'ananya.iyer@company.com'),
    ],
    'Sales': [
        ('EMP020', 'Divya Saxena', 'divya.saxena@company.com'),
        ('EMP021', 'Karan Malhotra', 'karan.malhotra@company.com'),
        ('EMP022', 'Riya Banerjee', 'riya.banerjee@company.com'),
        ('EMP023', 'Nikhil Chopra', 'nikhil.chopra@company.com'),
    ],
    'Marketing': [
        ('EMP009', 'Meera Nair', 'meera.nair@company.com'),
        ('EMP010', 'Arjun Menon', 'arjun.menon@company.com'),
        ('EMP011', 'Kavya Bhat', 'kavya.bhat@company.com'),
        ('EMP012', 'Rahul Verma', 'rahul.verma@company.com'),
    ],
    'HR': [
        ('EMP007', 'Deepika Singh', 'deepika.singh@company.com'),
        ('EMP008', 'Amit Kumar', 'amit.kumar@company.com'),
        ('EMP016', 'Pooja Mishra', 'pooja.mishra@company.com'),
    ],
    'Finance': [
        ('EMP014', 'Neha Agarwal', 'neha.agarwal@company.com'),
        ('EMP015', 'Aditya Rao', 'aditya.rao@company.com'),
        ('EMP013', 'Siddharth Das', 'siddharth.das@company.com'),
    ],
    'Operations': [
        ('EMP017', 'Rajesh Pandey', 'rajesh.pandey@company.com'),
        ('EMP018', 'Simran Kaur', 'simran.kaur@company.com'),
        ('EMP019', 'Amit Tiwari', 'amit.tiwari@company.com'),
    ],
    'Support': [
        ('EMP026', 'Tanvi Shah', 'tanvi.shah@company.com'),
        ('EMP027', 'Varun Sinha', 'varun.sinha@company.com'),
        ('EMP028', 'Shruti Pillai', 'shruti.pillai@company.com'),
    ],
    'Design': [
        ('EMP024', 'Ishita Bose', 'ishita.bose@company.com'),
        ('EMP025', 'Manish Kulkarni', 'manish.kulkarni@company.com'),
    ],
}

ABSENCE_RATES = {
    'Engineering': 0.10,
    'Sales': 0.18,
    'Marketing': 0.12,
    'HR': 0.08,
    'Finance': 0.07,
    'Operations': 0.15,
    'Support': 0.20,
    'Design': 0.13,
}

def seed():
    print("Clearing existing data...")
    Attendance.objects.all().delete()
    Employee.objects.all().delete()

    print("Creating employees...")
    employees = []
    for dept, members in DEPARTMENTS.items():
        for emp_id, name, email in members:
            emp = Employee.objects.create(
                employee_id=emp_id,
                full_name=name,
                email=email,
                department=dept,
            )
            employees.append((emp, dept))
    print(f"  Created {len(employees)} employees")

    print("Creating attendance records...")
    today = date.today()
    total = 0
    for emp, dept in employees:
        absence_rate = ABSENCE_RATES[dept]
        for day_offset in range(30):
            d = today - timedelta(days=day_offset)
            if d.weekday() >= 5:
                continue
            status = 'Absent' if random.random() < absence_rate else 'Present'
            Attendance.objects.create(employee=emp, date=d, status=status)
            total += 1
    print(f"  Created {total} attendance records")
    print("Done!")

if __name__ == '__main__':
    seed()
