import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Invalid email format.";
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password))
      return "Password must be at least 8 characters, include upper and lower case letters, and a number.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password })
      });
      const data = await res.json();
      if (data.success) {
        navigate("/login", { state: { registered: true } });
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/10">
      <Card className="w-full max-w-md bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-2xl rounded-3xl border-none">
        <CardHeader className="px-8 pt-8 pb-4 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-primary drop-shadow-sm">Sign Up</CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                className="rounded-full bg-white/80 dark:bg-zinc-800/80 border border-accent/30 focus:ring-2 focus:ring-primary/40 shadow-inner px-5 py-2 text-lg"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                className="rounded-full bg-white/80 dark:bg-zinc-800/80 border border-accent/30 focus:ring-2 focus:ring-primary/40 shadow-inner px-5 py-2 text-lg"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
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
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                className="rounded-full bg-white/80 dark:bg-zinc-800/80 border border-accent/30 focus:ring-2 focus:ring-primary/40 shadow-inner px-5 py-2 text-lg"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="rounded-full bg-white/80 dark:bg-zinc-800/80 border border-accent/30 focus:ring-2 focus:ring-primary/40 shadow-inner px-5 py-2 text-lg"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <Button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-primary to-accent shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 text-lg font-bold py-2"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
          </form>
          <div className="flex flex-col items-center gap-2 pt-2">
            <Link to="/login" className="text-primary font-medium hover:underline">Back to Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register; 