CREATE TABLE `serviceProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`serviceCatalogId` int,
	`clientId` int,
	`caseId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('new','in_progress','on_hold','completed','cancelled') NOT NULL DEFAULT 'new',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`assignedToUserId` int,
	`createdByUserId` int,
	`startDate` timestamp,
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serviceProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceProjectExpenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceProjectId` int NOT NULL,
	`amount` bigint NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'SAR',
	`description` text,
	`expenseDate` timestamp NOT NULL DEFAULT (now()),
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `serviceProjectExpenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `serviceProjectId` int;
--> statement-breakpoint
ALTER TABLE `documents` ADD `serviceProjectId` int;
--> statement-breakpoint
ALTER TABLE `invoices` ADD `serviceProjectId` int;
