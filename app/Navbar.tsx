"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="w-full bg-white border-b border-zinc-200 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-blue-700">
          SceneLearn
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-zinc-600 hover:text-blue-600">
            Từ vựng
          </Link>
          <Link href="/writing" className="text-zinc-600 hover:text-blue-600">
            Writing
          </Link>
          {isLoggedIn && (
            <Link href="/progress" className="text-zinc-600 hover:text-blue-600">
              Tiến độ
            </Link>
          )}
          {isLoggedIn ? (
            <button onClick={handleLogout} className="text-red-600 hover:underline">
              Đăng xuất
            </button>
          ) : (
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}