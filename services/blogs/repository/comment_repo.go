package repository

import (
	"blog-service/models"
	"database/sql"
)

type CommentRepository struct {
	DB *sql.DB
}

func NewCommentRepository(db *sql.DB) *CommentRepository {
	return &CommentRepository{DB: db}
}

func (r *CommentRepository) GetByBlogID(blogID int) ([]models.Comment, error) {
	rows, err := r.DB.Query(`
		SELECT id, blog_id, author_id, text, created_at, updated_at
		FROM comments WHERE blog_id = $1
		ORDER BY created_at ASC
	`, blogID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var c models.Comment
		err := rows.Scan(&c.ID, &c.BlogID, &c.AuthorID, &c.Text, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}

	return comments, nil
}

func (r *CommentRepository) Create(c *models.Comment) error {
	return r.DB.QueryRow(`
		INSERT INTO comments (blog_id, author_id, text)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`, c.BlogID, c.AuthorID, c.Text).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

func (r *CommentRepository) Update(c *models.Comment) error {
	_, err := r.DB.Exec(`
		UPDATE comments SET text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, c.Text, c.ID)
	return err
}

func (r *CommentRepository) Delete(id int) error {
	_, err := r.DB.Exec(`DELETE FROM comments WHERE id = $1`, id)
	return err
}
