package models

import (
	"time"

	"blog-service/client"
)

type Comment struct {
	ID        int       `json:"id"`
	BlogID    int       `json:"blogId"`
	AuthorID  int       `json:"authorId"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type CommentResponse struct {
	ID        int                `json:"id"`
	BlogID    int                `json:"blogId"`
	Author    *client.AuthorInfo `json:"author"`
	Text      string             `json:"text"`
	CreatedAt time.Time          `json:"createdAt"`
	UpdatedAt time.Time          `json:"updatedAt"`
}

func NewCommentResponse(c Comment, author *client.AuthorInfo) CommentResponse {
	return CommentResponse{
		ID:        c.ID,
		BlogID:    c.BlogID,
		Author:    author,
		Text:      c.Text,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
}
