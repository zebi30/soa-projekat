package handlers

import (
	"blog-service/client"
	"blog-service/models"
	"blog-service/repository"
	"blog-service/sagas"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type BlogHandler struct {
	Repo *repository.BlogRepository
}

func NewBlogHandler(repo *repository.BlogRepository) *BlogHandler {
	return &BlogHandler{Repo: repo}
}

func (h *BlogHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Authorization token is required", http.StatusUnauthorized)
		return
	}

	followedUserIDs, err := client.GetCurrentUserFollowedIDs(r.Context(), authHeader)
	if err != nil {
		http.Error(w, "Follower service unavailable", http.StatusBadGateway)
		return
	}

	blogs, err := h.Repo.GetByAuthorIDs(followedUserIDs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blogs)
}

func (h *BlogHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid blog ID", http.StatusBadRequest)
		return
	}

	blog, err := h.Repo.GetByID(id)
	if err != nil {
		http.Error(w, "Blog not found", http.StatusNotFound)
		return
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Authorization token is required", http.StatusUnauthorized)
		return
	}

	followStatus, err := client.IsCurrentUserFollowing(r.Context(), authHeader, blog.AuthorID)
	if err != nil {
		http.Error(w, "Follower service unavailable", http.StatusBadGateway)
		return
	}

	if !followStatus.IsFollowing {
		http.Error(w, "You can read only blogs written by users you follow", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blog)
}

func (h *BlogHandler) Create(w http.ResponseWriter, r *http.Request) {
	var blog models.Blog
	if err := json.NewDecoder(r.Body).Decode(&blog); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if blog.Title == "" || blog.Description == "" || blog.AuthorID == 0 {
		http.Error(w, "Title, description and authorId are required", http.StatusBadRequest)
		return
	}

	if blog.Status == "" {
		blog.Status = "published"
	}

	if err := sagas.CreateBlogSaga(r.Context(), h.Repo, &blog); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(blog)
}

func (h *BlogHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid blog ID", http.StatusBadRequest)
		return
	}

	var blog models.Blog
	if err := json.NewDecoder(r.Body).Decode(&blog); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	blog.ID = id
	if err := sagas.UpdateBlogSaga(r.Context(), h.Repo, &blog); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blog)
}

func (h *BlogHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid blog ID", http.StatusBadRequest)
		return
	}

	if err := sagas.DeleteBlogSaga(h.Repo, id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
