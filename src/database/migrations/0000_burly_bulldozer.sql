CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`post_id` integer,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `attachments_filename_idx` ON `attachments` (`filename`);--> statement-breakpoint
CREATE INDEX `attachments_post_id_idx` ON `attachments` (`post_id`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invite_code` text NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_invite_code_unique` ON `invitations` (`invite_code`);--> statement-breakpoint
CREATE INDEX `invitations_invite_code_idx` ON `invitations` (`invite_code`);--> statement-breakpoint
CREATE INDEX `invitations_created_by_idx` ON `invitations` (`created_by`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL,
	`created_by` integer NOT NULL,
	`relationship_id` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `posts_created_by_idx` ON `posts` (`created_by`);--> statement-breakpoint
CREATE INDEX `posts_created_at_idx` ON `posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `posts_relationship_id_idx` ON `posts` (`relationship_id`);--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refresh_tokens_token_hash_unique` ON `refresh_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_id_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_token_hash_idx` ON `refresh_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_expires_at_idx` ON `refresh_tokens` (`expires_at`);--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user1_id` integer NOT NULL,
	`user2_id` integer NOT NULL,
	`status` text NOT NULL,
	`start_date` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`ended_at` integer,
	`resume_requested_by` integer,
	`resume_requested_at` integer
);
--> statement-breakpoint
CREATE INDEX `relationships_user1_id_idx` ON `relationships` (`user1_id`);--> statement-breakpoint
CREATE INDEX `relationships_user2_id_idx` ON `relationships` (`user2_id`);--> statement-breakpoint
CREATE INDEX `relationships_status_idx` ON `relationships` (`status`);--> statement-breakpoint
CREATE INDEX `relationships_ended_at_idx` ON `relationships` (`ended_at`);--> statement-breakpoint
CREATE INDEX `relationships_resume_requested_by_idx` ON `relationships` (`resume_requested_by`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`display_name` text,
	`avatar` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_username_idx` ON `users` (`username`);