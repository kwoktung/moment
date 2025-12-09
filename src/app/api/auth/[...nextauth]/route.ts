import { getNextAuth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";

export const GET = (request: NextRequest) => {
  const context = getCloudflareContext({ async: false });
  const resp = getNextAuth(context.env);
  return resp.handlers.GET(request);
};

export const POST = async (request: NextRequest) => {
  const context = getCloudflareContext({ async: false });
  const resp = getNextAuth(context.env);
  return resp.handlers.POST(request);
};
