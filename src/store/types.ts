// import { JSX } from "solid-js/jsx-runtime";
import { NamedExoticComponent } from "react";

import { Application } from "@/domains/app/index";
import { HistoryCore } from "@/domains/history/index";
import { RouteViewCore } from "@/domains/route_view/index";
import { RouteConfig } from "@/domains/route_view/utils";
import { ScrollViewCore } from "@/domains/ui/index";
import { HttpClientCore } from "@/domains/http_client/index";
import { BottomMenuCore } from "@/domains/bottom_menu/index";
import { StorageCore } from "@/domains/storage/index";

import { PageKeys } from "./routes";
import { storage } from "./storage";

export type GlobalStorageValues = (typeof storage)["values"];
export type ViewComponentProps = {
  app: Application<{ storage: typeof storage }>;
  history: HistoryCore<PageKeys, RouteConfig<PageKeys>>;
  client: HttpClientCore;
  view: RouteViewCore;
  storage: StorageCore<GlobalStorageValues>;
  pages: Omit<Record<PageKeys, ViewComponent | ViewComponentWithMenu>, "root">;
  parent?: {
    view: RouteViewCore;
    scrollView?: ScrollViewCore;
  };
};
export type ViewComponentPropsWithMenu = ViewComponentProps & {
  menu?: BottomMenuCore;
};
export type ViewComponent = NamedExoticComponent<ViewComponentProps>;
export type ViewComponentWithMenu = NamedExoticComponent<ViewComponentPropsWithMenu>;

export type BaseApiResp<T> = {
  code: number;
  msg: string;
  data: T;
};

export type ListResponse<T> = {
  total: number;
  page: number;
  page_size: number;
  no_more: boolean;
  list: T[];
};
export type ListResponseWithCursor<T> = {
  page_size: number;
  total: number;
  next_marker?: string;
  list: T[];
};
