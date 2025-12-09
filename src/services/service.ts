import { type Context } from "@/lib/context";

// 基础服务类，所有服务都继承自此类
export abstract class BaseService {
  constructor(protected readonly ctx: Context) {}
}

// 导出 Context 类型供其他服务使用
export type { Context } from "@/lib/context";
