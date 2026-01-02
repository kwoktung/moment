"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { Heart, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRelationship } from "@/hooks/queries/use-relationship";
import {
  useEndRelationship,
  useUpdateRelationshipStartDate,
} from "@/hooks/mutations/use-relationship-mutations";

export const RelationshipTab = () => {
  const router = useRouter();
  const { data: relationshipData, isLoading } = useRelationship();
  const endRelationshipMutation = useEndRelationship();
  const updateStartDateMutation = useUpdateRelationshipStartDate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const partner = relationshipData?.relationship?.partner;
  const relationshipStartDate =
    relationshipData?.relationship?.relationshipStartDate;

  const [startDate, setStartDate] = useState("");
  const [hasChanged, setHasChanged] = useState(false);
  const [dateError, setDateError] = useState("");

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Update local state when relationship data changes
  useEffect(() => {
    if (relationshipStartDate) {
      const formattedDate = new Date(relationshipStartDate)
        .toISOString()
        .split("T")[0];
      setStartDate(formattedDate);
    }
  }, [relationshipStartDate]);

  const handleEndRelationship = async () => {
    await endRelationshipMutation.mutateAsync();
    router.push("/home");
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setStartDate(newDate);

    // Validate that date is not in the future
    if (newDate > today) {
      setDateError("Start date cannot be in the future");
      setHasChanged(false);
      return;
    }

    setDateError("");
    const originalDate = relationshipStartDate
      ? new Date(relationshipStartDate).toISOString().split("T")[0]
      : "";
    setHasChanged(newDate !== originalDate);
  };

  const handleSaveStartDate = async () => {
    if (!hasChanged || !startDate || dateError) return;

    try {
      await updateStartDateMutation.mutateAsync({ startDate });
      setHasChanged(false);
    } catch (error) {
      console.error("Failed to update start date:", error);
    }
  };

  const handleCancelStartDate = () => {
    if (relationshipStartDate) {
      const formattedDate = new Date(relationshipStartDate)
        .toISOString()
        .split("T")[0];
      setStartDate(formattedDate);
    } else {
      setStartDate("");
    }
    setDateError("");
    setHasChanged(false);
  };

  // Calculate days together
  const getDaysTogether = (dateStr: string): number => {
    if (!dateStr) return 0;
    const start = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  // No partner state
  if (!relationshipData?.relationship) {
    return (
      <Card className="p-6 text-center sm:p-8">
        <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No Active Relationship</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          You need to be paired with a partner to access relationship settings.
        </p>
        <Link href="/pair">
          <Button>Connect with Partner</Button>
        </Link>
      </Card>
    );
  }

  // Relationship settings
  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Relationship Start Date Card */}
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-base font-semibold sm:text-lg">
            Relationship Details
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="startDate">Relationship Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                max={today}
                className="mt-2"
              />
              {dateError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {dateError}
                </p>
              )}
              {hasChanged && !dateError && (
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={handleSaveStartDate}
                    disabled={updateStartDateMutation.isPending}
                    size="sm"
                  >
                    {updateStartDateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancelStartDate}
                    disabled={updateStartDateMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {!dateError && (
                <p className="mt-2 text-sm text-foreground/60">
                  {startDate
                    ? `${getDaysTogether(startDate)} days together`
                    : "No start date set"}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Separator />

        {/* Danger Zone */}
        <Card className="border-red-200 p-4 dark:border-red-400 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 sm:h-6 sm:w-6" />
            <div className="flex-1">
              <h2 className="mb-2 text-base font-semibold text-red-900 dark:text-red-100 sm:text-lg">
                Danger Zone
              </h2>
              <p className="mb-4 text-sm text-red-800 dark:text-red-200">
                Ending your relationship will start a 7-day grace period. During
                this time, all posts will remain visible but you cannot create
                new ones. After 7 days, all posts and memories will be
                permanently deleted.
              </p>

              <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    End Relationship
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will end your relationship with{" "}
                      <strong>
                        {partner?.displayName || partner?.username}
                      </strong>
                      .
                    </AlertDialogDescription>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="font-semibold">What happens next:</div>
                      <ul className="list-inside list-disc space-y-1">
                        <li>A 7-day grace period will begin immediately</li>
                        <li>
                          All posts and memories will remain visible during this
                          time
                        </li>
                        <li>Neither of you can create new posts</li>
                        <li>
                          After 7 days, everything will be permanently deleted
                        </li>
                        <li>
                          You can cancel the deletion anytime during the grace
                          period
                        </li>
                      </ul>
                    </div>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleEndRelationship}
                      disabled={endRelationshipMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {endRelationshipMutation.isPending
                        ? "Ending..."
                        : "Yes, End Relationship"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};
