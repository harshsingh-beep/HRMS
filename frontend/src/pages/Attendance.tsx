import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmployees, getAttendance, markAttendance, type AttendanceRecord } from "@/lib/api";

import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, Search, CheckCircle2, Filter, CalendarCheck, Users, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function Attendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mark tab state
  const [markDate, setMarkDate] = useState<Date>(new Date());
  const markDateStr = format(markDate, "yyyy-MM-dd");
  const [markedMap, setMarkedMap] = useState<Record<string, { status: string; saving: boolean; done: boolean }>>({});

  // Reset local marks when date changes
  useEffect(() => {
    setMarkedMap({});
  }, [markDateStr]);

  // View tab state
  const [filterEmp, setFilterEmp] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [appliedFilters, setAppliedFilters] = useState<{ employee?: string; date?: string }>({});

  const { data: empData, isLoading: empLoading } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => getEmployees({ page_size: 200 }),
  });

  const { data: dayAttendance } = useQuery({
    queryKey: ["attendance", "day", markDateStr],
    queryFn: () => getAttendance({ date: markDateStr, page_size: 200 }),
  });

  const { data: viewAttendance, isLoading: viewLoading } = useQuery({
    queryKey: ["attendance", "view", appliedFilters],
    queryFn: () => getAttendance(appliedFilters.employee || appliedFilters.date ? appliedFilters : undefined),
  });

  const employees = empData?.results || [];

  const alreadyMarked = useMemo(() => {
    const map: Record<string, string> = {};
    dayAttendance?.results?.forEach((a: AttendanceRecord) => {
      map[a.employee] = a.status;
    });
    return map;
  }, [dayAttendance]);

  const markMut = useMutation({
    mutationFn: markAttendance,
    onSuccess: (_, vars) => {
      setMarkedMap((p) => ({ ...p, [vars.employee]: { status: vars.status, saving: false, done: true } }));
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setTimeout(() => setMarkedMap((p) => ({ ...p, [vars.employee]: { ...p[vars.employee], done: false } })), 2000);
    },
    onError: (err, vars) => {
      setMarkedMap((p) => ({ ...p, [vars.employee]: { ...p[vars.employee], saving: false } }));
      let msg = "Failed to mark attendance.";
      if (axios.isAxiosError(err) && err.response?.data) {
        msg = err.response.data.error || msg;
      }
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const handleMark = (empId: string, status: "Present" | "Absent") => {
    setMarkedMap((p) => ({ ...p, [empId]: { status, saving: true, done: false } }));
    markMut.mutate({ employee: empId, date: markDateStr, status });
  };

  const handleBulkPresent = () => {
    employees.forEach((emp) => {
      if (!alreadyMarked[emp.employee_id] && !markedMap[emp.employee_id]?.status) {
        handleMark(emp.employee_id, "Present");
      }
    });
  };

  const applyFilters = () => {
    const f: { employee?: string; date?: string } = {};
    if (filterEmp && filterEmp !== "all") f.employee = filterEmp;
    if (filterDate) f.date = format(filterDate, "yyyy-MM-dd");
    setAppliedFilters(f);
  };

  const viewData: AttendanceRecord[] = viewAttendance?.results || [];
  const presentCount = viewData.filter((a) => a.status === "Present").length;
  const absentCount = viewData.filter((a) => a.status === "Absent").length;
  const totalRecords = presentCount + absentCount;
  const presentPct = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  const markedCount = new Set([
    ...Object.keys(alreadyMarked),
    ...Object.entries(markedMap).filter(([, v]) => v.status).map(([k]) => k),
  ]).size;
  const unmarkedCount = Math.max(0, employees.length - markedCount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">Mark and view attendance records</p>
      </div>

      <Tabs defaultValue="mark" className="space-y-6">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="mark" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarCheck size={15} /> Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="view" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Search size={15} /> View Records
          </TabsTrigger>
        </TabsList>

        {/* Mark Tab */}
        <TabsContent value="mark" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 justify-start h-10">
                    <CalendarIcon size={16} className="text-primary" />
                    {format(markDate, "EEEE, dd MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={markDate}
                    onSelect={(d) => d && setMarkDate(d)}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {format(markDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && (
                <Button variant="outline" className="gap-2 h-10" onClick={handleBulkPresent}>
                  <CheckCircle2 size={16} className="text-success" /> Mark All Present
                </Button>
              )}
            </div>
            {employees.length > 0 && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  {markedCount} marked
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  {unmarkedCount} remaining
                </span>
              </div>
            )}
          </div>

          {empLoading && (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          )}

          {!empLoading && employees.length === 0 && (
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
              <p className="mt-4 text-base font-medium text-muted-foreground">No employees found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Add employees first to mark attendance.</p>
            </motion.div>
          )}

          <div className="space-y-3">
            <AnimatePresence>
              {employees.map((emp, i) => {
                const existing = alreadyMarked[emp.employee_id];
                const local = markedMap[emp.employee_id];
                const status = existing || local?.status;
                const disabled = !!existing;

                return (
                  <motion.div
                    key={emp.employee_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                    className="card-elevated p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {emp.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.employee_id} · {emp.department}</p>
                        </div>
                        {local?.done && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-success">
                            <CheckCircle2 size={16} />
                          </motion.div>
                        )}
                        {disabled && (
                          <Badge variant="secondary" className="text-xs font-normal">Already marked</Badge>
                        )}
                      </div>
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <motion.div whileTap={{ scale: 0.92 }}>
                          <Button
                            size="sm"
                            variant={status === "Present" ? "default" : "outline"}
                            className={cn(
                              "min-w-[80px]",
                              status === "Present" && "bg-success text-success-foreground hover:bg-success/90"
                            )}
                            disabled={disabled || local?.saving}
                            onClick={() => handleMark(emp.employee_id, "Present")}
                          >
                            Present
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.92 }}>
                          <Button
                            size="sm"
                            variant={status === "Absent" ? "default" : "outline"}
                            className={cn(
                              "min-w-[80px]",
                              status === "Absent" && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            )}
                            disabled={disabled || local?.saving}
                            onClick={() => handleMark(emp.employee_id, "Absent")}
                          >
                            Absent
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* View Tab */}
        <TabsContent value="view" className="space-y-5">
          <div className="card-elevated p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1 sm:max-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Employee</label>
                <Select value={filterEmp} onValueChange={setFilterEmp}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.employee_id} value={e.employee_id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("gap-2 justify-start h-10", !filterDate && "text-muted-foreground")}>
                      <CalendarIcon size={16} />
                      {filterDate ? format(filterDate, "dd MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={applyFilters} className="gap-2 bg-primary text-primary-foreground h-10">
                <Filter size={16} /> Apply Filters
              </Button>
            </div>
          </div>

          {viewLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          )}

          {!viewLoading && viewData.length === 0 && (
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
                  <Search size={28} className="text-muted-foreground/50" />
                </div>
              </motion.div>
              <p className="mt-4 text-base font-medium text-muted-foreground">No attendance records found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters or mark attendance first.</p>
            </motion.div>
          )}

          {!viewLoading && viewData.length > 0 && (
            <>
              {/* Summary Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elevated p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-card-foreground">Attendance Summary</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-success" />
                      <span className="font-medium">{presentCount}</span>
                      <span className="text-muted-foreground">Present</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <XCircle size={14} className="text-destructive" />
                      <span className="font-medium">{absentCount}</span>
                      <span className="text-muted-foreground">Absent</span>
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-semibold text-primary">{presentPct}%</span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                  {totalRecords > 0 && (
                    <>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(presentCount / totalRecords) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-success rounded-l-full"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(absentCount / totalRecords) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-destructive rounded-r-full"
                      />
                    </>
                  )}
                </div>
              </motion.div>

              {/* Desktop Table */}
              <div className="hidden md:block card-elevated overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="table-header">Date</th>
                      <th className="table-header">Employee ID</th>
                      <th className="table-header">Name</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {viewData.map((a, i) => (
                        <motion.tr
                          key={a.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                          className="table-row-hover"
                        >
                          <td className="table-cell">
                            <span className="font-medium">{format(new Date(a.date), "dd MMM yyyy")}</span>
                            <span className="text-muted-foreground ml-2 text-xs">{format(new Date(a.date), "EEEE")}</span>
                          </td>
                          <td className="table-cell font-mono text-xs text-muted-foreground">{a.employee}</td>
                          <td className="table-cell font-medium">{a.employee_name}</td>
                          <td className="table-cell">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "font-medium",
                                a.status === "Present"
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              )}
                            >
                              {a.status === "Present" && <CheckCircle2 size={12} className="mr-1" />}
                              {a.status === "Absent" && <XCircle size={12} className="mr-1" />}
                              {a.status}
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {viewData.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                    className="card-elevated p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{a.employee_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.employee}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-medium text-xs",
                          a.status === "Present"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        )}
                      >
                        {a.status}
                      </Badge>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.date), "EEEE, dd MMM yyyy")}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
