-- Custom SQL: Relationship constraints and triggers
-- This file contains custom SQL that should be applied after schema migrations
-- When regenerating migrations from scratch, re-run: yarn db:generate --custom
-- Then copy this content into the generated custom migration file

-- Add composite indexes for efficient querying of relationships
CREATE INDEX IF NOT EXISTS `relationships_user1_id_status_idx` ON `relationships` (`user1_id`, `status`);
CREATE INDEX IF NOT EXISTS `relationships_user2_id_status_idx` ON `relationships` (`user2_id`, `status`);

-- Trigger to enforce single relationship (any status) on INSERT
-- Prevents users from having multiple relationships regardless of status
CREATE TRIGGER IF NOT EXISTS `enforce_single_relationship_insert`
BEFORE INSERT ON `relationships`
BEGIN
  SELECT RAISE(ABORT, 'User already has a relationship')
  WHERE EXISTS (
    SELECT 1 FROM relationships
    WHERE (user1_id = NEW.user1_id OR user2_id = NEW.user1_id
           OR user1_id = NEW.user2_id OR user2_id = NEW.user2_id)
  );
END;

-- Trigger to enforce single relationship (any status) on UPDATE
-- Prevents changing user IDs if it would violate the constraint
CREATE TRIGGER IF NOT EXISTS `enforce_single_relationship_update`
BEFORE UPDATE OF user1_id, user2_id ON `relationships`
BEGIN
  SELECT RAISE(ABORT, 'User already has a relationship')
  WHERE EXISTS (
    SELECT 1 FROM relationships
    WHERE id != NEW.id
    AND (user1_id = NEW.user1_id OR user2_id = NEW.user1_id
         OR user1_id = NEW.user2_id OR user2_id = NEW.user2_id)
  );
END;
