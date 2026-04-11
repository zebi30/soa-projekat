package router

import (
	"blog-service/handlers"

	"github.com/gorilla/mux"
)

func NewRouter(blogH *handlers.BlogHandler, commentH *handlers.CommentHandler, voteH *handlers.VoteHandler) *mux.Router {
	r := mux.NewRouter()

	api := r.PathPrefix("/api").Subrouter()

	// Blog routes
	api.HandleFunc("/blogs", blogH.GetAll).Methods("GET")
	api.HandleFunc("/blogs/{id}", blogH.GetByID).Methods("GET")
	api.HandleFunc("/blogs", blogH.Create).Methods("POST")
	api.HandleFunc("/blogs/{id}", blogH.Update).Methods("PUT")
	api.HandleFunc("/blogs/{id}", blogH.Delete).Methods("DELETE")

	// Comment routes
	api.HandleFunc("/blogs/{id}/comments", commentH.GetByBlogID).Methods("GET")
	api.HandleFunc("/blogs/{id}/comments", commentH.Create).Methods("POST")
	api.HandleFunc("/blogs/{id}/comments/{commentId}", commentH.Update).Methods("PUT")
	api.HandleFunc("/blogs/{id}/comments/{commentId}", commentH.Delete).Methods("DELETE")

	// Vote routes
	api.HandleFunc("/blogs/{id}/votes", voteH.Toggle).Methods("POST")
	api.HandleFunc("/blogs/{id}/votes", voteH.GetCount).Methods("GET")

	return r
}
