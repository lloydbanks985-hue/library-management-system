# Library Catalog

NestJS API with a Prisma data layer on hosted PostgreSQL.

## Setup

```bash
cd api
npm install prisma@6 @prisma/client@6 --save   # Prisma 6 style: url lives in schema.prisma
cp .env.example .env                            # then set DATABASE_URL to your hosted Postgres
npx prisma migrate dev --name init              # create tables
npx prisma db seed                              # insert genres + books
```

Add this to `api/package.json` so `prisma db seed` knows how to run the script:

```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

For a hosted database in production/CI, use `npx prisma migrate deploy` instead of `migrate dev`.

## Schema Decisions

**Why Book references Genre instead of embedding it.** Each `Book` stores a `genreId`
foreign key pointing at a row in `Genre`, rather than copying the genre's data into the book.

- **One source of truth.** A genre is a shared entity. Renaming "Sci-Fi" to "Science Fiction"
  is a single-row update, not a rewrite of every book. Embedded copies would drift
  (`"Sci-Fi"`, `"SciFi"`, `"Science fiction"`).
- **Integrity enforced by the database.** The foreign key means a book cannot point at a genre
  that does not exist, and a genre with books cannot be deleted by accident.
- **Genre is queried on its own.** The app lists genres, filters books by genre, and counts books
  per genre. With a separate table these are simple indexed queries (`@@index([genreId])`).
- **Normalization.** Genre data is stored once and joined when needed, which keeps writes cheap
  and the data consistent. The cost is a join on reads, which Prisma handles with `include`.

**Other decisions**

- `Role` is an enum (`PATRON`, `LIBRARIAN`) with `PATRON` as the default, so new users get the
  least privilege and invalid roles are rejected at the database level.
- `@@unique([title, author])` on `Book` prevents duplicate catalog entries and makes the seed
  script safely re-runnable.
- `copiesAvailable` defaults to 1 so every book is borrowable on creation.
- **Stretch: `Review`** links `User` and `Book` (`bookId`, `userId`, `rating`, `comment`).
  `@@unique([bookId, userId])` limits a user to one review per book; reviews cascade-delete with
  their book or user.

## Prisma vs. a document database

Coming from a document database, the biggest difference was that relationships are declared up
front and enforced. In a document store I would have been tempted to embed the genre (or even
reviews) inside each book document and accept some duplication. In Prisma I had to decide the
shape of each relation in the schema, and in return I got foreign key integrity, generated
types, and migrations that make schema changes explicit rather than implicit.
