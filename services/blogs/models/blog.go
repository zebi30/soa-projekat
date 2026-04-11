package models

import "time"

type Blog struct {
	ID          int        `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"createdAt"`
	AuthorID    int        `json:"authorId"`
	Status      string     `json:"status"`
	Images      []string   `json:"images,omitempty"`
	VoteCount   int        `json:"voteCount"`
	Comments    []Comment  `json:"comments,omitempty"`
}
