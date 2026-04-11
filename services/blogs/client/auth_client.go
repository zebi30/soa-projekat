package client

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type AuthorInfo struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	CreatedAt string `json:"created_at"`
}

func GetUserByID(userID int) (*AuthorInfo, error) {
	authServiceURL := os.Getenv("AUTH_SERVICE_URL")
	if authServiceURL == "" {
		authServiceURL = "http://authorization-service:3001"
	}

	resp, err := http.Get(fmt.Sprintf("%s/auth/users/%d", authServiceURL, userID))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("user %d not found", userID)
	}

	var result struct {
		User AuthorInfo `json:"user"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result.User, nil
}
