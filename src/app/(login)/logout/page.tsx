"use client";

import Head from "next/head";
import { signOut } from "next-auth/react";
import { useEffect } from "react";

const Logout = () => {
  useEffect(() => {
    signOut({
      redirectTo: "/",
    });
  }, []);

  return (
    <div className="flex items-center justify-center">
      <Head>
        <title>Logging Out</title>
        <meta name="description" content="Logging out of your account" />
      </Head>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary/90 mx-auto"></div>
        <p className="mt-4 text-lg text-foreground">Logging out...</p>
        <p className="mt-2 text-sm text-foreground/50">
          Redirecting to login...
        </p>
      </div>
    </div>
  );
};

export default Logout;
