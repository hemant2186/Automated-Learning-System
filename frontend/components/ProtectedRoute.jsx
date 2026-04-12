"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ensureAccessToken } from "../lib/auth";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      const token = await ensureAccessToken();
      if (!token) {
        router.push("/");
        return;
      }
      if (active) {
        setReady(true);
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="container py-5">
        <div className="alert alert-secondary">Checking session...</div>
      </div>
    );
  }

  return children;
}
