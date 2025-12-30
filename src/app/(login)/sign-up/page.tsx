"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { useSignUp } from "@/hooks/mutations/use-auth-mutations";
import { handleApiError } from "@/lib/error-handler";

declare global {
  interface Window {
    turnstile: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const signUpSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be less than 50 characters"),
    name: z
      .string()
      .max(100, "Name must be less than 100 characters")
      .optional(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
    turnstileToken: z
      .string()
      .min(1, "Please complete the security verification"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [error, setError] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const signUpMutation = useSignUp();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      username: "",
      name: "",
      password: "",
      confirmPassword: "",
      turnstileToken: "",
    },
  });

  useEffect(() => {
    // Don't initialize if widget already exists
    if (widgetIdRef.current) {
      return;
    }

    // Check if script is already loaded
    const existingScript = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    ) as HTMLScriptElement | null;

    const initializeTurnstile = () => {
      // Double-check widget doesn't exist before rendering
      if (turnstileRef.current && window.turnstile && !widgetIdRef.current) {
        const widgetId = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            form.setValue("turnstileToken", token, { shouldValidate: true });
          },
          "error-callback": () => {
            form.setValue("turnstileToken", "", { shouldValidate: true });
          },
          "expired-callback": () => {
            form.setValue("turnstileToken", "", { shouldValidate: true });
          },
        });
        widgetIdRef.current = widgetId;
      }
    };

    let script: HTMLScriptElement | null = null;
    let loadHandler: (() => void) | null = null;

    if (existingScript) {
      // Script already exists, just initialize if turnstile is available
      if (window.turnstile) {
        initializeTurnstile();
      } else {
        // Wait for script to load
        loadHandler = initializeTurnstile;
        existingScript.addEventListener("load", loadHandler);
      }
    } else {
      // Load Turnstile script
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;

      loadHandler = initializeTurnstile;
      script.onload = loadHandler;

      document.body.appendChild(script);
    }

    return () => {
      // Cleanup event listener if it was added
      if (loadHandler && existingScript) {
        existingScript.removeEventListener("load", loadHandler);
      }
      // Cleanup widget
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - form is stable from react-hook-form

  const onSubmit = async (data: SignUpFormValues) => {
    setError("");

    try {
      await signUpMutation.mutateAsync({
        email: data.email,
        username: data.username,
        password: data.password,
        displayName: data.name || undefined,
        turnstileToken: data.turnstileToken,
      });
    } catch (err) {
      setError(handleApiError(err));
      // Reset Turnstile widget on error
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        form.setValue("turnstileToken", "", { shouldValidate: true });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4 py-8">
        <div>
          <h2 className="text-center text-3xl font-bold">Create an account</h2>
          <p className="mt-2 text-center text-sm text-foreground/60">
            Sign up to get started
          </p>
        </div>

        <Form {...form}>
          <form
            className="mt-8 space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="username"
                        placeholder="Choose a username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        placeholder="Create a password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="turnstileToken"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <div
                        ref={turnstileRef}
                        className="w-full flex justify-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={signUpMutation.isPending || !form.formState.isValid}
              >
                {signUpMutation.isPending ? "Creating account..." : "Sign up"}
              </Button>
            </div>
            <div className="text-center text-sm">
              <span className="text-foreground/60">
                Already have an account?{" "}
              </span>
              <Link
                href="/sign-in"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
