package models

import "time"

type Comment struct {
	ID        int       `json:"id"`
	BlogID    int       `json:"blogId"`
	AuthorID  int       `json:"authorId"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
