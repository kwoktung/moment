import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: {
    username: string;
    displayName: string | null;
    avatar: string | null;
  } | null;
  createdBy: number;
  className?: string;
}

export const UserAvatar = ({
  user,
  createdBy,
  className = "size-9",
}: UserAvatarProps) => {
  return (
    <Avatar className={className}>
      {user?.avatar && (
        <AvatarImage
          src={user.avatar}
          alt={user.displayName || user.username}
        />
      )}
      <AvatarFallback>
        {user
          ? (user.displayName || user.username).slice(0, 1).toUpperCase()
          : createdBy.toString().slice(-1)}
      </AvatarFallback>
    </Avatar>
  );
};

