"use client"

import { useState } from "react"
import {
  Search,
  MoreHorizontal,
  Mail,
  Calendar,
  Clock,
  Shield,
  User,
  UserPlus,
  Crown,
  Edit,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { AdminLayout } from "@/components/admin-layout"
import { useStore } from "@/lib/store"

const roles = [
  {
    name: "Owner",
    description: "Full access to all features and billing",
    permissions: ["admin", "workflows", "analytics", "billing", "team"],
    color: "bg-purple-100 text-purple-700",
  },
  {
    name: "Manager",
    description: "Can manage workflows and team members",
    permissions: ["workflows", "analytics", "team"],
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Engineer",
    description: "Can create and manage workflows",
    permissions: ["workflows", "analytics"],
    color: "bg-green-100 text-green-700",
  },
  {
    name: "Designer",
    description: "Can create workflows and view analytics",
    permissions: ["workflows"],
    color: "bg-orange-100 text-orange-700",
  },
]

export default function TeamPage() {
  const { addTeamMember, updateTeamMember, removeTeamMember, teamMembers, addAuditLog } = useStore()
  const [search, setSearch] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "operator" | "viewer">("operator")

  const filteredMembers = (teamMembers || []).filter(
    (member) =>
      member.name?.toLowerCase().includes(search.toLowerCase()) ||
      member.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleInvite = () => {
    if (!newEmail) return

    addTeamMember({
      id: `member_${Date.now()}`,
      email: newEmail,
      name: newEmail.split("@")[0],
      role: newRole,
      status: "invited",
      joinedAt: new Date().toISOString(),
    })

    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: "team.invite",
      entity: "teamMember",
      entityId: `member_${Date.now()}`,
      details: `Invited ${newEmail} as ${newRole}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })

    setInviteDialogOpen(false)
    setNewEmail("")
    setNewRole("operator")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-400"
      case "invited":
        return "bg-gray-200"
      default:
        return "bg-gray-400"
    }
  }

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find((r) => r.name === role)
    return roleConfig?.color || "bg-gray-100 text-gray-700"
  }

  return (
    <AdminLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
            <p className="text-gray-600 mt-1">Manage your team members and their permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="w-4 h-4" />
              Invite Member
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-gray-900">{teamMembers?.length || 0}</div>
                      <div className="text-sm text-gray-600">Total Members</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {teamMembers?.filter((m) => m.status === "online").length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Online Now</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Crown className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {teamMembers?.filter((m) => m.role === "Owner" || m.role === "Manager").length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Admins</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {teamMembers?.filter((m) => m.status === "invited").length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Pending Invites</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Members List */}
            <div className="grid gap-4">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`}
                          ></div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            {member.isOwner && <Crown className="w-4 h-4 text-purple-600" />}
                            <Badge variant="secondary" className={getRoleColor(member.role)}>
                              {member.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Joined {member.joinedAt}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {member.lastActive}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{member.workflowsCreated} workflows</div>
                          <div className="text-xs text-gray-500">created</div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <User className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!member.isOwner && (
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            {teamMembers?.filter((m) => m.status === "invited").length > 0 ? (
              <div className="grid gap-4">
                {teamMembers
                  ?.filter((m) => m.status === "invited")
                  .map((member) => (
                    <Card key={member.id} className="border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <Mail className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{member.email}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Role: {member.role}</span>
                                <span>Invited by admin</span>
                                <span>{member.joinedAt.split("T")[0]}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                              Pending
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 h-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Resend Invitation
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Cancel Invitation
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Invitations</h3>
                <p className="text-gray-600 mb-4">All team invitations have been accepted or expired.</p>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite New Member
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <div className="grid gap-6">
              {roles.map((role, index) => (
                <Card key={index} className="border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant="secondary" className={role.color}>
                            {role.name}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">{role.description}</CardDescription>
                      </div>
                      <div className="text-sm text-gray-600">
                        {teamMembers?.filter((m) => m.role === role.name).length || 0} members
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Permissions:</h4>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((permission, permIndex) => (
                          <Badge key={permIndex} variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
