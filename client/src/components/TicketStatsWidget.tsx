import { Link } from 'wouter';
import { MessageSquare, Clock, UserCheck, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { trpc } from '../lib/trpc';

export default function TicketStatsWidget() {
  const { data: tickets, isLoading } = trpc.admin.allTickets.useQuery({ status: undefined });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const openCount = tickets?.filter(t => t.status === 'open').length || 0;
  const inProgressCount = tickets?.filter(t => t.status === 'in_progress').length || 0;
  const waitingCount = tickets?.filter(t => t.status === 'waiting_user').length || 0;
  const resolvedCount = tickets?.filter(t => t.status === 'resolved').length || 0;

  const stats = [
    { label: 'Open', count: openCount, icon: MessageSquare, color: 'text-red-500' },
    { label: 'In Progress', count: inProgressCount, icon: Clock, color: 'text-yellow-500' },
    { label: 'Waiting User', count: waitingCount, icon: UserCheck, color: 'text-blue-500' },
    { label: 'Resolved', count: resolvedCount, icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Support Tickets</CardTitle>
        <Link href="/admin/support-tickets">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
