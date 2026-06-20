"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";

export default function AnalyticsPage() {
  const params = useParams<{ orgSlug: string }>();
  
  // We use useQuery with an empty object since orgQuery handles the org internally based on auth
  const stats = useQuery(api.analytics.getIssueStats, {});

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center border-b px-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Analytics</span>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-5xl space-y-8">
          
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
            <p className="text-sm text-muted-foreground">
              Track your team's velocity and issue burndown.
            </p>
          </div>

          {!stats ? (
            <div className="space-y-8">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Velocity Line Chart */}
              <div className="rounded-xl border bg-card p-6 shadow-xs">
                <h3 className="mb-6 text-sm font-medium">Issue Velocity (Last 30 Days)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.velocityData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => {
                          const d = new Date(value);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)"
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="created" 
                        name="Created"
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        name="Completed"
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Bar Chart */}
              <div className="rounded-xl border bg-card p-6 shadow-xs">
                <h3 className="mb-6 text-sm font-medium">Issues by Status</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(stats.statusCounts).map(([status, count]) => ({ status, count }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="status" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        style={{ textTransform: "capitalize" }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                          textTransform: "capitalize"
                        }}
                        cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
