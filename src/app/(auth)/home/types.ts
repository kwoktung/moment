export interface Post {
  id: number;
  text: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string | null;
  attachments: Array<{ uri: string }>;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
  } | null;
}
