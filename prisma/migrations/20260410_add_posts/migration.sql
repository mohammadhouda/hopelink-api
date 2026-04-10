-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('GENERAL', 'CERTIFICATE', 'PROJECT');

-- CreateTable: Post
CREATE TABLE "Post" (
  "id"        SERIAL       NOT NULL,
  "content"   TEXT         NOT NULL,
  "imageUrl"  TEXT,
  "authorId"  INTEGER      NOT NULL,
  "postType"  "PostType"   NOT NULL DEFAULT 'GENERAL',
  "refId"     INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PostLike
CREATE TABLE "PostLike" (
  "id"        SERIAL       NOT NULL,
  "postId"    INTEGER      NOT NULL,
  "userId"    INTEGER      NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PostComment
CREATE TABLE "PostComment" (
  "id"        SERIAL       NOT NULL,
  "postId"    INTEGER      NOT NULL,
  "authorId"  INTEGER      NOT NULL,
  "content"   TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "Post"
  ADD CONSTRAINT "Post_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostLike"
  ADD CONSTRAINT "PostLike_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostLike"
  ADD CONSTRAINT "PostLike_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostComment"
  ADD CONSTRAINT "PostComment_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostComment"
  ADD CONSTRAINT "PostComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique Constraints
ALTER TABLE "PostLike"
  ADD CONSTRAINT "PostLike_postId_userId_key" UNIQUE ("postId", "userId");

-- Indexes
CREATE INDEX "Post_authorId_idx"             ON "Post"("authorId");
CREATE INDEX "Post_createdAt_idx"            ON "Post"("createdAt");
CREATE INDEX "PostLike_postId_idx"           ON "PostLike"("postId");
CREATE INDEX "PostComment_postId_createdAt_idx" ON "PostComment"("postId", "createdAt");
