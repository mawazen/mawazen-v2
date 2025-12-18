ALTER TABLE `documents` ADD `templateCategory` varchar(100);
--> statement-breakpoint
ALTER TABLE `documents` ADD `expiresAt` timestamp;
--> statement-breakpoint
ALTER TABLE `documents` ADD `renewAt` timestamp;
--> statement-breakpoint
ALTER TABLE `documents` ADD `reminderDays` int DEFAULT 30;
--> statement-breakpoint
ALTER TABLE `documents` ADD `lastReminderSentAt` timestamp;
