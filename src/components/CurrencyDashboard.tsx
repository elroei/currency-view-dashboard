import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Wallet, 
  Send, 
  Bell,
  Settings,
  Eye,
  EyeOff,
  Plus,
  History
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - In production, this would come from your PHP backend APIs
const mockBalances = {
  USD: 1250.50,
  EUR: 890.75,
  GBP: 620.30,
  ILS: 4580.25
};

const mockExchangeRates = [
  { currency: "USD", rate: 3.67, lastUpdated: "2024-01-15 14:30" },
  { currency: "EUR", rate: 3.98, lastUpdated: "2024-01-15 14:30" },
  { currency: "GBP", rate: 4.64, lastUpdated: "2024-01-15 14:30" }
];

const mockHistoricalData = [
  { date: "2024-01-10", rate: 3.65 },
  { date: "2024-01-11", rate: 3.68 },
  { date: "2024-01-12", rate: 3.70 },
  { date: "2024-01-13", rate: 3.69 },
  { date: "2024-01-14", rate: 3.67 },
  { date: "2024-01-15", rate: 3.67 }
];

const mockTransactions = [
  { id: 1, date: "2024-01-15", amount: 500, currency: "USD", type: "deposit", equivalent: 1835 },
  { id: 2, date: "2024-01-15", amount: 200, currency: "EUR", type: "deposit", equivalent: 796 },
  { id: 3, date: "2024-01-14", amount: 100, currency: "GBP", type: "transfer", equivalent: 464 },
  { id: 4, date: "2024-01-14", amount: 300, currency: "USD", type: "deposit", equivalent: 1101 }
];

const currencyFlags = {
  USD: "🇺🇸",
  EUR: "🇪🇺", 
  GBP: "🇬🇧",
  ILS: "🇮🇱"
};

export function CurrencyDashboard() {
  const [preferredCurrency, setPreferredCurrency] = useState("ILS");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState("USD");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferCurrency, setTransferCurrency] = useState("USD");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState("");
  const [selectedCurrencyChart, setSelectedCurrencyChart] = useState("USD");
  const { toast } = useToast();

  // API endpoints that would be called in production:
  // POST /api/deposit.php - Handle currency deposits
  // GET /api/balances.php - Get user balances
  // GET /api/rates.php - Get current exchange rates
  // GET /api/historical_rates.php - Get historical rate data
  // POST /api/transfer.php - Handle user-to-user transfers
  // GET /api/transactions.php - Get transaction history
  // POST /api/set_alert.php - Set currency rate alerts

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount.",
        variant: "destructive"
      });
      return;
    }

    // In production: POST to /api/deposit.php
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Deposit Successful",
        description: `Successfully deposited ${depositAmount} ${depositCurrency}`,
        variant: "default"
      });
      
      setDepositAmount("");
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !recipientEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all transfer fields.",
        variant: "destructive"
      });
      return;
    }

    // In production: POST to /api/transfer.php
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Transfer Successful",
        description: `Sent ${transferAmount} ${transferCurrency} to ${recipientEmail}`,
        variant: "default"
      });
      
      setTransferAmount("");
      setRecipientEmail("");
      setIsTransferModalOpen(false);
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const refreshRates = async () => {
    // In production: GET /api/rates.php
    toast({
      title: "Rates Updated",
      description: "Exchange rates have been refreshed.",
      variant: "default"
    });
  };

  const getTotalBalance = () => {
    return Object.entries(mockBalances).reduce((total, [currency, amount]) => {
      const rate = mockExchangeRates.find(r => r.currency === currency)?.rate || 1;
      if (preferredCurrency === "ILS") {
        return total + (amount * rate);
      }
      return total + amount; // Simplified conversion
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Wallet className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Currency Wallet</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="ILS">ILS</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2 bg-gradient-card shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalances(!showBalances)}
              >
                {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {showBalances ? (
                  <>
                    {currencyFlags[preferredCurrency as keyof typeof currencyFlags]} {getTotalBalance().toLocaleString()} {preferredCurrency}
                  </>
                ) : (
                  "••••••"
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +2.1% from last week
              </p>
            </CardContent>
          </Card>

          {Object.entries(mockBalances).map(([currency, amount]) => (
            <Card key={currency} className="bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {currencyFlags[currency as keyof typeof currencyFlags]} {currency}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {showBalances ? amount.toLocaleString() : "••••"}
                </div>
                <Progress value={65} className="mt-2 h-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Deposit Section & Exchange Rates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-success" />
                <span>Quick Deposit</span>
              </CardTitle>
              <CardDescription>
                Add funds to your wallet instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={depositCurrency} onValueChange={setDepositCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(mockBalances).map(currency => (
                        <SelectItem key={currency} value={currency}>
                          {currencyFlags[currency as keyof typeof currencyFlags]} {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleDeposit} 
                className="w-full" 
                variant="success"
                size="lg"
              >
                Deposit Funds
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Exchange Rates</CardTitle>
                <CardDescription>Current rates to ILS</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={refreshRates}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockExchangeRates.map((rate) => (
                  <div key={rate.currency} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{currencyFlags[rate.currency as keyof typeof currencyFlags]}</span>
                      <span className="font-medium">{rate.currency}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{rate.rate}</div>
                      <div className="text-xs text-muted-foreground">{rate.lastUpdated}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Chart */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Historical Exchange Rates</CardTitle>
                <CardDescription>
                  Track currency performance over time
                </CardDescription>
              </div>
              <Select value={selectedCurrencyChart} onValueChange={setSelectedCurrencyChart}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD/ILS</SelectItem>
                  <SelectItem value="EUR">EUR/ILS</SelectItem>
                  <SelectItem value="GBP">GBP/ILS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockHistoricalData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History & Transfer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-gradient-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Recent Transactions</span>
                </CardTitle>
                <CardDescription>Your latest wallet activity</CardDescription>
              </div>
              <Badge variant="secondary">{mockTransactions.length} transactions</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Equivalent (ILS)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                          {transaction.type === 'deposit' ? (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          )}
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {currencyFlags[transaction.currency as keyof typeof currencyFlags]} {transaction.amount} {transaction.currency}
                      </TableCell>
                      <TableCell>{transaction.equivalent} ILS</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-accent" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="accent" className="w-full" size="lg">
                    <Send className="h-4 w-4 mr-2" />
                    Send Money
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Money to User</DialogTitle>
                    <DialogDescription>
                      Transfer funds to another wallet user
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient Email</Label>
                      <Input
                        id="recipient"
                        type="email"
                        placeholder="user@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="transfer-amount">Amount</Label>
                        <Input
                          id="transfer-amount"
                          type="number"
                          placeholder="0.00"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transfer-currency">Currency</Label>
                        <Select value={transferCurrency} onValueChange={setTransferCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(mockBalances).map(currency => (
                              <SelectItem key={currency} value={currency}>
                                {currencyFlags[currency as keyof typeof currencyFlags]} {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleTransfer} className="w-full" variant="financial">
                      Send Transfer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="alert-threshold">Rate Alert (USD {">"} ILS)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="alert-threshold"
                    type="number"
                    placeholder="3.80"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                  />
                  <Button variant="warning" size="sm">
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  You have 2 active rate alerts set
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}