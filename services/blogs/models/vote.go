package models

type Vote struct {
	ID     int `json:"id"`
	BlogID int `json:"blogId"`
	UserID int `json:"userId"`
}
