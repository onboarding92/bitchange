import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Check, CheckCheck, Trash2, AlertCircle, DollarSign, FileText, TrendingUp, Settings } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function NotificationCenter() {
  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "withdrawal" | "kyc" | "trade" | "system">("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  const { data, isLoading, refetch } = trpc.notification.list.useQuery({
    type: typeFilter === "all" ? undefined : typeFilter,
    isRead: readFilter === "all" ? undefined : readFilter === "read",
    limit: 50,
    offset: 0,
  });

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteNotification = trpc.notification.delete.useMutation({
    onSuccess: () => {
      toast.success("Notification deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead.mutate({ notificationId: notification.id });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case "withdrawal":
        return <DollarSign className="w-5 h-5 text-red-400" />;
      case "kyc":
        return <FileText className="w-5 h-5 text-blue-400" />;
      case "trade":
        return <TrendingUp className="w-5 h-5 text-purple-400" />;
      case "system":
        return <Settings className="w-5 h-5 text-slate-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "bg-green-900/50 text-green-300";
      case "withdrawal":
        return "bg-red-900/50 text-red-300";
      case "kyc":
        return "bg-blue-900/50 text-blue-300";
      case "trade":
        return "bg-purple-900/50 text-purple-300";
      case "system":
        return "bg-slate-700 text-slate-300";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Notification Center</h1>
            </div>
            <Button
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          </div>

          <Card className="bg-slate-800/90 border-slate-700 p-6">
            <div className="flex gap-4 mb-6">
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="trade">Trades</SelectItem>
                  <SelectItem value="kyc">KYC</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Select value={readFilter} onValueChange={(v: any) => setReadFilter(v)}>
                <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Notifications</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                  <SelectItem value="read">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center text-slate-400 py-8">Loading notifications...</div>
            ) : !data?.notifications || data.notifications.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No notifications found</p>
                <p className="text-slate-500 text-sm mt-2">You're all caught up!</p>
              </div>
            ) : (
              <>
                <div className="text-slate-400 text-sm mb-4">
                  Showing {data.notifications.length} of {data.total} notifications
                </div>
                <div className="space-y-3">
                  {data.notifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        relative p-4 rounded-lg border cursor-pointer transition-all
                        ${notification.isRead 
                          ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" 
                          : "bg-blue-900/20 border-blue-700 hover:bg-blue-900/30"
                        }
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">{notification.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getTypeBadgeColor(notification.type)}`}>
                              {notification.type}
                            </span>
                            {!notification.isRead && (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-600 text-white">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 text-sm mb-2">{notification.message}</p>
                          <p className="text-slate-500 text-xs">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead.mutate({ notificationId: notification.id });
                              }}
                              className="border-slate-600 hover:bg-slate-700"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification.mutate({ notificationId: notification.id });
                            }}
                            className="border-slate-600 hover:bg-red-900/50 hover:border-red-700"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
