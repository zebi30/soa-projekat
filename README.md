# SOA Projekat

Mikroservisna arhitektura za SOA predmet.

## Servisi

| Servis | Jezik | Port | Baza |
|--------|-------|------|------|
| Blog   | Go    | 8082 | PostgreSQL (5432) |

## Pokretanje

### Preduslov
- [Docker](https://www.docker.com/) i Docker Compose

### Pokretanje svih servisa

```bash
docker-compose up --build
```

Ovo podiže Blog servis i njegovu PostgreSQL bazu. Tabele se automatski kreiraju pri pokretanju.

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

```bash
# Kreiraj blog
curl -X POST http://localhost:8082/api/blogs \
  -H "Content-Type: application/json" \
  -d '{"title": "Moj prvi blog", "description": "## Naslov\nTekst u **markdown** formatu", "authorId": 1}'

# Svi blogovi
curl http://localhost:8082/api/blogs

# Pojedinačan blog
curl http://localhost:8082/api/blogs/1

# Izmeni blog
curl -X PUT http://localhost:8082/api/blogs/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Novi naslov", "description": "Novi opis", "status": "published"}'

# Obriši blog
curl -X DELETE http://localhost:8082/api/blogs/1
```

### Komentari

```bash
# Dodaj komentar
curl -X POST http://localhost:8082/api/blogs/1/comments \
  -H "Content-Type: application/json" \
  -d '{"authorId": 2, "text": "Odličan blog!"}'

# Svi komentari za blog
curl http://localhost:8082/api/blogs/1/comments

# Izmeni komentar
curl -X PUT http://localhost:8082/api/blogs/1/comments/1 \
  -H "Content-Type: application/json" \
  -d '{"text": "Izmenjen komentar"}'

# Obriši komentar
curl -X DELETE http://localhost:8082/api/blogs/1/comments/1
```

### Lajkovi (glasovi)

```bash
# Lajkuj/unlajkuj blog (toggle)
curl -X POST http://localhost:8082/api/blogs/1/votes \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'

# Broj lajkova
curl http://localhost:8082/api/blogs/1/votes
```

## Struktura Blog servisa

```
services/blogs/
├── main.go              # Entry point
├── config/config.go     # DB konekcija i inicijalizacija tabela
├── models/              # Blog, Comment, Vote strukture
├── handlers/            # HTTP handleri
├── repository/          # SQL operacije
└── router/router.go     # Definicija ruta
```

## Docker arhitektura

Svi servisi komuniciraju preko zajedničke `soa-network` mreže. Svaki servis ima svoju bazu podataka.
