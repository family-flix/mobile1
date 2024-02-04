import { UserCore } from "@/domains/user";

import { cache } from "./storage";

export const user = new UserCore(cache.get("user"));
