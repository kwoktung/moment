import { bookTable } from "@/database/schema";
import { BaseService } from "./service";
import { eq, like, and, isNull, desc } from "drizzle-orm";
import type { Context } from "./service";
import { sql } from "drizzle-orm";

// 定义Book类型
export type Book = typeof bookTable.$inferSelect;
export type NewBook = typeof bookTable.$inferInsert;

export class BookService extends BaseService {
  constructor(ctx: Context) {
    super(ctx);
  }

  /**
   * 获取所有书籍
   */
  async getBooks(limit?: number, offset?: number) {
    const query = this.ctx.db.query.bookTable.findMany({
      where: isNull(bookTable.deletedAt),
      orderBy: [desc(bookTable.createdAt)],
      limit,
      offset,
    });
    return query;
  }

  /**
   * 根据ID获取书籍
   */
  async getBookById(id: number) {
    return this.ctx.db.query.bookTable.findFirst({
      where: and(eq(bookTable.id, id), isNull(bookTable.deletedAt)),
    });
  }

  /**
   * 创建新书籍
   */
  async createBook(
    bookData: Omit<NewBook, "id" | "createdAt" | "updatedAt" | "deletedAt">,
  ) {
    const now = new Date();
    const newBook = {
      ...bookData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.ctx.db
      .insert(bookTable)
      .values(newBook)
      .returning();

    // Get the inserted book ID and return the new book
    const bookId = result[0].id as number;
    return {
      id: bookId,
      ...newBook,
    };
  }

  /**
   * 更新书籍信息
   */
  async updateBook(
    id: number,
    bookData: Partial<Omit<NewBook, "id" | "createdAt" | "deletedAt">>,
  ) {
    const now = new Date();
    const updateData = {
      ...bookData,
      updatedAt: now,
    };

    const result = await this.ctx.db
      .update(bookTable)
      .set(updateData)
      .where(and(eq(bookTable.id, id), isNull(bookTable.deletedAt)));

    return result;
  }

  /**
   * 删除书籍（软删除）
   */
  async deleteBook(id: number) {
    const now = new Date();
    const result = await this.ctx.db
      .update(bookTable)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(and(eq(bookTable.id, id), isNull(bookTable.deletedAt)));

    return result;
  }

  /**
   * 硬删除书籍（从数据库中完全移除）
   */
  async hardDeleteBook(id: number) {
    const result = await this.ctx.db
      .delete(bookTable)
      .where(eq(bookTable.id, id));

    return result;
  }

  /**
   * 搜索书籍
   */
  async searchBooks(query: string, limit?: number, offset?: number) {
    const searchQuery = `%${query}%`;

    return this.ctx.db.query.bookTable.findMany({
      where: and(
        isNull(bookTable.deletedAt),
        like(bookTable.title, searchQuery),
      ),
      orderBy: [desc(bookTable.createdAt)],
      limit,
      offset,
    });
  }

  /**
   * 根据类型获取书籍
   */
  async getBooksByGenre(genre: string, limit?: number, offset?: number) {
    return this.ctx.db.query.bookTable.findMany({
      where: and(eq(bookTable.genre, genre), isNull(bookTable.deletedAt)),
      orderBy: [desc(bookTable.createdAt)],
      limit,
      offset,
    });
  }

  /**
   * 根据作者获取书籍
   */
  async getBooksByAuthor(author: string, limit?: number, offset?: number) {
    return this.ctx.db.query.bookTable.findMany({
      where: and(eq(bookTable.author, author), isNull(bookTable.deletedAt)),
      orderBy: [desc(bookTable.createdAt)],
      limit,
      offset,
    });
  }

  /**
   * 根据ISBN获取书籍
   */
  async getBookByIsbn(isbn: string) {
    return this.ctx.db.query.bookTable.findFirst({
      where: and(eq(bookTable.isbn, isbn), isNull(bookTable.deletedAt)),
    });
  }

  /**
   * 获取书籍总数
   */
  async getBooksCount() {
    const result = await this.ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(bookTable)
      .where(isNull(bookTable.deletedAt));

    return result[0]?.count || 0;
  }

  /**
   * 检查书籍是否存在
   */
  async bookExists(id: number) {
    const book = await this.getBookById(id);
    return !!book;
  }

  /**
   * 批量创建书籍
   */
  async createBooks(
    booksData: Omit<NewBook, "id" | "createdAt" | "updatedAt" | "deletedAt">[],
  ) {
    const now = new Date();
    const books = booksData.map((book) => ({
      ...book,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await this.ctx.db.insert(bookTable).values(books);
    return result;
  }

  /**
   * 恢复已删除的书籍
   */
  async restoreBook(id: number) {
    const now = new Date();
    const result = await this.ctx.db
      .update(bookTable)
      .set({
        deletedAt: null,
        updatedAt: now,
      })
      .where(eq(bookTable.id, id));

    return result;
  }

  /**
   * 获取已删除的书籍
   */
  async getDeletedBooks(limit?: number, offset?: number) {
    return this.ctx.db.query.bookTable.findMany({
      where: isNull(bookTable.deletedAt),
      orderBy: [desc(bookTable.deletedAt)],
      limit,
      offset,
    });
  }
}
