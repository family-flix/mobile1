import { Application } from "@/domains/app";
import Helper from "@list-helper/core/core";

import { user } from "./user";
import { router } from "./router";
import { Result } from "@/types";

Helper.defaultProcessor = (originalResponse) => {
  if (originalResponse.error) {
    return {
      dataSource: [],
      page: 1,
      pageSize: 20,
      total: 0,
      noMore: false,
      error: new Error(`${originalResponse.error.message}`),
    };
  }
  try {
    const data = originalResponse.data || originalResponse;
    const { list, page, page_size, total, no_more } = data;
    const result = {
      dataSource: list,
      page,
      pageSize: page_size,
      total,
      noMore: false,
    };
    if (total <= page_size * page) {
      result.noMore = true;
    }
    if (no_more !== undefined) {
      result.noMore = no_more;
    }
    return result;
  } catch (error) {
    return {
      dataSource: [],
      page: 1,
      pageSize: 20,
      total: 0,
      noMore: false,
      error: new Error(`${(error as Error).message}`),
    };
  }
};

export const app = new Application({
  user,
  router,
  async beforeReady() {
    Helper.onError = (error: Error) => {
      app.emitWarning(error);
    };
    const { token } = router.query;
    const r = await user.loginInMember(token);
    if (r.error) {
      app.emitError(r.error);
      return Result.Err(r.error);
    }
    return Result.Ok(null);
  },
});
