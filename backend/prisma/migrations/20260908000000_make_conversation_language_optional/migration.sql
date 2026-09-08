-- Allow the conversation language to remain unknown until its first user message.
ALTER TABLE "conversations"
ALTER COLUMN "detected_language" DROP DEFAULT,
ALTER COLUMN "detected_language" DROP NOT NULL;
