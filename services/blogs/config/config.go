package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func ConnectDB() *sql.DB {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "blogs_db")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("Connected to database successfully")
	return db
}

func InitTables(db *sql.DB) {
	query := `
	CREATE TABLE IF NOT EXISTS blogs (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		description TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		author_id INT NOT NULL,
		status VARCHAR(20) DEFAULT 'published'
	);

	CREATE TABLE IF NOT EXISTS blog_images (
		id SERIAL PRIMARY KEY,
		blog_id INT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
		url TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS comments (
		id SERIAL PRIMARY KEY,
		blog_id INT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
		author_id INT NOT NULL,
		text TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS votes (
		id SERIAL PRIMARY KEY,
		blog_id INT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
		user_id INT NOT NULL,
		UNIQUE(blog_id, user_id)
	);
	`

	_, err := db.Exec(query)
	if err != nil {
		log.Fatal("Failed to initialize tables:", err)
	}

	log.Println("Database tables initialized successfully")
}
