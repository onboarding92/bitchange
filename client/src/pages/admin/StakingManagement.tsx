import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { TrendingUp, Search, Users, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

export default function StakingManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: positions, isLoading } = trpc.admin.getAllStakingPositions.useQuery();
  const { data: usersData } = trpc.admin.users.useQuery({ limit: 1000 });
  const users = usersData?.users || [];
  const { data: plans } = trpc.admin.getStakingPlans.useQuery();

  // Create user lookup map
  type User = typeof users[number];
  const userMap = new Map<number, User>(users.map((u) => [u.id, u]));
  const planMap = new Map(plans?.map((p) => [p.id, p]) || []);

  // Filter positions
  const filteredPositions = positions?.filter((pos) => {
    const user = userMap.get(pos.userId);
    const matchesSearch =
      !searchTerm ||
      String(user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pos.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalPositions: positions?.length || 0,
    activePositions: positions?.filter((p) => p.status === 'active').length || 0,
    totalStaked: positions
      ?.filter((p) => p.status === 'active')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
      .toFixed(2) || '0',
    totalRewards: positions
      ?.filter((p) => p.status === 'withdrawn' && p.rewards)
      .reduce((sum, p) => sum + parseFloat(p.rewards || '0'), 0)
      .toFixed(2) || '0',
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      withdrawn: 'secondary',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staking Management</h1>
          <p className="text-muted-foreground">Monitor and manage user staking positions</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPositions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePositions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalStaked}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards Paid</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRewards}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Staking Positions</CardTitle>
            <CardDescription>All user staking positions across all plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !filteredPositions || filteredPositions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No staking positions found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Matures At</TableHead>
                      <TableHead>Rewards</TableHead>
                      <TableHead>Withdrawn At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPositions.map((position) => {
                      const user = userMap.get(position.userId);
                      const plan = planMap.get(position.planId);
                      return (
                        <TableRow key={position.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{String(user?.name || 'Unknown')}</p>
                              <p className="text-xs text-muted-foreground">{String(user?.email || 'N/A')}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{plan?.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">
                                {plan?.apr}% APR · {plan?.lockDays} days
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {parseFloat(position.amount).toFixed(4)}
                              </p>
                              <p className="text-xs text-muted-foreground">{plan?.asset}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(position.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {new Date(position.startedAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {position.maturesAt
                              ? new Date(position.maturesAt).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {position.rewards
                              ? `${parseFloat(position.rewards).toFixed(4)} ${plan?.asset}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {position.withdrawnAt
                              ? new Date(position.withdrawnAt).toLocaleDateString()
                              : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
