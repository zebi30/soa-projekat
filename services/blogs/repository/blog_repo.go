package repository

import (
	"blog-service/models"
	"database/sql"
)

type BlogRepository struct {
	DB *sql.DB
}

func NewBlogRepository(db *sql.DB) *BlogRepository {
	return &BlogRepository{DB: db}
}

func (r *BlogRepository) GetAll() ([]models.Blog, error) {
	rows, err := r.DB.Query(`
		SELECT b.id, b.title, b.description, b.created_at, b.author_id, b.status,
		       COALESCE((SELECT COUNT(*) FROM votes WHERE blog_id = b.id), 0) as vote_count
		FROM blogs b
		ORDER BY b.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blogs []models.Blog
	for rows.Next() {
		var b models.Blog
		err := rows.Scan(&b.ID, &b.Title, &b.Description, &b.CreatedAt, &b.AuthorID, &b.Status, &b.VoteCount)
		if err != nil {
			return nil, err
		}

		images, err := r.getImagesByBlogID(b.ID)
		if err != nil {
			return nil, err
		}
		b.Images = images

		blogs = append(blogs, b)
	}

	return blogs, nil
}

func (r *BlogRepository) GetByID(id int) (*models.Blog, error) {
	var b models.Blog
	err := r.DB.QueryRow(`
		SELECT b.id, b.title, b.description, b.created_at, b.author_id, b.status,
		       COALESCE((SELECT COUNT(*) FROM votes WHERE blog_id = b.id), 0) as vote_count
		FROM blogs b WHERE b.id = $1
	`, id).Scan(&b.ID, &b.Title, &b.Description, &b.CreatedAt, &b.AuthorID, &b.Status, &b.VoteCount)
	if err != nil {
		return nil, err
	}

	images, err := r.getImagesByBlogID(b.ID)
	if err != nil {
		return nil, err
	}
	b.Images = images

	return &b, nil
}

func (r *BlogRepository) Create(b *models.Blog) error {
	err := r.DB.QueryRow(`
		INSERT INTO blogs (title, description, author_id, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`, b.Title, b.Description, b.AuthorID, b.Status).Scan(&b.ID, &b.CreatedAt)
	if err != nil {
		return err
	}

	for _, url := range b.Images {
		_, err := r.DB.Exec(`INSERT INTO blog_images (blog_id, url) VALUES ($1, $2)`, b.ID, url)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *BlogRepository) Update(b *models.Blog) error {
	_, err := r.DB.Exec(`
		UPDATE blogs SET title = $1, description = $2, status = $3 WHERE id = $4
	`, b.Title, b.Description, b.Status, b.ID)
	if err != nil {
		return err
	}

	// Replace images: delete old, insert new
	_, err = r.DB.Exec(`DELETE FROM blog_images WHERE blog_id = $1`, b.ID)
	if err != nil {
		return err
	}

	for _, url := range b.Images {
		_, err := r.DB.Exec(`INSERT INTO blog_images (blog_id, url) VALUES ($1, $2)`, b.ID, url)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *BlogRepository) Delete(id int) error {
	_, err := r.DB.Exec(`DELETE FROM blogs WHERE id = $1`, id)
	return err
}

func (r *BlogRepository) getImagesByBlogID(blogID int) ([]string, error) {
	rows, err := r.DB.Query(`SELECT url FROM blog_images WHERE blog_id = $1`, blogID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []string
	for rows.Next() {
		var url string
		if err := rows.Scan(&url); err != nil {
			return nil, err
		}
		images = append(images, url)
	}

	return images, nil
}
