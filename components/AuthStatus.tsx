
"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      const client = getSupabaseClient();

      if (!client) {
        setLoading(false);
        return;
      }

      const { data, error } = await client.auth.getUser();

      if (!error) {
        setEmail(data.user?.email ?? null);
      }

      setLoading(false);

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user.email ?? null);
      });

      return subscription;
    }

    let subscription:
      | { unsubscribe: () => void }
      | undefined;

    let active = true;

    void initializeAuth().then((result) => {
      if (active) {
        subscription = result;
      } else {
        result?.unsubscribe();
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const client = getSupabaseClient();

    if (!client) return;

    const { error } = await client.auth.signOut();

    if (error) {
      console.error("Sign out failed:", error.message);
      return;
    }

    window.location.href = "/";
  }

  if (loading) {
    return (
      <span className="btn btn-outline" aria-live="polite">
        جاري التحقق...
      </span>
    );
  }

  if (email) {
    return (
      <>
        <span title={email}>أهلًا بك 👋</span>
        <button
          className="btn btn-outline"
          type="button"
          onClick={handleSignOut}
        >
          تسجيل الخروج
        </button>
      </>
    );
  }

  return (
    <a className="btn btn-outline" href="/login">
      تسجيل الدخول
    </a>
  );
}
