CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	`oauth_token_secret` text,
	`oauth_token` text
);
--> statement-breakpoint
CREATE INDEX `accounts_userId_idx` ON `accounts` (`userId`);--> statement-breakpoint
CREATE TABLE `books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`isbn` text,
	`description` text,
	`published_year` integer,
	`genre` text,
	`pages` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `books_isbn_unique` ON `books` (`isbn`);--> statement-breakpoint
CREATE INDEX `books_title_idx` ON `books` (`title`);--> statement-breakpoint
CREATE INDEX `books_author_idx` ON `books` (`author`);--> statement-breakpoint
CREATE INDEX `books_isbn_idx` ON `books` (`isbn`);--> statement-breakpoint
CREATE INDEX `books_genre_idx` ON `books` (`genre`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text NOT NULL,
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_tokens_identifier_idx` ON `verification_tokens` (`identifier`);