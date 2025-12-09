// 导出基础服务类
import { type Context } from "@/lib/context";

// 导出所有服务类
import { BookService } from "./book";

export class Services {
  constructor(private readonly ctx: Context) {}
  get book() {
    return new BookService(this.ctx);
  }
}
