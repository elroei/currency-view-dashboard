import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch("/api/request_password_reset.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      setSent(true);
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/10">
      <Card className="w-full max-w-md bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-2xl rounded-3xl border-none">
        <CardHeader className="px-8 pt-8 pb-4 text-center">
          <CardTitle className="text-2xl font-extrabold tracking-tight text-primary drop-shadow-sm">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4 space-y-6">
          {sent ? (
            <div className="text-green-600 text-center font-semibold">If your email exists, you'll receive a password reset link shortly.</div>
          ) : (
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
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-primary to-accent shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 text-lg font-bold py-2"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
          <div className="flex flex-col items-center gap-2 pt-2">
            <Link to="/login" className="text-primary font-medium hover:underline">Back to Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword; 