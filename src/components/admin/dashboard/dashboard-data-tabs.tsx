"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ContactInquiry, Payment, Student } from "@/types";

interface DashboardDataTabsProps {
  students: Student[];
  payments: Payment[];
  inquiries: ContactInquiry[];
  loading?: boolean;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-LK", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardDataTabs({
  students,
  payments,
  inquiries,
  loading,
}: DashboardDataTabsProps) {
  if (loading) {
    return <Skeleton className="h-[360px] rounded-2xl" />;
  }

  return (
    <GlassCard>
      <Tabs defaultValue="students">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-icvf-navy">Institute records</h2>
          <TabsList>
            <TabsTrigger value="students">Recent students</TabsTrigger>
            <TabsTrigger value="payments">Pending payments</TabsTrigger>
            <TabsTrigger value="inquiries">New inquiries</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="students" className="mt-0">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students registered yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="font-medium hover:underline"
                      >
                        {s.displayName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.courseName}</TableCell>
                    <TableCell>{s.grade}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDate(s.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending or overdue payments.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.studentName}</TableCell>
                    <TableCell>Rs. {p.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "overdue" ? "destructive" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDate(p.date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="inquiries" className="mt-0">
          {inquiries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unread inquiries.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.name}</TableCell>
                    <TableCell className="text-muted-foreground">{q.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{q.message}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDate(q.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
}
