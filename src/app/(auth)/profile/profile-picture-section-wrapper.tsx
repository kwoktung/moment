"use client";

import { useSession } from "@/hooks/queries/use-auth";
import { ProfilePictureSection } from "./profile-picture-section";
import { ProfilePictureSkeleton } from "./profile-picture-skeleton";

export const ProfilePictureSectionWrapper = () => {
  const { data: user, isLoading } = useSession();

  if (isLoading) {
    return <ProfilePictureSkeleton />;
  }

  return <ProfilePictureSection user={user ?? null} />;
};
