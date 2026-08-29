"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import WelcomeScreen from "../components/WelcomeScreen";
import { isAuthenticated } from "../components/auth";

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
  const checkAuth = async () => {
    const authenticated = await isAuthenticated();

    if (authenticated) {
      router.replace("/");
    }
  };

  checkAuth();
}, [router]);

  return <WelcomeScreen />;
}