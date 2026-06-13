package main

import (
	"blog-service/config"
	"blog-service/handlers"
	"blog-service/repository"
	"blog-service/router"
	"blog-service/tracing"
	"context"
	"log"
	"net/http"

	"github.com/rs/cors"
)

func main() {
	shutdownTracing, err := tracing.Init(context.Background())
	if err != nil {
		log.Printf("tracing disabled: %v", err)
	} else {
		defer func() {
			if err := shutdownTracing(context.Background()); err != nil {
				log.Printf("tracing shutdown error: %v", err)
			}
		}()
	}

	db := config.ConnectDB()
	defer db.Close()

	config.InitTables(db)

	blogRepo := repository.NewBlogRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	voteRepo := repository.NewVoteRepository(db)

	blogHandler := handlers.NewBlogHandler(blogRepo)
	commentHandler := handlers.NewCommentHandler(commentRepo, blogRepo)
	voteHandler := handlers.NewVoteHandler(voteRepo)

	r := router.NewRouter(blogHandler, commentHandler, voteHandler)

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	log.Println("Blog service starting on port 8082...")
	log.Fatal(http.ListenAndServe(":8082", handler))
}
