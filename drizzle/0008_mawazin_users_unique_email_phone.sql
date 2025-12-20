UPDATE `users` SET `email` = NULL WHERE `email` = '';
--> statement-breakpoint
UPDATE `users` SET `phone` = NULL WHERE `phone` = '';
--> statement-breakpoint

ALTER TABLE `users`
  ADD UNIQUE INDEX `users_email_unique` (`email`),
  ADD UNIQUE INDEX `users_phone_unique` (`phone`);
