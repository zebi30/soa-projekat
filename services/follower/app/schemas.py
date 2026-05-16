from pydantic import BaseModel, Field


class FollowRequest(BaseModel):
    followingId: int = Field(..., gt=0)


class FollowStatus(BaseModel):
    followerId: int
    followingId: int
    isFollowing: bool


class UserNode(BaseModel):
    id: int


class Recommendation(BaseModel):
    id: int
    mutualFollowCount: int
