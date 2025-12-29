import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProfilePictureSectionWrapper } from "./profile-picture-section-wrapper";
import { ThemeSection } from "./theme-section";
import { AccountActionsSection } from "./account-actions-section";
import { DangerZoneSection } from "./danger-zone-section";

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Link href="/home">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
          </Link>
        </div>
        <div className="space-y-6">
          <ProfilePictureSectionWrapper />

          <ThemeSection />

          <AccountActionsSection />

          <DangerZoneSection />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
