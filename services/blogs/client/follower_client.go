package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type FollowStatus struct {
	FollowerID   int  `json:"followerId"`
	FollowingID  int  `json:"followingId"`
	IsFollowing bool `json:"isFollowing"`
}

type FollowedUser struct {
	ID int `json:"id"`
}

func followerServiceURL() string {
	if value := os.Getenv("FOLLOWER_SERVICE_URL"); value != "" {
		return value
	}
	return "http://follower-service:8000"
}

func IsFollowing(ctx context.Context, followerID, followingID int) (bool, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/follows/%d/%d", followerServiceURL(), followerID, followingID), nil)
	if err != nil {
		return false, err
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("follower service returned status %d", resp.StatusCode)
	}

	var status FollowStatus
	if err := json.NewDecoder(resp.Body).Decode(&status); err != nil {
		return false, err
	}

	return status.IsFollowing, nil
}

func IsCurrentUserFollowing(ctx context.Context, authHeader string, followingID int) (*FollowStatus, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/follows/me/%d", followerServiceURL(), followingID), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", authHeader)

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("follower service returned status %d", resp.StatusCode)
	}

	var status FollowStatus
	if err := json.NewDecoder(resp.Body).Decode(&status); err != nil {
		return nil, err
	}

	return &status, nil
}

func GetFollowedUserIDs(ctx context.Context, userID int) ([]int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/users/%d/following", followerServiceURL(), userID), nil)
	if err != nil {
		return nil, err
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("follower service returned status %d", resp.StatusCode)
	}

	var users []FollowedUser
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, err
	}

	ids := make([]int, 0, len(users))
	for _, user := range users {
		ids = append(ids, user.ID)
	}

	return ids, nil
}

func GetCurrentUserFollowedIDs(ctx context.Context, authHeader string) ([]int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/me/following", followerServiceURL()), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", authHeader)

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("follower service returned status %d", resp.StatusCode)
	}

	var users []FollowedUser
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, err
	}

	ids := make([]int, 0, len(users))
	for _, user := range users {
		ids = append(ids, user.ID)
	}

	return ids, nil
}
