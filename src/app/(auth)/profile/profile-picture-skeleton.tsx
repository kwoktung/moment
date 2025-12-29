import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfilePictureSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex-1 space-y-4">
            <div>
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex items-center gap-2 flex-wrap">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
