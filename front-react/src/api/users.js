import { api } from "./client";

// Small in-memory cache so we don't refetch the same author repeatedly when
// rendering blog feeds / detail. /auth/users/:id is a public endpoint that
// returns { user: { id, username, email, role, created_at } }.
const cache = new Map();

export async function getUser(id) {
  if (id === null || id === undefined) return null;
  const key = String(id);
  if (cache.has(key)) return cache.get(key);

  const res = await api("GET", "/auth/users/" + key);
  const user = res.ok && res.data?.user ? res.data.user : null;
  cache.set(key, user);
  return user;
}
