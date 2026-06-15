import { useEffect, useState } from "react";
import { getUser } from "../api/users";

// Resolves an author id to a user object (cached). Returns null while loading
// or if the user could not be fetched.
export function useAuthor(authorId) {
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    let active = true;
    if (authorId === null || authorId === undefined) {
      setAuthor(null);
      return;
    }
    getUser(authorId).then((u) => {
      if (active) setAuthor(u);
    });
    return () => {
      active = false;
    };
  }, [authorId]);

  return author;
}
