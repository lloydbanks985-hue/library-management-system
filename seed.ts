import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const catalog: Record<string, { title: string; author: string; year: number }[]> = {
  'Science Fiction': [
    { title: 'Dune', author: 'Frank Herbert', year: 1965 },
    { title: 'Neuromancer', author: 'William Gibson', year: 1984 },
    { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', year: 1969 },
    { title: 'Foundation', author: 'Isaac Asimov', year: 1951 },
  ],
  Fantasy: [
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937 },
    { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', year: 1968 },
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', year: 2007 },
  ],
  Mystery: [
    { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', year: 1902 },
    { title: 'And Then There Were None', author: 'Agatha Christie', year: 1939 },
    { title: 'The Big Sleep', author: 'Raymond Chandler', year: 1939 },
    { title: 'Gone Girl', author: 'Gillian Flynn', year: 2012 },
  ],
  'Non-Fiction': [
    { title: 'Sapiens', author: 'Yuval Noah Harari', year: 2011 },
    { title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', year: 2010 },
    { title: 'Silent Spring', author: 'Rachel Carson', year: 1962 },
    { title: 'Educated', author: 'Tara Westover', year: 2018 },
  ],
  Classics: [
    { title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813 },
    { title: 'Things Fall Apart', author: 'Chinua Achebe', year: 1958 },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', year: 1960 },
  ],
};

async function main() {
  // Genres first, so books can reference their ids
  const genreIds: Record<string, number> = {};
  for (const name of Object.keys(catalog)) {
    const genre = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    genreIds[name] = genre.id;
  }

  const books = Object.entries(catalog).flatMap(([genreName, items]) =>
    items.map((b) => ({
      title: b.title,
      author: b.author,
      publishedYear: b.year,
      copiesAvailable: 3,
      genreId: genreIds[genreName],
    })),
  );

  // skipDuplicates + @@unique([title, author]) makes re-running the seed safe
  const result = await prisma.book.createMany({ data: books, skipDuplicates: true });

  await prisma.user.upsert({
    where: { email: 'librarian@example.com' },
    update: {},
    create: { email: 'librarian@example.com', name: 'Lena Librarian', role: 'LIBRARIAN' },
  });
  await prisma.user.upsert({
    where: { email: 'patron@example.com' },
    update: {},
    create: { email: 'patron@example.com', name: 'Pat Patron', role: 'PATRON' },
  });

  console.log(`Seeded ${Object.keys(genreIds).length} genres and ${result.count} books.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
