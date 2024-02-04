import { HttpClientCore } from "@/domains/http_client";

import { user } from "./user";

export const request = new HttpClientCore({
  hostname: window.location.hostname,
  user,
});
