/**
 * @file ListCore 简化版，用于 ts 测试
 */
import { RequestPayload, request } from "@/domains/request/utils";
import { Result } from "../result";

type FetchFunction = (...args: any[]) => RequestPayload<any>;
type ProcessFunction<V, P> = (value: V) => Result<P>;
class RequestCore<F extends FetchFunction, P = ReturnType<F>> {
  service: F;
  constructor(fn: F) {
    this.service = fn;
  }
}

interface FetchParams {
  page: number;
  pageSize: number;
}
export class ListCore<S extends RequestCore<(first: any, ...args: any[]) => RequestPayload<any>>> {
  constructor(fetch: S, options = {}) {}
  fetch(params: Parameters<S["service"]>[0], ...restArgs: any[]) {}
  search(params: Omit<Parameters<S["service"]>[0], "page" | "pageSize">) {}
}
function main() {
  function fetchMediaList(params: FetchParams & Partial<{ name: string; type: number }>) {
    return request.post("/");
  }
  const $list = new ListCore(new RequestCore(fetchMediaList));
  $list.search({ name: "" });
}
