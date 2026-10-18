export const fail = (e: unknown, status = 400) =>
  Response.json(
    { error: e instanceof Error ? e.message : String(e) },
    { status }
  );
