from fastapi import HTTPException

from app.repository import FollowerRepository


class FollowerService:
    def __init__(self, repository: FollowerRepository):
        self.repository = repository

    def follow(self, follower_id: int, following_id: int) -> bool:
        self._ensure_not_self_follow(follower_id, following_id)
        return self.repository.follow(follower_id, following_id)

    def unfollow(self, follower_id: int, following_id: int) -> None:
        self._ensure_not_self_follow(follower_id, following_id)
        self.repository.unfollow(follower_id, following_id)

    def is_following(self, follower_id: int, following_id: int) -> bool:
        if follower_id == following_id:
            return True
        return self.repository.is_following(follower_id, following_id)

    def followed_user_ids(self, follower_id: int) -> list[int]:
        return self.repository.followed_user_ids(follower_id)

    def recommendations(self, user_id: int, limit: int) -> list[dict]:
        return self.repository.recommendations(user_id, limit)

    @staticmethod
    def _ensure_not_self_follow(follower_id: int, following_id: int) -> None:
        if follower_id == following_id:
            raise HTTPException(status_code=400, detail="Users cannot follow themselves.")
