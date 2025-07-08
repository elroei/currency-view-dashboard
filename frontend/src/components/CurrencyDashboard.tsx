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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

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

// Helper to sort rates by date ascending (oldest to newest)
function sortRatesAsc(rates) {
  return [...rates].sort((a, b) => new Date(a.date) - new Date(b.date));
}

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

  // New state for real data
  const [balances, setBalances] = useState({});
  const [exchangeRates, setExchangeRates] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historicalRates, setHistoricalRates] = useState<{ [currency: string]: { date: string, rate: number }[] }>({});

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Theme state
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Add at the top, after other useState hooks
  const [rateAlerts, setRateAlerts] = useState(() => {
    // Load from localStorage
    try {
      return JSON.parse(localStorage.getItem('usdIlsRateAlerts') || '[]');
    } catch {
      return [];
    }
  });

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('usdIlsRateAlerts', JSON.stringify(rateAlerts));
  }, [rateAlerts]);

  // Helper to get current USD > ILS rate
  const getUsdIlsRate = () => {
    // Find USD and ILS rates (relative to USD)
    const usdRate = exchangeRates.find(r => r.currency === 'USD')?.rate;
    const ilsRate = exchangeRates.find(r => r.currency === 'ILS')?.rate;
    if (!usdRate || !ilsRate) return null;
    // 1 USD = (ILS rate / USD rate) ILS
    return ilsRate / usdRate;
  };

  // Check alerts on every rate update
  useEffect(() => {
    const currentRate = getUsdIlsRate();
    if (!currentRate) return;
    rateAlerts.forEach((alert) => {
      if (!alert.triggered && currentRate >= alert.threshold) {
        addNotification({
          type: 'rate-alert',
          message: `USD/ILS rate reached ${currentRate.toFixed(3)} (alert: ${alert.threshold})`,
          timestamp: new Date(),
          icon: <Bell className="h-4 w-4 text-warning inline-block mr-1" />
        });
        // Mark as triggered
        setRateAlerts((prev) => prev.map(a => a === alert ? { ...a, triggered: true } : a));
      }
    });
  }, [exchangeRates]);

  // Add alert handler
  const handleAddRateAlert = () => {
    const threshold = parseFloat(alertThreshold);
    if (isNaN(threshold) || threshold <= 0) return;
    setRateAlerts(prev => [...prev, { threshold, triggered: false }]);
    setAlertThreshold("");
  };

  // Remove alert handler
  const handleRemoveRateAlert = (idx) => {
    setRateAlerts(prev => prev.filter((_, i) => i !== idx));
  };

  const USERS = [
    { id: 1, email: 'user1@example.com' },
    { id: 2, email: 'user2@example.com' }
  ];
  const [selectedUser, setSelectedUser] = useState(USERS[0]);

  // Add notification helper
  const addNotification = (notif) => {
    setNotifications((prev) => [
      { ...notif, id: Date.now() },
      ...prev.slice(0, 19) // keep max 20
    ]);
  };

  // Theme toggle handler
  const handleThemeToggle = (checked) => {
    setIsDark(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Fetch balances
  const fetchBalances = async (userId = selectedUser.id) => {
    try {
      const res = await fetch("/api/balance.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      setBalances(data.balances || {});
    } catch (e) {
      toast({ title: "Failed to load balances", variant: "destructive" });
    }
  };

  // Fetch exchange rates
  const fetchExchangeRates = async () => {
    try {
      const res = await fetch("/api/get_rates.php");
      const data = await res.json();
      const ratesArr = Object.entries({ ...data.rates, ILS: 1, ...data.rates }).map(([currency, rate]) => ({ currency, rate, lastUpdated: new Date().toISOString() }));
      setExchangeRates(ratesArr);
    } catch (e) {
      toast({ title: "Failed to load exchange rates", variant: "destructive" });
    }
  };

  // Fetch transactions
  const fetchTransactions = async (userId = selectedUser.id) => {
    try {
      const res = await fetch("/api/transactions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (e) {
      toast({ title: "Failed to load transactions", variant: "destructive" });
    }
  };

  // Fetch historical rates for yesterday, 1 month before yesterday, and 2 months before yesterday for USD, EUR, GBP to ILS
  useEffect(() => {
    async function fetchHistoricalRates() {
      const cacheKey = 'currencyapi_historical_rates_v1';
      const cache = localStorage.getItem(cacheKey);
      const cacheTTL = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();

      if (cache) {
        const { timestamp, data } = JSON.parse(cache);
        if (now - timestamp < cacheTTL) {
          setHistoricalRates(data);
          return;
        }
      }

      const apiKey = import.meta.env.VITE_CURRENCYAPI_KEY;
      const currencies = ["USD", "EUR", "GBP"];
      const toCurrency = "ILS";
      // Use yesterday as the most recent date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      // Helper to get YYYY-MM-DD string
      const getDateStr = (date) => date.toISOString().slice(0, 10);
      // Calculate the three dates: yesterday, 1 month before, 2 months before
      const dates = [
        new Date(yesterday),
        new Date(yesterday),
        new Date(yesterday)
      ];
      dates[1].setMonth(dates[1].getMonth() - 1);
      dates[2].setMonth(dates[2].getMonth() - 2);
      const dateStrs = dates.map(getDateStr);
      const results: { [currency: string]: { date: string, rate: number }[] } = {};
      for (const base of currencies) {
        results[base] = [];
        for (const dateStr of dateStrs) {
          const url = `https://api.currencyapi.com/v3/historical?apikey=${apiKey}&date=${dateStr}&base_currency=${base}&currencies=${toCurrency}`;
          try {
            // eslint-disable-next-line no-await-in-loop
            const resp = await fetch(url);
            // eslint-disable-next-line no-await-in-loop
            const json = await resp.json();
            const value = json?.data?.[toCurrency]?.value;
            if (value) {
              results[base].push({ date: dateStr, rate: value });
            }
          } catch (e) {
            // Optionally handle error
          }
          // eslint-disable-next-line no-await-in-loop
          await new Promise(res => setTimeout(res, 200)); // 0.2s delay
        }
      }
      setHistoricalRates(results);
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data: results }));
    }
    fetchHistoricalRates();
  }, []);

  // Initial load
  useEffect(() => {
    fetchBalances(selectedUser.id);
    fetchExchangeRates();
    fetchTransactions(selectedUser.id);
    // eslint-disable-next-line
  }, []);

  // Re-fetch on user change
  useEffect(() => {
    fetchBalances(selectedUser.id);
    fetchTransactions(selectedUser.id);
    // eslint-disable-next-line
  }, [selectedUser]);

  // Deposit handler
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid deposit amount.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/deposit.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUser.id, amount: depositAmount, currency: depositCurrency })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Deposit Successful", description: `Successfully deposited ${depositAmount} ${depositCurrency}` });
        addNotification({
          type: "deposit",
          message: `Deposit of ${depositAmount} ${depositCurrency} completed`,
          timestamp: new Date(),
          icon: <Plus className="h-4 w-4 text-success inline-block mr-1" />
        });
        setDepositAmount("");
        fetchBalances(selectedUser.id);
        fetchTransactions(selectedUser.id);
      } else {
        toast({ title: "Deposit Failed", description: data.error || "Please try again later.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Deposit Failed", description: "Please try again later.", variant: "destructive" });
    }
    setLoading(false);
  };

  // Transfer handler
  const handleTransfer = async () => {
    if (!transferAmount || !transferCurrency || !recipientEmail) {
      toast({ title: "Missing Information", description: "Please fill in all transfer fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/transfer.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_user_id: selectedUser.id, recipient_email: recipientEmail, amount: transferAmount, currency: transferCurrency, rate: getRate(transferCurrency, transferCurrency) })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Transfer Successful", description: `Sent ${transferAmount} ${transferCurrency} to ${recipientEmail}` });
        addNotification({
          type: "transfer",
          message: `You transferred ${transferAmount} ${transferCurrency} to ${recipientEmail}`,
          timestamp: new Date(),
          icon: <Send className="h-4 w-4 text-primary inline-block mr-1" />
        });
        setTransferAmount("");
        setRecipientEmail("");
        setIsTransferModalOpen(false);
        fetchBalances(selectedUser.id);
        fetchTransactions(selectedUser.id);
      } else {
        toast({ title: "Transfer Failed", description: data.error || "Please try again later.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Transfer Failed", description: "Please try again later.", variant: "destructive" });
    }
    setLoading(false);
  };

  // Helper to get rate
  const getRate = (from, to) => {
    if (from === to) return 1;
    const fromRate = exchangeRates.find(r => r.currency === from)?.rate || 1;
    const toRate = exchangeRates.find(r => r.currency === to)?.rate || 1;
    return fromRate / toRate;
  };

  // Refresh rates
  const refreshRates = async () => {
    await fetchExchangeRates();
    toast({ title: "Rates Updated", description: "Exchange rates have been refreshed." });
  };

  // Calculate total balance in preferred currency
  const getTotalBalance = () => {
    return Object.entries(balances).reduce((total, [currency, amount]) => {
      const rate = getRate(currency, preferredCurrency);
      return total + (parseFloat(amount as any) * rate);
    }, 0);
  };

  // Helper to get the most recent historical rate for a currency to ILS
  const getMostRecentHistoricalRate = (currency) => {
    const hist = historicalRates[currency];
    if (hist && hist.length > 0) {
      // Use the last (most recent) entry
      return hist[hist.length - 1].rate;
    }
    // Fallback to latest exchangeRates
    if (currency === 'ILS') return 1;
    const ilsRate = exchangeRates.find(r => r.currency === 'ILS')?.rate;
    const curRate = exchangeRates.find(r => r.currency === currency)?.rate;
    if (!ilsRate || !curRate) return null;
    // Convert from USD-relative rates to ILS
    // 1 unit of currency = (curRate / ilsRate) ILS
    return curRate / ilsRate;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* User Selector */}
      <div className="container mx-auto px-4 pt-6 pb-2 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-2 md:mb-0">
          <label htmlFor="user-select" className="me-2 fw-bold">Select User:</label>
          <select
            id="user-select"
            className="form-select"
            value={selectedUser.id}
            onChange={e => {
              const user = USERS.find(u => u.id === Number(e.target.value));
              if (user) setSelectedUser(user);
            }}
            style={{ width: 260, display: 'inline-block' }}
          >
            {USERS.map(user => (
              <option key={user.id} value={user.id}>{user.email}</option>
            ))}
          </select>
        </div>
        <div className="text-muted-foreground text-sm">Current user: <span className="fw-bold">{selectedUser.email}</span></div>
      </div>
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
              {/* Settings Modal and Trigger */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center justify-between py-2">
                    <span>Dark Mode</span>
                    <Switch checked={isDark} onCheckedChange={handleThemeToggle} />
                  </div>
                </DialogContent>
              </Dialog>
              {/* Notification Button */}
              <Popover open={isNotifOpen} onOpenChange={setIsNotifOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 inline-block w-2 h-2 bg-success rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="p-4 border-b font-bold">Notifications</div>
                  <div className="max-h-64 overflow-y-auto divide-y">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-muted-foreground text-center">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="flex items-start gap-2 p-3 hover:bg-muted/50 transition-all">
                          {n.icon}
                          <div>
                            <div className="font-medium">{n.message}</div>
                            <div className="text-xs text-muted-foreground">{format(new Date(n.timestamp), 'PPpp')}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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

          {Object.entries(balances).map(([currency, amount]) => (
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
                {/* Converted value in preferred currency, if different */}
                {showBalances && currency !== 'ILS' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ≈ {currencyFlags['ILS']} {(() => {
                      const rate = getMostRecentHistoricalRate(currency);
                      if (!rate) return '...';
                      return (parseFloat(amount as any) * rate).toLocaleString(undefined, { maximumFractionDigits: 2 });
                    })()} ILS
                  </div>
                )}
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
                      {["USD", "EUR", "GBP", "ILS"].map(currency => (
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
                disabled={loading}
              >
                {loading ? "Depositing..." : "Deposit Funds"}
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
                {exchangeRates.map((rate) => (
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
                <LineChart data={sortRatesAsc(historicalRates[selectedCurrencyChart] || [])}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    domain={[dataMin => dataMin - 0.05, dataMax => dataMax + 0.05]}
                    tickFormatter={value => value.toFixed(2)}
                  />
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
                    stroke="#ff007a" 
                    strokeWidth={4}
                    dot={{ fill: '#ff007a', stroke: '#fff', strokeWidth: 2, r: 8 }}
                    activeDot={{ r: 12, fill: '#fff', stroke: '#ff007a', strokeWidth: 4 }}
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
              <Badge variant="secondary">{transactions.length} transactions</Badge>
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
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                          {transaction.type === 'deposit' ? (
                            <><ArrowDownRight className="h-3 w-3 mr-1" />{transaction.type}</>
                          ) : (
                            <><ArrowUpRight className="h-3 w-3 mr-1" />{transaction.type}</>
                          )}
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
                  <Button variant="accent" className="w-full" size="lg" disabled={loading}>
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Sending..." : "Send Money"}
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
                            {["USD", "EUR", "GBP", "ILS"].map(currency => (
                              <SelectItem key={currency} value={currency}>
                                {currencyFlags[currency as keyof typeof currencyFlags]} {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleTransfer} className="w-full" variant="financial" disabled={loading}>
                      {loading ? "Sending..." : "Send Transfer"}
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
                  <Button variant="warning" size="sm" onClick={handleAddRateAlert}>
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* List active alerts */}
              {rateAlerts.length > 0 && (
                <div className="mt-2 space-y-1">
                  {rateAlerts.map((alert, idx) => (
                    <div key={idx} className="flex items-center text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 justify-between">
                      <span>
                        <Bell className="h-3 w-3 inline-block mr-1 text-warning" />
                        Alert at {alert.threshold} ILS {alert.triggered && <span className="ml-1 text-success">(triggered)</span>}
                      </span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0 ml-2" onClick={() => handleRemoveRateAlert(idx)}>
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}