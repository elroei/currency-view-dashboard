import { CurrencyDashboard } from "@/components/CurrencyDashboard";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/me.php")
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setLoggedIn(true);
        } else {
          navigate("/login");
        }
        setLoading(false);
      })
      .catch(() => {
        navigate("/login");
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/10">
        <div className="text-2xl font-bold text-primary animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!loggedIn) return null;
  return <CurrencyDashboard />;
};

export default Index;
