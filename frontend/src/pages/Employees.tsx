import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getEmployees, createEmployee, deleteEmployee, type Employee, type CreateEmployeeData } from "@/lib/api";
import { Plus, Search, Eye, Trash2, Users, Loader2, CalendarCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const DEPARTMENTS = ["Engineering", "HR", "Marketing", "Finance", "Operations", "Sales", "Design", "Support"];

export default function Employees() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState<CreateEmployeeData>({ employee_id: "", full_name: "", email: "", department: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setAddOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const createMut = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setAddOpen(false);
      setForm({ employee_id: "", full_name: "", email: "", department: "" });
      setErrors({});
      toast({ title: "Employee added", description: "New employee created successfully.", className: "bg-success text-success-foreground border-success" });
    },
    onError: (err) => {
      let msg = "Failed to create employee.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data;
        msg = d.error || JSON.stringify(d.details || d);
      }
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteTarget(null);
      toast({ title: "Employee deleted", description: "Employee removed successfully." });
    },
    onError: (err) => {
      let msg = "Failed to delete employee.";
      if (axios.isAxiosError(err) && err.response?.data) {
        msg = err.response.data.error || msg;
      }
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const validateField = (field: string, value: string) => {
    if (!value.trim()) return "This field is required";
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email";
    return "";
  };

  const handleBlur = (field: string) => {
    const err = validateField(field, form[field as keyof CreateEmployeeData]);
    setErrors((p) => ({ ...p, [field]: err }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    (Object.keys(form) as (keyof CreateEmployeeData)[]).forEach((k) => {
      const e = validateField(k, form[k]);
      if (e) newErrors[k] = e;
    });
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    createMut.mutate(form);
  };

  const employees = data?.results || [];
  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return e.full_name.toLowerCase().includes(q) || e.employee_id.toLowerCase().includes(q) || e.department.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">{employees.length} total employees</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-destructive font-medium text-sm">Unable to connect to server. Please try again.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Users size={28} className="text-muted-foreground/50" />
            </div>
          </motion.div>
          <p className="mt-4 text-base font-medium text-muted-foreground">
            {search ? "No employees match your search." : "No employees yet"}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {search ? "Try a different search term." : "Get started by adding your first employee."}
          </p>
          {!search && (
            <Button className="mt-4 gap-2 bg-primary text-primary-foreground" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Add Employee
            </Button>
          )}
        </motion.div>
      )}

      {/* Desktop Table */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="hidden md:block card-elevated overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="table-header">Employee ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Department</th>
                <th className="table-header">Present Days</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((emp, i) => (
                  <motion.tr
                    key={emp.employee_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                    exit={{ opacity: 0, x: -100 }}
                    className="table-row-hover"
                  >
                    <td className="table-cell font-mono text-xs text-muted-foreground">{emp.employee_id}</td>
                    <td className="table-cell font-medium">{emp.full_name}</td>
                    <td className="table-cell text-muted-foreground">{emp.email}</td>
                    <td className="table-cell">
                      <Badge variant="secondary" className="font-medium">{emp.department}</Badge>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <CalendarCheck size={13} className="text-success" />
                        <span className="font-medium">{emp.total_present_days}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewEmployee(emp)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Eye size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(emp.employee_id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          <AnimatePresence>
            {filtered.map((emp, i) => (
              <motion.div
                key={emp.employee_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                exit={{ opacity: 0, x: -100 }}
                className="card-elevated p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{emp.employee_id}</p>
                  </div>
                  <Badge variant="secondary" className="font-medium text-xs">{emp.department}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{emp.email}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarCheck size={12} className="text-success" />
                    <span>{emp.total_present_days} days present</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setViewEmployee(emp)} className="h-7 px-2 text-muted-foreground hover:text-primary">
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(emp.employee_id)} className="h-7 px-2 text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Fill in the details to add a new employee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {([
              { key: "employee_id", label: "Employee ID", placeholder: "e.g. EMP029" },
              { key: "full_name", label: "Full Name", placeholder: "e.g. John Doe" },
              { key: "email", label: "Email Address", placeholder: "e.g. john@company.com" },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-sm font-medium">{label}</Label>
                <Input
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  onBlur={() => handleBlur(key)}
                  placeholder={placeholder}
                  className={`h-10 ${errors[key] ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Department</Label>
              <Select value={form.department} onValueChange={(v) => { setForm((p) => ({ ...p, department: v })); setErrors((p) => ({ ...p, department: "" })); }}>
                <SelectTrigger className={`h-10 ${errors.department ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
            </div>
            <Button className="w-full h-10 bg-primary text-primary-foreground mt-2" onClick={handleSubmit} disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
              Add Employee
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {viewEmployee && (
            <div className="space-y-3 pt-2">
              {([
                ["Employee ID", viewEmployee.employee_id],
                ["Full Name", viewEmployee.full_name],
                ["Email", viewEmployee.email],
                ["Department", viewEmployee.department],
                ["Present Days", String(viewEmployee.total_present_days)],
                ["Joined", new Date(viewEmployee.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })],
              ] as const).map(([label, val]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-foreground">{val}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this employee and all their attendance records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget)}
            >
              {deleteMut.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
