import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { MessageSquare, Clock, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportTickets() {
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: tickets, refetch } = trpc.support.getAllTickets.useQuery();
  const { data: ticketDetails } = trpc.support.getTicketDetails.useQuery(
    { ticketId: selectedTicket! },
    { enabled: !!selectedTicket }
  );

  const replyMutation = trpc.support.replyToTicket.useMutation({
    onSuccess: () => {
      toast.success('Reply sent successfully');
      setReplyMessage('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = trpc.support.updateTicketStatus.useMutation({
    onSuccess: () => {
      toast.success('Ticket status updated');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleReply = () => {
    if (!selectedTicket || !replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    replyMutation.mutate({
      ticketId: selectedTicket,
      message: replyMessage,
    });
  };

  const handleStatusChange = (ticketId: number, status: string) => {
    updateStatusMutation.mutate({ ticketId, status: status as "open" | "in_progress" | "waiting_user" | "resolved" | "closed" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/10 text-blue-500';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'waiting_user':
        return 'bg-orange-500/10 text-orange-500';
      case 'resolved':
        return 'bg-green-500/10 text-green-500';
      case 'closed':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-500';
      case 'high':
        return 'bg-orange-500/10 text-orange-500';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'low':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const filteredTickets = tickets?.filter((ticket) =>
    statusFilter === 'all' ? true : ticket.status === statusFilter
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage and respond to user support requests</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting_user">Waiting User</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6">
        {!filteredTickets || filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No tickets found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardHeader onClick={() => setSelectedTicket(ticket.id)}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      User #{ticket.userId}
                      <span className="text-xs">•</span>
                      <Clock className="h-3 w-3" />
                      {new Date(ticket.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline">{ticket.category}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleStatusChange(ticket.id, value)}
                    >
                      <SelectTrigger className="w-[150px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="waiting_user">Waiting User</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => setSelectedTicket(ticket.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket #{selectedTicket}</DialogTitle>
            <DialogDescription>
              {ticketDetails?.subject}
            </DialogDescription>
          </DialogHeader>

          {ticketDetails && (
            <div className="space-y-4">
              {/* Ticket Info */}
              <div className="flex gap-4 p-4 bg-accent/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">User #{ticketDetails.userId}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{ticketDetails.category}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge className={getPriorityColor(ticketDetails.priority)}>
                    {ticketDetails.priority}
                  </Badge>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(ticketDetails.status)}>
                    {ticketDetails.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                <h3 className="font-semibold">Messages</h3>
                {ticketDetails.messages?.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.isStaff
                        ? 'bg-primary/10 ml-8'
                        : 'bg-accent/50 mr-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {msg.isStaff ? (
                        <Badge variant="outline">Staff</Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <div className="space-y-3">
                <h3 className="font-semibold">Reply</h3>
                <Textarea
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              Close
            </Button>
            <Button onClick={handleReply} disabled={replyMutation.isPending}>
              {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
