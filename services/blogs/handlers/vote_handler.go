package handlers

import (
	"blog-service/repository"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type VoteHandler struct {
	Repo *repository.VoteRepository
}

func NewVoteHandler(repo *repository.VoteRepository) *VoteHandler {
	return &VoteHandler{Repo: repo}
}

type voteRequest struct {
	UserID int `json:"userId"`
}

type voteResponse struct {
	VoteCount int `json:"voteCount"`
}

func (h *VoteHandler) Toggle(w http.ResponseWriter, r *http.Request) {
	blogID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid blog ID", http.StatusBadRequest)
		return
	}

	var req voteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.UserID == 0 {
		http.Error(w, "userId is required", http.StatusBadRequest)
		return
	}

	count, err := h.Repo.Toggle(blogID, req.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(voteResponse{VoteCount: count})
}

func (h *VoteHandler) GetCount(w http.ResponseWriter, r *http.Request) {
	blogID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid blog ID", http.StatusBadRequest)
		return
	}

	count, err := h.Repo.GetCount(blogID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(voteResponse{VoteCount: count})
}
