import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Users, Download, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { SUPPORTED_ASSETS } from "@shared/const";

interface CreditEntry {
  userId: number;
  asset: string;
  amount: string;
  email?: string;
}

export default function BulkCredit() {
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [note, setNote] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Manual entry state
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [manualAmount, setManualAmount] = useState("");

  const { data: users } = trpc.admin.users.useQuery({
    search: searchEmail,
    limit: 10,
    offset: 0,
  });

  const bulkCredit = trpc.admin.bulkCreditUsers.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setExecuting(false);
      toast.success(`Bulk credit completed: ${data.successCount} success, ${data.failedCount} failed`);
      if (data.successCount > 0) {
        setCredits([]);
        setNote("");
      }
    },
    onError: (error) => {
      setExecuting(false);
      toast.error(error.message);
    },
  });

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        
        // Skip header if exists
        const startIndex = lines[0].toLowerCase().includes("userid") ? 1 : 0;
        
        const parsed: CreditEntry[] = [];
        for (let i = startIndex; i < lines.length; i++) {
          const [userId, asset, amount, email] = lines[i].split(",").map(s => s.trim());
          if (userId && asset && amount) {
            parsed.push({
              userId: parseInt(userId),
              asset,
              amount,
              email: email || undefined,
            });
          }
        }

        setCredits(parsed);
        toast.success(`Loaded ${parsed.length} entries from CSV`);
      } catch (error) {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = "userId,asset,amount,email\n1,BTC,0.001,user@example.com\n2,USDT,100,user2@example.com";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_credit_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const addManualEntry = (user: any) => {
    if (!manualAmount || parseFloat(manualAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const existing = credits.find(c => c.userId === user.id && c.asset === selectedAsset);
    if (existing) {
      toast.error("This user/asset combination already exists");
      return;
    }

    setCredits([...credits, {
      userId: user.id,
      asset: selectedAsset,
      amount: manualAmount,
      email: user.email,
    }]);

    setManualAmount("");
    setSearchEmail("");
    toast.success("Entry added");
  };

  const removeEntry = (index: number) => {
    setCredits(credits.filter((_, i) => i !== index));
  };

  const executeBulkCredit = () => {
    if (credits.length === 0) {
      toast.error("No entries to process");
      return;
    }

    setExecuting(true);
    setResult(null);
    bulkCredit.mutate({
      credits: credits.map(c => ({
        userId: c.userId,
        asset: c.asset,
        amount: c.amount,
      })),
      note: note || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Bulk Credit Tool</h1>
          </div>

          <Tabs defaultValue="csv" className="space-y-6">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="csv" className="data-[state=active]:bg-blue-600">
                <Upload className="w-4 h-4 mr-2" />
                CSV Upload
              </TabsTrigger>
              <TabsTrigger value="manual" className="data-[state=active]:bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Manual Selection
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv">
              <Card className="bg-slate-800/90 border-slate-700 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Upload CSV File</h2>
                    <Button
                      onClick={downloadTemplate}
                      variant="outline"
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-sm text-blue-200">
                    <p className="font-semibold mb-2">CSV Format:</p>
                    <code className="text-xs">userId,asset,amount,email (optional)</code>
                    <p className="mt-2 text-xs">Example: 1,BTC,0.001,user@example.com</p>
                  </div>

                  <div>
                    <Label className="text-slate-300">Select CSV File</Label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="manual">
              <Card className="bg-slate-800/90 border-slate-700 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Add Users Manually</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Search User by Email</Label>
                    <Input
                      placeholder="user@example.com"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {users && users.users.length > 0 && searchEmail && (
                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                      {users.users.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-600 rounded">
                          <div>
                            <p className="text-white font-semibold">{user.email}</p>
                            <p className="text-slate-400 text-sm">ID: {user.id} • {user.name || "N/A"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                              <SelectTrigger className="w-28 bg-slate-800 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {SUPPORTED_ASSETS.map(asset => (
                                  <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="Amount"
                              value={manualAmount}
                              onChange={(e) => setManualAmount(e.target.value)}
                              className="w-32 bg-slate-800 border-slate-600 text-white"
                            />
                            <Button
                              size="sm"
                              onClick={() => addManualEntry(user)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Preview Table */}
          {credits.length > 0 && (
            <Card className="bg-slate-800/90 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Preview ({credits.length} entries)</h2>
                <Button
                  onClick={() => setCredits([])}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/30"
                >
                  Clear All
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">User ID</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Asset</TableHead>
                    <TableHead className="text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map((credit, index) => (
                    <TableRow key={index} className="border-slate-700">
                      <TableCell className="text-white">{credit.userId}</TableCell>
                      <TableCell className="text-slate-300">{credit.email || "N/A"}</TableCell>
                      <TableCell className="text-white">{credit.asset}</TableCell>
                      <TableCell className="text-green-400 font-semibold">+{credit.amount}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeEntry(index)}
                          className="border-slate-600 hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 space-y-4">
                <div>
                  <Label className="text-slate-300">Note (optional)</Label>
                  <Textarea
                    placeholder="Reason for bulk credit..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={executeBulkCredit}
                  disabled={executing}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                >
                  {executing ? "Processing..." : `Execute Bulk Credit (${credits.length} users)`}
                </Button>
              </div>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card className="bg-slate-800/90 border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Execution Results</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-slate-300">Success</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{result.successCount}</p>
                </div>

                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-slate-300">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{result.failedCount}</p>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-slate-300">Bulk Operation ID</span>
                  </div>
                  <p className="text-sm font-mono text-white truncate">{result.bulkOperationId}</p>
                </div>
              </div>

              {result.results.failed.length > 0 && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <h3 className="text-red-400 font-semibold mb-2">Failed Entries:</h3>
                  <div className="space-y-2">
                    {result.results.failed.map((entry: any, index: number) => (
                      <div key={index} className="text-sm text-slate-300">
                        User {entry.userId} ({entry.asset} {entry.amount}): <span className="text-red-400">{entry.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
