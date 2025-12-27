"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProfilePictureSection } from "./profile-picture-section";
import { AccountActionsSection } from "./account-actions-section";
import { DangerZoneSection } from "./danger-zone-section";
import { useSession } from "@/hooks/queries/use-auth";

const ProfilePage = () => {
  const { data: user, isLoading, error } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="text-center text-red-500">
            Failed to load profile data
          </div>
        </div>
      </div>
    );
  }

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

        <ProfilePictureSection user={user ?? null} />

        <AccountActionsSection />

        <DangerZoneSection />
      </div>
    </div>
  );
};

export default ProfilePage;
