"use client";

import { useEffect, useState } from "react";
import { api } from "./api";

export type CurrentUser = {
  id: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "REFEREE";
  isActive: boolean;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
  referee?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    licenseNumber: string | null;
  } | null;
};

export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await api.me();
      if (!mounted) return;
      setUser(res.success ? (res.data as CurrentUser) : null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    isManager: user?.role === "MANAGER",
    isReferee: user?.role === "REFEREE",
  };
}