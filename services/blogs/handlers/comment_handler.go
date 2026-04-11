package handlers

import (
	"blog-service/models"
	"blog-service/repository"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type CommentHandler struct {
	Repo *repository.CommentRepository
}

func NewCommentHandler(repo *repository.CommentRepository) *CommentHandler {
	return &CommentHandler{Repo: repo}
}

func (h *CommentHandler) GetByBlogID(w http.ResponseWriter, r *http.Request) {
	blogID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid blog ID", http.StatusBadRequest)
		return
	}

	comments, err := h.Repo.GetByBlogID(blogID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

func (h *CommentHandler) Create(w http.ResponseWriter, r *http.Request) {
	blogID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid blog ID", http.StatusBadRequest)
		return
	}

	var comment models.Comment
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if comment.Text == "" || comment.AuthorID == 0 {
		http.Error(w, "Text and authorId are required", http.StatusBadRequest)
		return
	}

	comment.BlogID = blogID

	if err := h.Repo.Create(&comment); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(comment)
}

func (h *CommentHandler) Update(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.Atoi(mux.Vars(r)["commentId"])
	if err != nil {
		http.Error(w, "Invalid comment ID", http.StatusBadRequest)
		return
	}

	var comment models.Comment
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	comment.ID = commentID

	if err := h.Repo.Update(&comment); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comment)
}

func (h *CommentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.Atoi(mux.Vars(r)["commentId"])
	if err != nil {
		http.Error(w, "Invalid comment ID", http.StatusBadRequest)
		return
	}

	if err := h.Repo.Delete(commentID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
