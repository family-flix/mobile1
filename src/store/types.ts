// import { JSX } from "solid-js/jsx-runtime";
import { NamedExoticComponent } from "react";

import { Application } from "@/domains/app";
import { HistoryCore } from "@/domains/history";
import { RouteViewCore } from "@/domains/route_view";
import { ScrollViewCore } from "@/domains/ui";
import { HttpClientCore } from "@/domains/http_client";
import { BottomMenuCore } from "@/domains/bottom_menu";

import { PageKeys, RouteConfig } from "./routes";
import { storage } from "./storage";
import { StorageCore } from "@/domains/storage";

export type GlobalStorageValues = (typeof storage)["values"];
export type ViewComponentProps = {
  app: Application;
  history: HistoryCore<PageKeys, RouteConfig>;
  client: HttpClientCore;
  view: RouteViewCore;
  storage: StorageCore<GlobalStorageValues>;
  pages: Omit<Record<PageKeys, ViewComponent | ViewComponentWithMenu>, "root">;
  parent?: {
    view: RouteViewCore;
    scrollView?: ScrollViewCore;
  };
};
export type ViewComponent = NamedExoticComponent<ViewComponentProps>;
export type ViewComponentWithMenu = NamedExoticComponent<
  ViewComponentProps & {
    menu?: BottomMenuCore;
  }
>;
