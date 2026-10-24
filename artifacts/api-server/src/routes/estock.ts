import { Router, type Request as ExpressRequest } from "express";
import { Readable } from "node:stream";
import * as session from "../estock-routes/estock/session/route";
import * as products from "../estock-routes/estock/products/route";
import * as product from "../estock-routes/estock/products/[id]/route";
import * as drafts from "../estock-routes/estock/drafts/route";
import * as draft from "../estock-routes/estock/drafts/[id]/route";
import * as approve from "../estock-routes/estock/drafts/[id]/approve/route";
import * as discard from "../estock-routes/estock/drafts/[id]/discard/route";
import * as recall from "../estock-routes/estock/drafts/[id]/recall/route";
import * as send from "../estock-routes/estock/drafts/[id]/send/route";
import * as receiving from "../estock-routes/estock/receiving/route";
import * as receipt from "../estock-routes/estock/receiving/[id]/route";
import * as confirm from "../estock-routes/estock/receiving/[id]/confirm/route";
import * as history from "../estock-routes/estock/history/route";
import * as receiptsHistory from "../estock-routes/estock/history/receipts/route";
import * as activity from "../estock-routes/estock/history/activity/route";
import * as movements from "../estock-routes/estock/movements/route";
import * as notifications from "../estock-routes/estock/notifications/route";
import * as readNotification from "../estock-routes/estock/notifications/[id]/read/route";
import * as legacy from "../estock-routes/session/route";

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Response | Promise<Response>;
const router = Router();

/** Bridge Express transport to platform-independent Fetch handlers. */
export function fetchRequest(req: ExpressRequest): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((part) => headers.append(name, part));
    else if (value !== undefined) headers.set(name, value);
  }
  return new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`, {
    method: req.method,
    headers,
    ...(!["GET", "HEAD"].includes(req.method)
      ? { body: Readable.toWeb(req) as ReadableStream, duplex: "half" }
      : {}),
  });
}

function mount(path: string, handlers: Record<string, unknown>) {
  for (const method of ["GET", "POST", "PATCH", "PUT", "DELETE"]) {
    const handler = handlers[method] as Handler | undefined;
    if (!handler) continue;
    router.route(path)[method.toLowerCase() as "get"](async (req, res, next) => {
      try {
        const response = await handler(fetchRequest(req), {
          params: Promise.resolve(req.params as Record<string, string>),
        });
        res.status(response.status);
        response.headers.forEach((value, name) => {
          if (name !== "set-cookie") res.setHeader(name, value);
        });
        const cookies = response.headers.getSetCookie();
        if (cookies.length) res.setHeader("set-cookie", cookies);
        if (response.body) Readable.fromWeb(response.body as never).on("error", next).pipe(res);
        else res.end();
      } catch (error) {
        next(error);
      }
    });
  }
}

mount("/estock/session", session);
mount("/estock/products", products);
mount("/estock/products/:id", product);
mount("/estock/drafts", drafts);
mount("/estock/drafts/:id", draft);
mount("/estock/drafts/:id/approve", approve);
mount("/estock/drafts/:id/discard", discard);
mount("/estock/drafts/:id/recall", recall);
mount("/estock/drafts/:id/send", send);
mount("/estock/receiving", receiving);
mount("/estock/receiving/:id", receipt);
mount("/estock/receiving/:id/confirm", confirm);
mount("/estock/history", history);
mount("/estock/history/receipts", receiptsHistory);
mount("/estock/history/activity", activity);
mount("/estock/movements", movements);
mount("/estock/notifications", notifications);
mount("/estock/notifications/:id/read", readNotification);

// The original app intentionally retired these endpoints with HTTP 410.
for (const path of [
  "/session", "/products", "/movements", "/demo", "/demo/controls",
  "/analysis-runs", "/analysis-runs/:id", "/analysis-runs/:id/poll",
]) mount(path, legacy);

export default router;
