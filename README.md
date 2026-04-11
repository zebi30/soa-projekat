# SOA Projekat

Mikroservisna arhitektura za SOA predmet.

## Servisi

| Servis        | Jezik      | Port | Baza               |
|---------------|------------|------|---------------------|
| Authorization | Node.js    | 3001 | PostgreSQL (5433)   |
| Blog          | Go         | 8082 | PostgreSQL (5434)   |

## Pokretanje

### Preduslov
- [Docker](https://www.docker.com/) i Docker Compose

### Pokretanje svih servisa

```bash
docker-compose up --build
```

Ovo podiže sve servise i njihove PostgreSQL baze. Tabele se automatski kreiraju pri pokretanju.

### Zaustavljanje

```bash
docker-compose down
```

Za brisanje podataka iz baze:

```bash
docker-compose down -v
```

## Blog servis API (port 8082)

### Blogovi

| Metod  | URL                | Opis             |
|--------|--------------------|------------------|
| GET    | /api/blogs         | Svi blogovi      |
| GET    | /api/blogs/:id     | Jedan blog       |
| POST   | /api/blogs         | Kreiraj blog     |
| PUT    | /api/blogs/:id     | Izmeni blog      |
| DELETE | /api/blogs/:id     | Obriši blog      |

Body za POST/PUT:
```json
{
  "title": "Moj prvi blog",
  "description": "## Naslov\nTekst u **markdown** formatu",
  "authorId": 1,
  "images": ["https://example.com/slika.jpg"],
  "status": "published"
}
```

### Komentari

| Metod  | URL                                | Opis              |
|--------|------------------------------------|--------------------|
| GET    | /api/blogs/:id/comments            | Komentari za blog  |
| POST   | /api/blogs/:id/comments            | Dodaj komentar     |
| PUT    | /api/blogs/:id/comments/:commentId | Izmeni komentar    |
| DELETE | /api/blogs/:id/comments/:commentId | Obriši komentar    |

Body za POST/PUT:
```json
{
  "authorId": 2,
  "text": "Odličan blog!"
}
```

### Lajkovi

| Metod | URL                  | Opis                          |
|-------|----------------------|-------------------------------|
| POST  | /api/blogs/:id/votes | Lajkuj/unlajkuj (toggle)      |
| GET   | /api/blogs/:id/votes | Broj lajkova                  |

Body za POST:
```json
{
  "userId": 1
}
```

## Docker arhitektura

Svi servisi su na zajedničkoj Docker Compose mreži. Svaki servis ima svoju PostgreSQL instancu.

```
auth-postgres    (5433) ← authorization-service (3001)
blogs-postgres   (5434) ← blogs-service         (8082)
```
