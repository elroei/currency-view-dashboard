import React from "react";
import { useState, useEffect, useRef } from "react";
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, Legend, ReferenceLine } from "recharts";
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
  History,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { addDays, subDays, subMonths, subYears, format as formatDate, startOfWeek, startOfMonth, isAfter } from "date-fns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fetchBoiHistoricalRates } from "@/lib/utils";
import { Calendar as DateRangePicker } from "@/components/ui/calendar";

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
function isValidDateString(dateStr: string) {
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function sortRatesAsc(rates) {
  // Filter out invalid or missing dates
  const validRates = rates.filter(r => r.date && isValidDateString(r.date));
  return [...validRates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
  const [selectedCurrencyChart, setSelectedCurrencyChart] = useState<string>("USD");
  const { toast } = useToast();

  // New state for real data
  const [balances, setBalances] = useState({});
  const [exchangeRates, setExchangeRates] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historicalRates, setHistoricalRates] = useState<{ [currency: string]: { date: string, rate: number }[] }>({});
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const cacheRef = useRef({});

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Theme state
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Replace the old rateAlerts state and related logic with the following:
  const SUPPORTED_ALERT_CURRENCIES = ["USD", "EUR", "GBP"];
  const [alertCurrency, setAlertCurrency] = useState("USD");
  const [rateAlerts, setRateAlerts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('multiPairRateAlerts') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('multiPairRateAlerts', JSON.stringify(rateAlerts));
  }, [rateAlerts]);

  // Helper to get current X > ILS rate
  type AlertCurrency = "USD" | "EUR" | "GBP";
  const getPairRate = (currency: AlertCurrency) => {
    const fromRate = exchangeRates.find(r => r.currency === currency)?.rate;
    const ilsRate = exchangeRates.find(r => r.currency === 'ILS')?.rate;
    if (!fromRate || !ilsRate) return null;
    return ilsRate / fromRate;
  };

  // Check alerts on every rate update
  useEffect(() => {
    SUPPORTED_ALERT_CURRENCIES.forEach((currency) => {
      const currentRate = getPairRate(currency as AlertCurrency);
      if (!currentRate) return;
      rateAlerts.forEach((alert) => {
        if (alert.currency === currency && !alert.triggered && currentRate >= alert.threshold) {
          addNotification({
            type: 'rate-alert',
            message: `${currency}/ILS rate reached ${currentRate.toFixed(3)} (alert: ${alert.threshold})`,
            timestamp: new Date(),
            icon: <Bell className="h-4 w-4 text-warning inline-block mr-1" />
          });
          setRateAlerts((prev) => prev.map(a => a === alert ? { ...a, triggered: true } : a));
        }
      });
    });
  }, [exchangeRates]);

  const handleAddRateAlert = () => {
    const threshold = parseFloat(alertThreshold);
    if (isNaN(threshold) || threshold <= 0) return;
    setRateAlerts(prev => [...prev, { currency: alertCurrency, threshold, triggered: false }]);
    setAlertThreshold("");
  };

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

  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date } | undefined>(() => ({
    from: subMonths(new Date(), 1),
    to: new Date(),
  }));

  const [chartFilter, setChartFilter] = useState<'daily' | 'weekly' | 'monthly' | '5years'>('daily');

  function aggregateRates(rates, filter) {
    if (filter === 'daily') return rates;
    if (filter === 'weekly') {
      const map = new Map();
      rates.forEach(r => {
        if (typeof r.date === 'string' && r.date.length > 0 && !isNaN(new Date(r.date).getTime())) {
          const week = formatDate(startOfWeek(new Date(r.date)), 'yyyy-MM-dd');
          map.set(week, r); // last rate of the week
        }
      });
      return Array.from(map.values());
    }
    if (filter === 'monthly' || filter === '5years') {
      const map = new Map();
      rates.forEach(r => {
        if (typeof r.date === 'string' && r.date.length > 0 && !isNaN(new Date(r.date).getTime())) {
          const month = formatDate(startOfMonth(new Date(r.date)), 'yyyy-MM');
          map.set(month, r); // last rate of the month
        }
      });
      return Array.from(map.values());
    }
    return rates;
  }

  const fetchHistoricalRates = async (currency: string, from: Date, to: Date) => {
    setHistoricalLoading(true);
    setHistoricalError(null);
    const start_date = formatDate(from, "yyyy-MM-dd");
    const end_date = formatDate(to, "yyyy-MM-dd");
    const cacheKey = `${currency}_${start_date}_${end_date}`;
    if (cacheRef.current[cacheKey]) {
      setHistoricalRates(r => ({ ...r, [currency]: cacheRef.current[cacheKey] }));
      setHistoricalLoading(false);
      return;
    }
    try {
      const data = await fetchBoiHistoricalRates(currency as 'USD' | 'EUR' | 'GBP', from, to);
      if (data && Array.isArray(data) && data.length > 0) {
        cacheRef.current[cacheKey] = data;
        setHistoricalRates(r => ({ ...r, [currency]: data }));
      } else {
        setHistoricalRates(r => ({ ...r, [currency]: [] }));
        setHistoricalError("No data available for this range.");
      }
    } catch (e) {
      setHistoricalError("Failed to load historical rates.");
    }
    setHistoricalLoading(false);
  };

  // Fetch on currency or date range change
  useEffect(() => {
    fetchHistoricalRates(selectedCurrencyChart as 'USD' | 'EUR' | 'GBP', dateRange?.from || new Date(), dateRange?.to || new Date());
  }, [selectedCurrencyChart, dateRange]);

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

  const filteredRates = (() => {
    let rates = sortRatesAsc(historicalRates[selectedCurrencyChart] || [])
      .map(d => ({ ...d, date: typeof d.date === 'string' ? d.date : (d.date instanceof Date ? formatDate(d.date, 'yyyy-MM-dd') : (d.date && d.date.toString ? d.date.toString() : '')) }))
      .filter(d => typeof d.date === 'string' && d.date.length > 0 && !isNaN(new Date(d.date).getTime()));
    return rates;
  })();

  const predefinedRanges = [
    { label: "1 Week", get: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: "1 Month", get: () => ({ from: subMonths(new Date(), 1), to: new Date() }) },
    { label: "1 Year", get: () => ({ from: subYears(new Date(), 1), to: new Date() }) },
    { label: "5 Years", get: () => ({ from: subYears(new Date(), 5), to: new Date() }) },
  ];
  type RangeLabel = '1 Week' | '1 Month' | '1 Year' | '5 Years' | 'custom';
  const [activeRange, setActiveRange] = useState<RangeLabel>('1 Month'); // Default: 1 Month

  // Add state for base currency selector
  const allCurrencies = Array.from(new Set([...(exchangeRates.map(r => r.currency)), "ILS"]));
  const [baseCurrency, setBaseCurrency] = useState("ILS");

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
                <CardDescription>Current rates per 1 {baseCurrency}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={refreshRates}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center gap-2">
                <Label htmlFor="base-currency">Base Currency:</Label>
                <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCurrencies.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currencyFlags[currency as keyof typeof currencyFlags] || currency} {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                {allCurrencies.map((currency) => {
                  let rate = 1;
                  if (currency !== baseCurrency) {
                    const baseRate = exchangeRates.find(r => r.currency === baseCurrency)?.rate;
                    const targetRate = exchangeRates.find(r => r.currency === currency)?.rate;
                    if (baseRate && targetRate) {
                      rate = targetRate / baseRate;
                    } else {
                      rate = NaN;
                    }
                  }
                  return (
                    <div key={currency} className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 ${currency === baseCurrency ? 'ring-2 ring-primary' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{currencyFlags[currency as keyof typeof currencyFlags] || currency}</span>
                        <span className="font-medium">{currency}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {isNaN(rate) ? "-" : rate.toFixed(4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {currency === baseCurrency ? "Base" : (exchangeRates.find(r => r.currency === currency)?.lastUpdated || "")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Chart */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Historical Exchange Rates</CardTitle>
                <CardDescription>Track currency performance over time</CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-2 items-center">
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
                <div className="flex gap-1">
                  {predefinedRanges.map(r => (
                    <Button
                      key={r.label}
                      size="sm"
                      variant={activeRange === r.label ? "default" : "outline"}
                      onClick={() => {
                        const range = r.get();
                        if (range.from && range.to) {
                          setDateRange({ from: range.from, to: range.to });
                          setActiveRange(r.label as RangeLabel);
                        }
                      }}
                    >
                      {r.label}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={activeRange === 'custom' ? "default" : "outline"}
                    onClick={() => setActiveRange('custom')}
                  >
                    Custom
                  </Button>
                </div>
              </div>
            </div>
            {activeRange === 'custom' && (
              <div className="mt-2 flex flex-col md:flex-row gap-2 items-center">
                <span className="text-xs text-muted-foreground">Custom Range:</span>
                <DateRangePicker
                  mode="range"
                  selected={dateRange}
                  onSelect={range => {
                    if (range && range.from) {
                      setDateRange({ from: range.from, to: range.to });
                      setActiveRange('custom');
                    }
                  }}
                  numberOfMonths={2}
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-white/60 dark:bg-zinc-900/60 rounded-3xl shadow-xl p-6">
              {historicalLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : historicalError ? (
                <span className="text-destructive">{historicalError}</span>
              ) : (filteredRates.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredRates} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={selectedCurrencyChart === 'USD' ? '#2563eb' : selectedCurrencyChart === 'EUR' ? '#059669' : '#a21caf'} stopOpacity={0.5}/>
                        <stop offset="100%" stopColor="#fff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" className="opacity-20" />
                    <XAxis dataKey="date" tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis 
                      domain={[dataMin => dataMin - 0.05, dataMax => dataMax + 0.05]}
                      tickFormatter={value => value.toFixed(2)}
                      tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'rgba(255,255,255,0.85)',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
                        color: 'hsl(var(--foreground))',
                        backdropFilter: 'blur(6px)',
                        padding: '12px 16px',
                      }}
                      labelStyle={{ fontWeight: 600, color: 'hsl(var(--primary))' }}
                      itemStyle={{ fontWeight: 500 }}
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="none"
                      fill="url(#colorRate)"
                      fillOpacity={1}
                      isAnimationActive={true}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke={selectedCurrencyChart === 'USD' ? '#2563eb' : selectedCurrencyChart === 'EUR' ? '#059669' : '#a21caf'}
                      strokeWidth={4}
                      dot={{
                        fill: '#fff',
                        stroke: selectedCurrencyChart === 'USD' ? '#2563eb' : selectedCurrencyChart === 'EUR' ? '#059669' : '#a21caf',
                        strokeWidth: 3,
                        r: 7,
                        filter: 'drop-shadow(0 0 8px rgba(37,99,235,0.25))',
                      }}
                      activeDot={{
                        r: 11,
                        fill: selectedCurrencyChart === 'USD' ? '#2563eb' : selectedCurrencyChart === 'EUR' ? '#059669' : '#a21caf',
                        stroke: '#fff',
                        strokeWidth: 5,
                        filter: 'drop-shadow(0 0 12px rgba(37,99,235,0.25))',
                      }}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-muted-foreground">No data available for this range.</span>
              ))}
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
              <Table className="rounded-2xl overflow-hidden shadow-xl">
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
                    <TableRow key={transaction.id} className="even:bg-accent/10 hover:bg-accent/20 transition-colors duration-100">
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
                <Label htmlFor="alert-currency">Rate Alert</Label>
                <div className="flex space-x-2">
                  <Select value={alertCurrency} onValueChange={setAlertCurrency}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_ALERT_CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>
                          {currencyFlags[currency as keyof typeof currencyFlags]} {currency} &gt; ILS
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        Alert for {alert.currency} &gt; ILS at {alert.threshold} ILS {alert.triggered && <span className="ml-1 text-success">(triggered)</span>}
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