"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import {
  Search,
  Activity,
  Server,
  AlertTriangle,
  CheckCircle,
  Zap,
  Database,
  Globe,
  Download,
  RefreshCw,
  Eye,
} from "lucide-react"

const actionLabels: Record<string, string> = {
  "provider.approve": "Provider Approved",
  "provider.reject": "Provider Rejected",
  "provider.suspend": "Provider Suspended",
  "order.create": "Order Created",
  "order.cancel": "Order Cancelled",
  "order.assign": "Order Assigned",
  "order.reassign": "Order Reassigned",
  "wallet.adjust": "Wallet Adjusted",
  "pricing.publish": "Pricing Published",
  "commission.update": "Commission Updated",
  "payout.create": "Payout Created",
  "customer.update": "Customer Updated",
  "customer.disable": "Customer Disabled",
  "customer.enable": "Customer Enabled",
}

const actionColors: Record<string, string> = {
  "provider.approve": "bg-emerald-100 text-emerald-800",
  "provider.reject": "bg-red-100 text-red-800",
  "provider.suspend": "bg-red-100 text-red-800",
  "order.create": "bg-blue-100 text-blue-800",
  "order.cancel": "bg-red-100 text-red-800",
  "order.assign": "bg-blue-100 text-blue-800",
  "order.reassign": "bg-amber-100 text-amber-800",
  "wallet.adjust": "bg-amber-100 text-amber-800",
  "pricing.publish": "bg-purple-100 text-purple-800",
  "commission.update": "bg-purple-100 text-purple-800",
  "payout.create": "bg-emerald-100 text-emerald-800",
  "customer.update": "bg-blue-100 text-blue-800",
  "customer.disable": "bg-red-100 text-red-800",
  "customer.enable": "bg-emerald-100 text-emerald-800",
}

export default function MonitoringPage() {
  const { auditLogs, metrics } = useStore()
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")

  const filteredLogs = (auditLogs || [])
    .filter((log) => {
      const matchesSearch =
        (log.id || "").toLowerCase().includes(search.toLowerCase()) ||
        (log.actor || "").toLowerCase().includes(search.toLowerCase()) ||
        (log.entity || "").toLowerCase().includes(search.toLowerCase()) ||
        (log.details || "").toLowerCase().includes(search.toLowerCase())
      const matchesAction = actionFilter === "all" || log.action === actionFilter
      return matchesSearch && matchesAction
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Monitoring</h1>
            <p className="text-sm text-muted-foreground">System health, audit logs, and performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">API Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="font-semibold text-emerald-600">Operational</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Server className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Uptime: 99.98% (30 days)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Database</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="font-semibold text-emerald-600">Healthy</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Database className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Response time: 12ms avg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-semibold">{(metrics?.onlineProviders ?? 0) + 127}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">+12% from last hour</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alerts</p>
                  <p className="text-2xl font-semibold text-amber-600">2</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">1 warning, 1 info</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="audit">
          <TabsList>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Audit Trail</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 w-[250px]"
                      />
                    </div>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="provider.approve">Provider Approved</SelectItem>
                        <SelectItem value="provider.suspend">Provider Suspended</SelectItem>
                        <SelectItem value="order.create">Order Created</SelectItem>
                        <SelectItem value="order.cancel">Order Cancelled</SelectItem>
                        <SelectItem value="wallet.adjust">Wallet Adjusted</SelectItem>
                        <SelectItem value="pricing.publish">Pricing Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">{log.actor}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={actionColors[log.action] || "bg-slate-100"}>
                              {actionLabels[log.action] || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{log.entity}</TableCell>
                          <TableCell className="font-mono text-sm">{(log.entityId || "").slice(0, 12)}</TableCell>
                          <TableCell className="text-muted-foreground">{log.ip}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    API Response Times
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    {[
                      { endpoint: "/api/orders", p50: 45, p95: 120, p99: 250 },
                      { endpoint: "/api/providers", p50: 32, p95: 85, p99: 180 },
                      { endpoint: "/api/customers", p50: 28, p95: 75, p99: 150 },
                      { endpoint: "/api/pricing", p50: 15, p95: 45, p99: 90 },
                    ].map((api) => (
                      <div key={api.endpoint} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-mono text-sm">{api.endpoint}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            p50: <span className="text-foreground font-medium">{api.p50}ms</span>
                          </span>
                          <span className="text-muted-foreground">
                            p95: <span className="text-foreground font-medium">{api.p95}ms</span>
                          </span>
                          <span className="text-muted-foreground">
                            p99: <span className="text-foreground font-medium">{api.p99}ms</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>CPU Usage</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: "35%" }} />
                        </div>
                        <span className="text-sm font-medium">35%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Memory Usage</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: "62%" }} />
                        </div>
                        <span className="text-sm font-medium">62%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Disk Usage</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: "78%" }} />
                        </div>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Network I/O</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">In: 2.4 GB/s</span>
                        <span className="text-sm text-muted-foreground">Out: 1.8 GB/s</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>System notifications and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4 p-4 border rounded-lg border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-amber-800">High disk usage detected</p>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                          Warning
                        </Badge>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">
                        Disk usage has exceeded 75% threshold. Consider cleaning up old logs or expanding storage.
                      </p>
                      <p className="text-xs text-amber-600 mt-2">Triggered 2 hours ago</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Dismiss
                    </Button>
                  </div>
                  <div className="flex items-start gap-4 p-4 border rounded-lg border-blue-200 bg-blue-50">
                    <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-blue-800">Scheduled maintenance reminder</p>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Info
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        System maintenance scheduled for Sunday 2:00 AM - 4:00 AM UTC.
                      </p>
                      <p className="text-xs text-blue-600 mt-2">Created 1 day ago</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
