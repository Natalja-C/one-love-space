"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import WelcomeScreen from "../components/WelcomeScreen";
import { isAuthenticated } from "../components/auth";

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  return <WelcomeScreen />;
}