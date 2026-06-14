from neo4j import Driver

from app.tracing import get_tracer

tracer = get_tracer()


class FollowerRepository:
    def __init__(self, driver: Driver):
        self.driver = driver

    def close(self) -> None:
        self.driver.close()

    def create_constraints(self) -> None:
        with self.driver.session() as session:
            session.run(
                "CREATE CONSTRAINT user_id_unique IF NOT EXISTS "
                "FOR (u:User) REQUIRE u.id IS UNIQUE"
            )

    def follow(self, follower_id: int, following_id: int) -> bool:
        with tracer.start_as_current_span("neo4j.follow") as span, self.driver.session() as session:
            span.set_attribute("db.system", "neo4j")
            span.set_attribute("follower.id", follower_id)
            span.set_attribute("following.id", following_id)
            result = session.run(
                """
                MERGE (follower:User {id: $follower_id})
                MERGE (following:User {id: $following_id})
                MERGE (follower)-[relation:FOLLOWS]->(following)
                RETURN relation IS NOT NULL AS followed
                """,
                follower_id=follower_id,
                following_id=following_id,
            )
            record = result.single()
            return bool(record["followed"]) if record else False

    def unfollow(self, follower_id: int, following_id: int) -> None:
        with tracer.start_as_current_span("neo4j.unfollow") as span, self.driver.session() as session:
            span.set_attribute("db.system", "neo4j")
            span.set_attribute("follower.id", follower_id)
            span.set_attribute("following.id", following_id)
            session.run(
                """
                MATCH (:User {id: $follower_id})-[relation:FOLLOWS]->(:User {id: $following_id})
                DELETE relation
                """,
                follower_id=follower_id,
                following_id=following_id,
            )

    def is_following(self, follower_id: int, following_id: int) -> bool:
        with tracer.start_as_current_span("neo4j.is_following") as span, self.driver.session() as session:
            span.set_attribute("db.system", "neo4j")
            span.set_attribute("follower.id", follower_id)
            span.set_attribute("following.id", following_id)
            result = session.run(
                """
                MATCH (:User {id: $follower_id})-[relation:FOLLOWS]->(:User {id: $following_id})
                RETURN count(relation) > 0 AS is_following
                """,
                follower_id=follower_id,
                following_id=following_id,
            )
            record = result.single()
            return bool(record["is_following"]) if record else False

    def followed_user_ids(self, follower_id: int) -> list[int]:
        with tracer.start_as_current_span("neo4j.followed_user_ids") as span, self.driver.session() as session:
            span.set_attribute("db.system", "neo4j")
            span.set_attribute("follower.id", follower_id)
            result = session.run(
                """
                MATCH (:User {id: $follower_id})-[:FOLLOWS]->(following:User)
                RETURN following.id AS id
                ORDER BY id
                """,
                follower_id=follower_id,
            )
            return [record["id"] for record in result]

    def recommendations(self, user_id: int, limit: int) -> list[dict]:
        with tracer.start_as_current_span("neo4j.recommendations") as span, self.driver.session() as session:
            span.set_attribute("db.system", "neo4j")
            span.set_attribute("user.id", user_id)
            span.set_attribute("recommendations.limit", limit)
            result = session.run(
                """
                MATCH (:User {id: $user_id})-[:FOLLOWS]->(:User)-[:FOLLOWS]->(recommended:User)
                WHERE recommended.id <> $user_id
                  AND NOT (:User {id: $user_id})-[:FOLLOWS]->(recommended)
                RETURN recommended.id AS id, count(*) AS mutualFollowCount
                ORDER BY mutualFollowCount DESC, id ASC
                LIMIT $limit
                """,
                user_id=user_id,
                limit=limit,
            )
            return [
                {
                    "id": record["id"],
                    "mutualFollowCount": record["mutualFollowCount"],
                }
                for record in result
            ]
