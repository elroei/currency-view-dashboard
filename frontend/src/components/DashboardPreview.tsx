import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Plus, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const currencyFlags = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  ILS: "🇮🇱"
};

const staticBalances = {
  USD: 4321.12,
  EUR: 2987.45,
  GBP: 1560.33,
  ILS: 12000.00
};
const staticRates = [
  { currency: "USD", rate: 3.67 },
  { currency: "EUR", rate: 3.98 },
  { currency: "GBP", rate: 4.64 },
  { currency: "ILS", rate: 1.00 }
];
const staticTransactions = [
  { date: "2024-07-10", type: "Deposit", amount: "1,000.00", currency: "USD", equivalent: "3,650.00" },
  { date: "2024-07-09", type: "Transfer In", amount: "500.00", currency: "EUR", equivalent: "1,950.00" },
  { date: "2024-07-08", type: "Conversion Out", amount: "200.00", currency: "GBP", equivalent: "920.00" },
  { date: "2024-07-07", type: "Deposit", amount: "2,000.00", currency: "ILS", equivalent: "2,000.00" }
];

export default function DashboardPreview() {
  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-gray-100 overflow-hidden select-none pointer-events-none">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <div className="text-2xl font-extrabold tracking-tight text-primary drop-shadow-sm">💱 Currency Wallet</div>
        <div className="flex items-center gap-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-lg rounded-full px-5 py-2">
          <div className="text-sm text-muted-foreground text-left">
            <div className="font-bold text-primary">Jane Doe</div>
            <div className="text-xs">jane.doe@example.com</div>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2 bg-gradient-card shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Button variant="ghost" size="icon" disabled>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {currencyFlags["USD"]} 12,345.67 USD
              </div>
              <p className="text-xs text-muted-foreground mt-2">+2.1% from last week</p>
            </CardContent>
          </Card>
          {Object.entries(staticBalances).map(([currency, amount]) => (
            <Card key={currency} className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {currencyFlags[currency]} {currency}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ≈ {currencyFlags["ILS"]} {(Number(amount) * 3.65).toLocaleString(undefined, { maximumFractionDigits: 2 })} ILS
                </div>
                <Progress value={65} className="mt-2 h-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Deposit & Exchange Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-success" />
                <span>Quick Deposit</span>
              </CardTitle>
              <div className="text-muted-foreground text-xs">Add funds instantly</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="font-medium">Amount</div>
                    <input type="number" className="rounded-full bg-white/80 border border-accent/30 px-5 py-2 text-lg w-full" placeholder="0.00" disabled />
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Currency</div>
                    <input type="text" className="rounded-full bg-white/80 border border-accent/30 px-5 py-2 text-lg w-full" placeholder="USD" disabled />
                  </div>
                </div>
                <Button className="w-full mt-2" variant="success" size="lg" disabled>Deposit Funds</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Exchange Rates</CardTitle>
                <div className="text-muted-foreground text-xs">Current rates</div>
              </div>
              <Button variant="ghost" size="icon" disabled>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center gap-2">
                <div className="font-medium">Base Currency:</div>
                <input type="text" className="w-24 rounded-full bg-white/80 border border-accent/30 px-2 py-1" value="USD" disabled />
              </div>
              <div className="space-y-3">
                {staticRates.map((rate) => (
                  <div key={rate.currency} className="flex items-center justify-between">
                    <span>{currencyFlags[rate.currency]} {rate.currency}</span>
                    <span>{rate.rate.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Transaction History Preview */}
        <div className="mt-8">
          <div className="text-lg font-bold mb-2">Recent Transactions</div>
          <Table className="bg-white/80 rounded-xl overflow-hidden">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Equivalent (ILS)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staticTransactions.map((tx, i) => (
                <TableRow key={i}>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>{tx.amount}</TableCell>
                  <TableCell>{tx.currency}</TableCell>
                  <TableCell>{tx.equivalent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 