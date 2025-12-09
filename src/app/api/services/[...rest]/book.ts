import { z, createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createContext } from "@/lib/context";
import { Services } from "@/services";
import { HttpResponse } from "@/lib/response";

const createBookSchema = z.object({
  title: z.string().min(1).openapi({
    description: "The title of the book",
    example: "The Great Gatsby",
  }),
  author: z.string().min(1).openapi({
    description: "The author of the book",
    example: "F. Scott Fitzgerald",
  }),
  isbn: z.string().optional().openapi({
    description: "The ISBN of the book",
    example: "978-0743273565",
  }),
  description: z.string().optional().openapi({
    description: "The description of the book",
    example:
      "A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
  }),
  publishedYear: z
    .number()
    .min(1800)
    .max(new Date().getFullYear())
    .optional()
    .openapi({
      description: "The year the book was published",
      example: 1925,
    }),
  genre: z.string().optional().openapi({
    description: "The genre of the book",
    example: "Fiction",
  }),
  pages: z.number().min(1).optional().openapi({
    description: "The number of pages in the book",
    example: 180,
  }),
});

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  isbn: z.string().optional(),
  description: z.string().optional(),
  publishedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
  genre: z.string().optional(),
  pages: z.number().min(1).optional(),
});

const createBookResponseSchema = z.object({
  id: z.number(),
  success: z.boolean(),
});

const updateBookResponseSchema = z.object({
  id: z.number(),
  success: z.boolean(),
});

const deleteBookResponseSchema = z.object({
  id: z.number(),
  success: z.boolean(),
});

const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  isbn: z.string().nullable(),
  description: z.string().nullable(),
  publishedYear: z.number().nullable(),
  genre: z.string().nullable(),
  pages: z.number().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
});

const listBooksResponseSchema = z.object({
  books: z.array(bookSchema),
  total: z.number(),
});

const getBookResponseSchema = z.object({
  book: bookSchema,
});

const searchBooksSchema = z.object({
  query: z.string().min(1).openapi({
    description: "Search query for book title",
    example: "gatsby",
  }),
});

const getBooksByGenreSchema = z.object({
  genre: z.string().min(1).openapi({
    description: "Genre to filter books by",
    example: "Fiction",
  }),
});

const getBooksByAuthorSchema = z.object({
  author: z.string().min(1).openapi({
    description: "Author to filter books by",
    example: "F. Scott Fitzgerald",
  }),
});

const getBookByIsbnSchema = z.object({
  isbn: z.string().min(1).openapi({
    description: "ISBN to find book by",
    example: "978-0743273565",
  }),
});

const createBook = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createBookSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: createBookResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid data",
    },
  },
});

const updateBook = createRoute({
  method: "put",
  path: "/{id}",
  request: {
    params: z.object({
      id: z.string().transform((val) => parseInt(val, 10)),
    }),
    body: {
      content: {
        "application/json": {
          schema: updateBookSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: updateBookResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid data",
    },
    404: {
      description: "Book not found",
    },
  },
});

const deleteBook = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: z.object({
      id: z.string().transform((val) => parseInt(val, 10)),
    }),
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: deleteBookResponseSchema,
        },
      },
    },
    404: {
      description: "Book not found",
    },
  },
});

const getBook = createRoute({
  method: "get",
  path: "/{id}",
  request: {
    params: z.object({
      id: z.string().transform((val) => parseInt(val, 10)),
    }),
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: getBookResponseSchema,
        },
      },
    },
    404: {
      description: "Book not found",
    },
  },
});

const listBooks = createRoute({
  method: "get",
  path: "/",
  request: {
    query: z.object({
      offset: z
        .string()
        .transform((val) => parseInt(val, 10))
        .optional()
        .default(0),
      limit: z
        .string()
        .transform((val) => parseInt(val, 10))
        .optional()
        .default(10),
    }),
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: listBooksResponseSchema,
        },
      },
    },
  },
});

const searchBooks = createRoute({
  method: "get",
  path: "/search",
  request: {
    query: searchBooksSchema,
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: listBooksResponseSchema,
        },
      },
    },
  },
});

const getBooksByGenre = createRoute({
  method: "get",
  path: "/genre/{genre}",
  request: {
    params: getBooksByGenreSchema,
    query: z.object({
      offset: z
        .string()
        .transform((val) => parseInt(val, 10))
        .optional()
        .default(0),
      limit: z
        .string()
        .transform((val) => parseInt(val, 10))
        .optional()
        .default(10),
    }),
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: listBooksResponseSchema,
        },
      },
    },
  },
});

const getBooksByAuthor = createRoute({
  method: "get",
  path: "/author/{author}",
  request: {
    params: getBooksByAuthorSchema,
    query: z.object({
      offset: z
        .string()
        .transform((val) => parseInt(val, 10))
        .optional()
        .default(0),
      limit: z
        .string()
        .transform((val) => parseInt(val, 10))
        .optional()
        .default(10),
    }),
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: listBooksResponseSchema,
        },
      },
    },
  },
});

const getBookByIsbn = createRoute({
  method: "get",
  path: "/isbn/{isbn}",
  request: {
    params: getBookByIsbnSchema,
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: getBookResponseSchema,
        },
      },
    },
    404: {
      description: "Book not found",
    },
  },
});

const bookApp = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return HttpResponse.error(c, {
        message: result.error.message,
        status: 400,
      });
    }
    return result;
  },
});

bookApp.openapi(createBook, async (c) => {
  const body = c.req.valid("json");

  const ctx = createContext(getCloudflareContext({ async: false }).env);
  const services = new Services(ctx);
  const book = await services.book.createBook({
    title: body.title,
    author: body.author,
    isbn: body.isbn,
    description: body.description,
    publishedYear: body.publishedYear,
    genre: body.genre,
    pages: body.pages,
  });
  return c.json({ id: book.id, success: true });
});

bookApp.openapi(updateBook, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const ctx = createContext(getCloudflareContext({ async: false }).env);
  const services = new Services(ctx);

  const result = await services.book.updateBook(id, body);
  if (!result) {
    return c.json({ error: "Book not found" }, 404);
  }
  return c.json({ id, success: true });
});

bookApp.openapi(deleteBook, async (c) => {
  const { id } = c.req.valid("param");
  const ctx = createContext(getCloudflareContext({ async: false }).env);
  const services = new Services(ctx);

  const result = await services.book.deleteBook(id);
  if (!result) {
    return c.json({ error: "Book not found" }, 404);
  }
  return c.json({ id, success: true });
});

bookApp.openapi(getBook, async (c) => {
  const { id } = c.req.valid("param");
  const ctx = createContext(getCloudflareContext({ async: false }).env);
  const services = new Services(ctx);

  const book = await services.book.getBookById(id);
  if (!book) {
    return c.json({ error: "Book not found" }, 404);
  }
  return c.json({ book });
});

bookApp.openapi(listBooks, async (c) => {
  const { offset, limit } = c.req.valid("query");
  const ctx = createContext(getCloudflareContext({ async: false }).env);
  const services = new Services(ctx);

  const books = await services.book.getBooks(limit, offset);
  const total = await services.book.getBooksCount();

  return c.json({
    books,
    total,
  });
});

bookApp.openapi(searchBooks, async (c) => {
  const { query } = c.req.valid("query");
  const ctx = createContext(getCloudflareContext({ async: false }).env);
  const services = new Services(ctx);

  const books = await services.book.searchBooks(query);
  return c.json({
    books,
    total: books.length,
  });
});

bookApp.openapi(getBooksByGenre, async (c) => {
  const { genre } = c.req.valid("param");
  const { offset, limit } = c.req.valid("query");
  const ctx = createContext(getCloudflareContext({ async: false }).env);
  const services = new Services(ctx);

  const books = await services.book.getBooksByGenre(genre, limit, offset);
  return c.json({
    books,
    total: books.length,
  });
});

bookApp.openapi(getBooksByAuthor, async (c) => {
  const { author } = c.req.valid("param");
  const { offset, limit } = c.req.valid("query");
  const ctx = createContext(getCloudflareContext({ async: false }).env);
  const services = new Services(ctx);

  const books = await services.book.getBooksByAuthor(author, limit, offset);
  return c.json({
    books,
    total: books.length,
  });
});

bookApp.openapi(getBookByIsbn, async (c) => {
  const { isbn } = c.req.valid("param");
  const ctx = createContext(getCloudflareContext({ async: false }).env);
  const services = new Services(ctx);

  const book = await services.book.getBookByIsbn(isbn);
  if (!book) {
    return c.json({ error: "Book not found" }, 404);
  }
  return c.json({ book });
});

export default bookApp;
