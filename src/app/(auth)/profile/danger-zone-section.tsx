"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export const DangerZoneSection = () => {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteAccount = () => {
    // Navigate to delete account process page
    router.push("/delete-account");
  };

  return (
    <Card className="border-destructive/30 bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Account</CardTitle>
        <CardDescription>
          Once you delete your account, there is no going back. This will
          permanently delete your account, all your posts, and all associated
          data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 size-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove all your data from our servers, including:
              </AlertDialogDescription>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-6">
                <li>All your posts</li>
                <li>All your attachments</li>
                <li>Your profile information</li>
              </ul>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
