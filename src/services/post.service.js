import prisma from "../config/prisma.js";

// ── Author include fragment (used in feed queries)
const AUTHOR_INCLUDE = {
  author: {
    select: {
      id: true,
      name: true,
      role: true,
      baseProfile: { select: { avatarUrl: true, city: true } },
      charityAccount: { select: { name: true, logoUrl: true } },
    },
  },
};

// ── Create a post
export async function createPost(authorId, { content, imageUrl, postType, refId }) {
  return prisma.post.create({
    data: {
      content,
      imageUrl: imageUrl ?? null,
      postType: postType ?? "GENERAL",
      refId: refId ?? null,
      authorId,
    },
    include: {
      ...AUTHOR_INCLUDE,
      _count: { select: { likes: true, comments: true } },
    },
  });
}

// ── Get feed (paginated, newest first)
export async function getFeed({ skip, take, page, limit, userId } = {}) {

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        ...AUTHOR_INCLUDE,
        _count: { select: { likes: true, comments: true } },
        likes: userId
          ? { where: { userId }, select: { id: true } }
          : false,
      },
    }),
    prisma.post.count(),
  ]);

  // Flatten: add `likedByMe` boolean
  const normalised = posts.map((p) => ({
    ...p,
    likedByMe: userId ? p.likes.length > 0 : false,
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
  }));

  return { posts: normalised, total, page, limit };
}

// ── Get single post
export async function getPostById(id, userId) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      ...AUTHOR_INCLUDE,
      _count: { select: { likes: true, comments: true } },
      likes: userId ? { where: { userId }, select: { id: true } } : false,
    },
  });

  if (!post) throw { status: 404, message: "Post not found" };

  return {
    ...post,
    likedByMe: userId ? post.likes.length > 0 : false,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
  };
}

// ── Delete a post (author only)
export async function deletePost(id, userId) {
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) throw { status: 404, message: "Post not found" };
  if (post.authorId !== userId) throw { status: 403, message: "Not your post" };
  await prisma.post.delete({ where: { id } });
}

// ── Toggle like
export async function toggleLike(postId, userId) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw { status: 404, message: "Post not found" };

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    const count = await prisma.postLike.count({ where: { postId } });
    return { liked: false, likesCount: count };
  } else {
    await prisma.postLike.create({ data: { postId, userId } });
    const count = await prisma.postLike.count({ where: { postId } });
    return { liked: true, likesCount: count };
  }
}

// ── Get comments for a post
export async function getComments(postId, { skip, take, page, limit } = {}) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw { status: 404, message: "Post not found" };

  const [comments, total] = await Promise.all([
    prisma.postComment.findMany({
      where: { postId },
      skip,
      take,
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            baseProfile: { select: { avatarUrl: true } },
            charityAccount: { select: { name: true, logoUrl: true } },
          },
        },
      },
    }),
    prisma.postComment.count({ where: { postId } }),
  ]);

  return { comments, total, page, limit };
}

// ── Add comment
export async function addComment(postId, authorId, content) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw { status: 404, message: "Post not found" };

  return prisma.postComment.create({
    data: { postId, authorId, content },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
          baseProfile: { select: { avatarUrl: true } },
          charityAccount: { select: { name: true, logoUrl: true } },
        },
      },
    },
  });
}

// ── Delete comment (author only)
export async function deleteComment(commentId, userId) {
  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });
  if (!comment) throw { status: 404, message: "Comment not found" };
  if (comment.authorId !== userId) throw { status: 403, message: "Not your comment" };
  await prisma.postComment.delete({ where: { id: commentId } });
}
