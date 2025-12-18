"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/client";

const Logout = () => {
  const router = useRouter();
  const [stage, setStage] = useState<
    "signing-out" | "redirecting" | "complete"
  >("signing-out");

  useEffect(() => {
    processLogout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processLogout = async () => {
    try {
      // Stage 1: Sign out
      setStage("signing-out");
      await Promise.all([
        apiClient.auth.postApiAuthSignOut(),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);

      // Stage 2: Redirecting
      setStage("redirecting");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Stage 3: Complete
      setStage("complete");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect
      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      router.push("/sign-in");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        {/* Static Icon Container */}
        <div className="relative inline-block mb-8">
          <div className="flex items-center justify-center w-32 h-32 rounded-full bg-primary/10">
            <LogOut className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Text content with fade transitions */}
        <div className="space-y-4">
          <h1
            className={`text-2xl font-bold transition-all duration-500 ${
              stage === "complete"
                ? "opacity-0 -translate-y-2"
                : "opacity-100 translate-y-0"
            }`}
          >
            {stage === "signing-out" && "Signing you out..."}
            {stage === "redirecting" && "Almost done..."}
            {stage === "complete" && "Goodbye!"}
          </h1>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2
              className={`w-4 h-4 animate-spin transition-opacity duration-300 ${
                stage === "complete" ? "opacity-0" : "opacity-100"
              }`}
            />
            <p
              className={`text-sm transition-all duration-500 ${
                stage === "complete" ? "opacity-0" : "opacity-100"
              }`}
            >
              {stage === "signing-out" && "Clearing your session..."}
              {stage === "redirecting" && "Preparing to redirect..."}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                stage === "signing-out"
                  ? "bg-primary scale-125"
                  : "bg-primary/30 scale-100"
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                stage === "redirecting"
                  ? "bg-primary scale-125"
                  : stage === "signing-out"
                    ? "bg-muted-foreground/30 scale-100"
                    : "bg-primary/30 scale-100"
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                stage === "complete"
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30 scale-100"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logout;
