import dayjs from "dayjs";

import { request } from "@/utils/request";
import { ReportTypes } from "@/constants";

export function reportSomething(body: { type: ReportTypes; data: string }) {
  return request.post("/api/report/add", body);
}
