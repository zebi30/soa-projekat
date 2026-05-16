from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Query, Response, status
from neo4j import GraphDatabase

from app.auth import get_current_user_id
from app.config import settings
from app.repository import FollowerRepository
from app.schemas import FollowRequest, FollowStatus, Recommendation, UserNode
from app.service import FollowerService


repository = FollowerRepository(
    GraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password),
    )
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    repository.create_constraints()
    yield
    repository.close()


app = FastAPI(title="Follower Service", version="1.0.0", lifespan=lifespan)


def get_service() -> FollowerService:
    return FollowerService(repository)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/follows", response_model=FollowStatus, status_code=status.HTTP_201_CREATED)
def follow(
    payload: FollowRequest,
    current_user_id: int = Depends(get_current_user_id),
    service: FollowerService = Depends(get_service),
):
    service.follow(current_user_id, payload.followingId)
    return {
        "followerId": current_user_id,
        "followingId": payload.followingId,
        "isFollowing": True,
    }


@app.delete("/follows", status_code=status.HTTP_204_NO_CONTENT)
def unfollow(
    payload: FollowRequest,
    current_user_id: int = Depends(get_current_user_id),
    service: FollowerService = Depends(get_service),
):
    service.unfollow(current_user_id, payload.followingId)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/follows/me/{following_id}", response_model=FollowStatus)
def is_current_user_following(
    following_id: int,
    current_user_id: int = Depends(get_current_user_id),
    service: FollowerService = Depends(get_service),
):
    return {
        "followerId": current_user_id,
        "followingId": following_id,
        "isFollowing": service.is_following(current_user_id, following_id),
    }


@app.get("/me/following", response_model=list[UserNode])
def following(
    current_user_id: int = Depends(get_current_user_id),
    service: FollowerService = Depends(get_service),
):
    return [{"id": followed_id} for followed_id in service.followed_user_ids(current_user_id)]


@app.get("/me/recommendations", response_model=list[Recommendation])
def recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user_id: int = Depends(get_current_user_id),
    service: FollowerService = Depends(get_service),
):
    return service.recommendations(current_user_id, limit)
