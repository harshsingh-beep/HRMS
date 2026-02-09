import axios from "axios";
import { API_BASE_URL } from "./config";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Types
export interface Employee {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  created_at: string;
  total_present_days: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AttendanceRecord {
  id: number;
  employee: string;
  employee_name: string;
  date: string;
  status: "Present" | "Absent";
}

export interface DashboardData {
  total_employees: number;
  present_today: number;
  absent_today: number;
  departments: { department: string; count: number }[];
}

export interface CreateEmployeeData {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
}

export interface MarkAttendanceData {
  employee: string;
  date: string;
  status: "Present" | "Absent";
}

// API functions
export const getEmployees = (params?: { page_size?: number }) =>
  api.get<PaginatedResponse<Employee>>("/employees/", { params }).then((r) => r.data);

export const createEmployee = (data: CreateEmployeeData) =>
  api.post<Employee>("/employees/", data).then((r) => r.data);

export const getEmployee = (id: string) =>
  api.get<Employee>(`/employees/${id}/`).then((r) => r.data);

export const deleteEmployee = (id: string) =>
  api.delete(`/employees/${id}/`).then((r) => r.data);

export const getAttendance = (params?: { employee?: string; date?: string; page_size?: number }) =>
  api.get<PaginatedResponse<AttendanceRecord>>("/attendance/", { params }).then((r) => r.data);

export const markAttendance = (data: MarkAttendanceData) =>
  api.post<AttendanceRecord>("/attendance/", data).then((r) => r.data);

export const getDashboard = () =>
  api.get<DashboardData>("/dashboard/").then((r) => r.data);

export default api;
