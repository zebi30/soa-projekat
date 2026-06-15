// Tracks the ids of blogs the current user has authored, per user, in
// localStorage. The backend feed only returns posts from followed authors and
// has no "my posts" endpoint, so we remember what this user created here to
// give them normal UI access to their own posts.
const key = (userId) => `soa_my_blogs_${userId}`;

export function getMyBlogIds(userId) {
  if (userId === null || userId === undefined) return [];
  try {
    const ids = JSON.parse(localStorage.getItem(key(userId)));
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function addMyBlogId(userId, id) {
  if (userId === null || userId === undefined || id === undefined) return;
  const ids = getMyBlogIds(userId);
  if (!ids.includes(id)) {
    ids.unshift(id);
    localStorage.setItem(key(userId), JSON.stringify(ids));
  }
}

export function removeMyBlogId(userId, id) {
  const ids = getMyBlogIds(userId).filter((x) => x !== id);
  localStorage.setItem(key(userId), JSON.stringify(ids));
}
