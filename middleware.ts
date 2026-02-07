import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(zh-TW|en|ja|ko)/:path*",
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
