package repository

import (
	"database/sql"
)

type VoteRepository struct {
	DB *sql.DB
}

func NewVoteRepository(db *sql.DB) *VoteRepository {
	return &VoteRepository{DB: db}
}

// Toggle adds a vote if it doesn't exist, removes it if it does. Returns the new vote count.
func (r *VoteRepository) Toggle(blogID, userID int) (int, error) {
	var existingID int
	err := r.DB.QueryRow(`SELECT id FROM votes WHERE blog_id = $1 AND user_id = $2`, blogID, userID).Scan(&existingID)

	if err == sql.ErrNoRows {
		_, err = r.DB.Exec(`INSERT INTO votes (blog_id, user_id) VALUES ($1, $2)`, blogID, userID)
		if err != nil {
			return 0, err
		}
	} else if err != nil {
		return 0, err
	} else {
		_, err = r.DB.Exec(`DELETE FROM votes WHERE id = $1`, existingID)
		if err != nil {
			return 0, err
		}
	}

	return r.GetCount(blogID)
}

func (r *VoteRepository) GetCount(blogID int) (int, error) {
	var count int
	err := r.DB.QueryRow(`SELECT COUNT(*) FROM votes WHERE blog_id = $1`, blogID).Scan(&count)
	return count, err
}
