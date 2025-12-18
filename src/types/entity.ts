import { userTable, attachmentTable, postTable } from "@/database/schema";

export type UserItem = typeof userTable.$inferSelect;
export type NewUserItem = typeof userTable.$inferInsert;
export type AttachmentItem = typeof attachmentTable.$inferSelect;
export type NewAttachmentItem = typeof attachmentTable.$inferInsert;
export type PostItem = typeof postTable.$inferSelect;
export type NewPostItem = typeof postTable.$inferInsert;
