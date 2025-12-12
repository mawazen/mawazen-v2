CREATE TABLE `aiChatHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int,
	`sessionId` varchar(100) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiChatHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`eventType` enum('hearing','meeting','deadline','reminder','other') NOT NULL DEFAULT 'other',
	`startTime` timestamp NOT NULL,
	`endTime` timestamp,
	`allDay` boolean DEFAULT false,
	`location` varchar(255),
	`caseId` int,
	`userId` int,
	`reminderMinutes` int DEFAULT 60,
	`isRecurring` boolean DEFAULT false,
	`recurrenceRule` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`type` enum('criminal','commercial','family','administrative','labor','real_estate','other') NOT NULL DEFAULT 'other',
	`court` varchar(255),
	`courtBranch` varchar(255),
	`stage` enum('intake','filing','discovery','hearing','judgment','appeal','execution','closed') NOT NULL DEFAULT 'intake',
	`status` enum('active','pending','on_hold','won','lost','settled','closed') NOT NULL DEFAULT 'active',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`clientId` int NOT NULL,
	`assignedLawyerId` int,
	`opposingParty` varchar(500),
	`opposingLawyer` varchar(255),
	`filingDate` timestamp,
	`nextHearingDate` timestamp,
	`closingDate` timestamp,
	`estimatedValue` bigint,
	`actualValue` bigint,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`type` enum('individual','company','government') NOT NULL DEFAULT 'individual',
	`email` varchar(320),
	`phone` varchar(20),
	`secondaryPhone` varchar(20),
	`nationalId` varchar(20),
	`commercialRegister` varchar(50),
	`address` text,
	`city` varchar(100),
	`notes` text,
	`satisfactionScore` int DEFAULT 0,
	`totalPaid` bigint DEFAULT 0,
	`totalDue` bigint DEFAULT 0,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communicationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`caseId` int,
	`userId` int,
	`type` enum('call','email','meeting','whatsapp','sms','other') NOT NULL DEFAULT 'other',
	`direction` enum('incoming','outgoing') NOT NULL DEFAULT 'outgoing',
	`subject` varchar(255),
	`content` text,
	`contactedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communicationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(500) NOT NULL,
	`description` text,
	`type` enum('contract','memo','pleading','evidence','correspondence','court_order','power_of_attorney','other') NOT NULL DEFAULT 'other',
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`mimeType` varchar(100),
	`fileSize` bigint,
	`caseId` int,
	`clientId` int,
	`version` int DEFAULT 1,
	`parentDocumentId` int,
	`isTemplate` boolean DEFAULT false,
	`uploadedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hearings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`hearingDate` timestamp NOT NULL,
	`location` varchar(255),
	`courtRoom` varchar(100),
	`status` enum('scheduled','completed','postponed','cancelled') NOT NULL DEFAULT 'scheduled',
	`outcome` text,
	`notes` text,
	`reminderSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hearings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`clientId` int NOT NULL,
	`caseId` int,
	`amount` bigint NOT NULL,
	`taxAmount` bigint DEFAULT 0,
	`totalAmount` bigint NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'SAR',
	`status` enum('draft','sent','paid','partial','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`feeType` enum('hourly','fixed','percentage','retainer') NOT NULL DEFAULT 'fixed',
	`description` text,
	`dueDate` timestamp,
	`paidDate` timestamp,
	`paidAmount` bigint DEFAULT 0,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('hearing','deadline','payment','task','system') NOT NULL DEFAULT 'system',
	`isRead` boolean DEFAULT false,
	`relatedCaseId` int,
	`relatedInvoiceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`amount` bigint NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'SAR',
	`method` enum('cash','bank_transfer','credit_card','stc_pay','stripe','other') NOT NULL DEFAULT 'bank_transfer',
	`transactionId` varchar(255),
	`notes` text,
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`caseId` int,
	`assignedToId` int,
	`assignedById` int,
	`dueDate` timestamp,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`description` text,
	`minutes` int NOT NULL,
	`hourlyRate` bigint,
	`billable` boolean DEFAULT true,
	`invoiceId` int,
	`entryDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','lawyer','assistant','client') NOT NULL DEFAULT 'lawyer';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `specialty` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `barNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;