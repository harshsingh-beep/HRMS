import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api";
import { Users, CheckCircle, XCircle, UserPlus, CalendarCheck, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AnimatedCounter from "@/components/AnimatedCounter";

const CHART_COLORS = [
  "hsl(243, 75%, 59%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(200, 70%, 50%)",
  "hsl(280, 55%, 55%)",
  "hsl(170, 60%, 42%)",
  "hsl(320, 60%, 50%)",
];

const cardVariant = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } },
});

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <XCircle size={32} className="mx-auto text-destructive/60 mb-3" />
          <p className="text-destructive font-medium">Unable to connect to server</p>
          <p className="text-sm text-muted-foreground mt-1">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Employees", value: data.total_employees, icon: Users, cls: "stat-card-indigo" },
    { label: "Present Today", value: data.present_today, icon: CheckCircle, cls: "stat-card-success" },
    { label: "Absent Today", value: data.absent_today, icon: XCircle, cls: "stat-card-danger" },
  ];

  const attendanceRate = data.total_employees > 0
    ? Math.round((data.present_today / data.total_employees) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your organization</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...cardVariant(i)} className={`stat-card ${s.cls}`}>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium opacity-90">{s.label}</p>
                <p className="text-3xl font-bold mt-1.5">
                  <AnimatedCounter value={s.value} />
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                <s.icon size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Department Chart */}
        {data.departments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.35 } }}
            className="lg:col-span-2 card-elevated p-6"
          >
            <h2 className="text-base font-semibold text-card-foreground mb-1">Department Breakdown</h2>
            <p className="text-xs text-muted-foreground mb-4">{data.departments.length} departments across the organization</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.departments}
                    dataKey="count"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    animationBegin={400}
                    animationDuration={800}
                    stroke="none"
                  >
                    {data.departments.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      fontSize: 13,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Attendance Rate + Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.45 } }}
          className="space-y-5"
        >
          {/* Attendance Rate Card */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-card-foreground">Today's Attendance Rate</h3>
            </div>
            <div className="text-4xl font-bold text-foreground">{attendanceRate}%</div>
            <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${attendanceRate}%` }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.present_today} of {data.total_employees} employees present
            </p>
          </div>

          {/* Quick Actions */}
          <div className="card-elevated p-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground justify-start"
                onClick={() => navigate("/employees?add=true")}
              >
                <UserPlus size={16} /> Add Employee
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
                onClick={() => navigate("/attendance")}
              >
                <CalendarCheck size={16} /> Mark Attendance
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
