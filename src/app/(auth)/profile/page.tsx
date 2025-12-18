"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/client";
import { ProfilePictureSection } from "./profile-picture-section";
import { AccountActionsSection } from "./account-actions-section";
import { DangerZoneSection } from "./danger-zone-section";
import type { UserData } from "./types";

const ProfilePage = () => {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await apiClient.auth.getApiAuthSession();
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const handleUserUpdate = (updatedUser: UserData) => {
    setUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Link href="/home">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 size-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>

        <ProfilePictureSection
          user={user}
          onUserUpdate={handleUserUpdate}
          onRefresh={fetchUserData}
        />

        <AccountActionsSection />

        <DangerZoneSection />
      </div>
    </div>
  );
};

export default ProfilePage;
