import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
  Calendar,
  ChevronDown,
  User,
  KeyRound,
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { addDays, subDays, subMonths, subYears, format as formatDate, startOfWeek, startOfMonth, isAfter } from "date-fns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fetchBoiHistoricalRates } from "@/lib/utils";
import { Calendar as DateRangePicker } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { useTranslation } from "@/lib/i18n";

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
  const fetchBalances = async (userId = user?.id) => {
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
  const fetchTransactions = async (userId = user?.id) => {
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

  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/me.php")
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout.php", { method: "POST" });
    setUser(null);
    navigate("/login");
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
    fetchBalances(user?.id);
    fetchExchangeRates();
    fetchTransactions(user?.id);
    // eslint-disable-next-line
  }, []);

  // Re-fetch on user change
  useEffect(() => {
    fetchBalances(user?.id);
    fetchTransactions(user?.id);
    // eslint-disable-next-line
  }, [user]);

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
        body: JSON.stringify({ user_id: user?.id, amount: depositAmount, currency: depositCurrency })
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
        fetchBalances(user?.id);
        fetchTransactions(user?.id);
      } else {
        toast({ title: "Deposit Failed", description: data.error || "Please try again later.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Deposit Failed", description: "Please try again later.", variant: "destructive" });
    }
    setLoading(false);
  };

  // Transfer handler
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferAmount || !transferCurrency || !recipientEmail) {
      toast({ title: "Missing Information", description: "Please fill in all transfer fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setPendingTransfer({
      recipientEmail,
      transferAmount,
      transferCurrency,
    });
    setShowTransferPw(true);
    setTransferPw("");
    setTransferPwError("");
  };

  // New function to verify password and proceed with transfer
  const confirmTransferWithPassword = async () => {
    setTransferPwError("");
    setTransferPwLoading(true);
    try {
      const res = await fetch("/api/verify_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: transferPw })
      });
      const data = await res.json();
      if (!data.success) {
        setTransferPwError(t('incorrectPassword'));
        setTransferPwLoading(false);
        return;
      }
      // Password correct, proceed with transfer
      setShowTransferPw(false);
      setTransferPw("");
      setTransferPwError("");
      setTransferPwLoading(false);
      // Actually perform the transfer (reuse original transfer logic)
      await actuallyPerformTransfer();
    } catch {
      setTransferPwError(t('networkError'));
      setTransferPwLoading(false);
    }
  };

  // Move the original transfer logic to a new function
  const actuallyPerformTransfer = async () => {
    try {
      const res = await fetch("/api/transfer.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_user_id: user?.id, recipient_email: recipientEmail, amount: transferAmount, currency: transferCurrency, rate: getRate(transferCurrency, transferCurrency) })
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
        fetchBalances(user?.id);
        fetchTransactions(user?.id);
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

  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (newPw.length < 6 || !/[A-Za-z]/.test(newPw) || !/\d/.test(newPw)) {
      setPwError("Password must be at least 6 characters and include a letter and a digit");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/change_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Password changed successfully", variant: "default" });
        setShowChangePw(false);
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } else {
        setPwError(data.error || "Change failed");
      }
    } catch {
      setPwError("Network error");
    }
    setPwLoading(false);
  };

  const [showProfile, setShowProfile] = useState(false);
  const [profileTab, setProfileTab] = useState("profile");

  const { t, lang, setLang } = useTranslation();

  // Add state for transfer password modal
  const [showTransferPw, setShowTransferPw] = useState(false);
  const [transferPw, setTransferPw] = useState("");
  const [transferPwError, setTransferPwError] = useState("");
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [transferPwLoading, setTransferPwLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/30 to-accent/10">
      {/* Header with user info and logout */}
      <div className="flex items-center justify-between px-8 py-6">
        <div className="text-2xl font-extrabold tracking-tight text-primary drop-shadow-sm">💱 Currency Wallet</div>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-lg rounded-full px-5 py-2 hover:ring-2 hover:ring-primary/30 transition-all">
                <div className="text-sm text-muted-foreground text-left">
                  <div className="font-bold text-primary">{user.name}</div>
                  <div className="text-xs">{user.email}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-xl rounded-xl p-2">
              <DropdownMenuItem onClick={() => setShowProfile(true)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent/20 cursor-pointer">
                <User className="h-4 w-4 text-primary" /> Profile / Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowChangePw(true)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent/20 cursor-pointer">
                <KeyRound className="h-4 w-4 text-primary" /> Change Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2 bg-gradient-card shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalBalance')}</CardTitle>
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
                <span>{t('quickDeposit')}</span>
              </CardTitle>
              <CardDescription>
                {t('addFunds')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('amount')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('currency')}</Label>
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
                <CardTitle>{t('exchangeRates')}</CardTitle>
                <CardDescription>{t('currentRates')}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={refreshRates}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center gap-2">
                <Label htmlFor="base-currency">{t('baseCurrency')}:</Label>
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
                <CardTitle>{t('historicalExchangeRates')}</CardTitle>
                <CardDescription>{t('trackCurrencyPerformance')}</CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-2 items-center">
                <Select value={selectedCurrencyChart} onValueChange={setSelectedCurrencyChart}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">{t('usdIls')}</SelectItem>
                    <SelectItem value="EUR">{t('eurIls')}</SelectItem>
                    <SelectItem value="GBP">{t('gbpIls')}</SelectItem>
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
                <span className="text-xs text-muted-foreground">{t('customRange')}:</span>
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
                <span className="text-muted-foreground">{t('loadingHistoricalRates')}</span>
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
                <span className="text-muted-foreground">{t('noDataAvailable')}</span>
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
                  <span>{t('recentTransactions')}</span>
                </CardTitle>
                <CardDescription>{t('yourLatestWalletActivity')}</CardDescription>
              </div>
              <Badge variant="secondary">{transactions.length} {t('transactions')}</Badge>
            </CardHeader>
            <CardContent>
              <Table className="rounded-2xl overflow-hidden shadow-xl">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead>{t('amount')}</TableHead>
                    <TableHead>{t('equivalentIls')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="even:bg-accent/10 hover:bg-accent/20 transition-colors duration-100">
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                          {transaction.type === 'deposit' ? (
                            <>
                              <ArrowDownRight className="h-3 w-3 mr-1" />{t('deposit')}
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="h-3 w-3 mr-1" />{t('transfer')}
                            </>
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
                <span>{t('quickActions')}</span>
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
                    <DialogTitle>{t('sendMoney')}</DialogTitle>
                    <DialogDescription>
                      {t('transferFunds')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient">{t('recipientEmail')}</Label>
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
                        <Label htmlFor="transfer-amount">{t('amount')}</Label>
                        <Input
                          id="transfer-amount"
                          type="number"
                          placeholder="0.00"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transfer-currency">{t('currency')}</Label>
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
                      {loading ? t('sending') : t('sendTransfer')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="alert-currency">{t('rateAlert')}</Label>
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
                        {t('alertFor')} {alert.currency} &gt; ILS {t('at')} {alert.threshold} ILS {alert.triggered && <span className="ml-1 text-success">(triggered)</span>}
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

      <Dialog open={showChangePw} onOpenChange={setShowChangePw}>
        <DialogContent className="max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle>{t('changePassword')}</DialogTitle>
            <DialogDescription>{t('enterCurrentPasswordAndNewPassword')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">{t('currentPassword')}</label>
              <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="block mb-1 font-medium">{t('newPassword')}</label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">{t('confirmNewPassword')}</label>
              <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
            </div>
            {pwError && <div className="text-red-500 text-sm text-center">{pwError}</div>}
            <DialogFooter>
              <Button type="submit" className="w-full rounded-full bg-gradient-to-r from-primary to-accent shadow-lg text-lg font-bold py-2" disabled={pwLoading}>
                {pwLoading ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferPw} onOpenChange={setShowTransferPw}>
        <DialogContent className="max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle>{t('confirmTransfer')}</DialogTitle>
            <DialogDescription>{t('enterPasswordToConfirm')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); confirmTransferWithPassword(); }} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">{t('password')}</label>
              <Input type="password" value={transferPw} onChange={e => setTransferPw(e.target.value)} required autoFocus />
            </div>
            {transferPwError && <div className="text-red-500 text-sm text-center">{transferPwError}</div>}
            <DialogFooter>
              <Button type="submit" className="w-full rounded-full bg-gradient-to-r from-primary to-accent shadow-lg text-lg font-bold py-2" disabled={transferPwLoading}>
                {transferPwLoading ? t('verifying') : t('confirm')}
              </Button>
              <Button type="button" variant="ghost" className="w-full mt-2" onClick={() => setShowTransferPw(false)}>
                {t('cancel')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Drawer open={showProfile} onOpenChange={setShowProfile}>
        <DrawerContent className="max-w-lg mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl shadow-2xl p-0">
          <DrawerHeader className="px-8 pt-8 pb-2">
            <DrawerTitle className="text-2xl font-extrabold tracking-tight text-primary drop-shadow-sm">{t('profileSettings')}</DrawerTitle>
            <DrawerDescription className="text-base text-muted-foreground mt-1 mb-2">{t('manageAccountAndPreferences')}</DrawerDescription>
          </DrawerHeader>
          <Tabs value={profileTab} onValueChange={setProfileTab} className="px-8 pb-8 pt-2">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
              <TabsTrigger value="preferences">{t('preferences')}</TabsTrigger>
              <TabsTrigger value="activity">{t('activityLog')}</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              {/* Editable profile info placeholder */}
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">{t('name')}</label>
                  <Input type="text" value={user?.name || ""} disabled className="rounded-full" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">{t('email')}</label>
                  <Input type="email" value={user?.email || ""} disabled className="rounded-full" />
                </div>
                <Button className="rounded-full mt-2" disabled>{t('saveChangesComingSoon')}</Button>
              </div>
            </TabsContent>
            <TabsContent value="preferences">
              {/* Theme and language preferences placeholder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('theme')}</span>
                  <Switch checked={isDark} onCheckedChange={handleThemeToggle} />
                </div>
                <div>
                  <label className="block mb-1 font-medium">{t('language')}</label>
                  <Select value={lang} onValueChange={setLang}>
                    <SelectTrigger className="w-32 rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t('english')}</SelectItem>
                      <SelectItem value="he">{t('hebrew')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="activity">
              {/* Activity log placeholder */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="text-muted-foreground text-center py-8">{t('activityLogComingSoon')}</div>
              </div>
            </TabsContent>
          </Tabs>
          <DrawerClose asChild>
            <Button variant="ghost" className="absolute top-4 right-4 rounded-full">{t('close')}</Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    </div>
  );
}