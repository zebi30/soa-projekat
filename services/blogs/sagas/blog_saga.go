package sagas

import (
    "blog-service/client"
    "blog-service/models"
    "blog-service/repository"
)

// CreateBlogSaga validates author via auth service then creates the blog.
func CreateBlogSaga(repo *repository.BlogRepository, blog *models.Blog) error {
    // validate author exists
    if _, err := client.GetUserByID(blog.AuthorID); err != nil {
        return err
    }

    // create blog in repository
    if err := repo.Create(blog); err != nil {
        return err
    }

    return nil
}

// UpdateBlogSaga validates author then updates the blog.
func UpdateBlogSaga(repo *repository.BlogRepository, blog *models.Blog) error {
    if _, err := client.GetUserByID(blog.AuthorID); err != nil {
        return err
    }

    if err := repo.Update(blog); err != nil {
        return err
    }

    return nil
}

// DeleteBlogSaga deletes the blog (no external steps needed currently)
func DeleteBlogSaga(repo *repository.BlogRepository, id int) error {
    if err := repo.Delete(id); err != nil {
        return err
    }
    return nil
}
