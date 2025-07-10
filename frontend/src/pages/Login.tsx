import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import DashboardPreview from "@/components/DashboardPreview";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state && location.state.registered;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUnverified(false);
    setResent(false);
    try {
      const res = await fetch("/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        navigate("/");
      } else {
        if (data.error && data.error.toLowerCase().includes("verify your email")) {
          setUnverified(true);
        } else {
          setError(data.error || "Login failed");
        }
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    setResent(false);
    try {
      const res = await fetch("/api/resend_verification.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setResent(true);
      } else {
        setError(data.error || "Could not resend verification email.");
      }
    } catch (err) {
      setError("Network error");
    }
    setResendLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Blurred dashboard preview background */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none">
        <div className="absolute inset-0">
          <DashboardPreview />
        </div>
        <div className="absolute inset-0 bg-black/30 backdrop-blur" />
      </div>
      {/* Login card overlay */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-2xl rounded-3xl border-none">
          <CardHeader className="px-8 pt-8 pb-4 text-center">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-primary drop-shadow-sm">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-4 space-y-6">
            {registered && (
              <div className="text-green-600 text-center font-semibold mb-2">Registration successful! Please sign in.</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className="rounded-full bg-white/80 dark:bg-zinc-800/80 border border-accent/30 focus:ring-2 focus:ring-primary/40 shadow-inner px-5 py-2 text-lg"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="rounded-full bg-white/80 dark:bg-zinc-800/80 border border-accent/30 focus:ring-2 focus:ring-primary/40 shadow-inner px-5 py-2 text-lg"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              {unverified && (
                <div className="text-blue-600 text-center text-sm flex flex-col items-center gap-2">
                  <span>Your email is not verified. Please check your inbox.</span>
                  <Button
                    type="button"
                    className="w-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 text-lg font-bold py-2"
                    onClick={handleResend}
                    disabled={resendLoading}
                  >
                    {resendLoading ? "Resending..." : "Resend Verification Email"}
                  </Button>
                  {resent && <span className="text-green-600">Verification email sent!</span>}
                </div>
              )}
              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-primary to-accent shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 text-lg font-bold py-2"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="flex flex-col items-center gap-2 pt-2">
              <Link to="/register" className="text-primary font-medium hover:underline">Don't have an account? Sign Up</Link>
              <Link to="/forgot-password" className="text-accent font-medium hover:underline">Forgot Password?</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login; 