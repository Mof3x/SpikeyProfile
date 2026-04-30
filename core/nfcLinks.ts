import * as Linking from "expo-linking";

export interface QuickLogDeepLinkPayload {
  actionId: string;
}

export function createQuickLogDeepLink(actionId: string) {
  return Linking.createURL("quick-log", {
    queryParams: { actionId },
  });
}

export function parseQuickLogDeepLink(
  url: string,
): QuickLogDeepLinkPayload | null {
  const parsed = Linking.parse(url);
  const normalizedPath = (parsed.path ?? "")
    .replace(/^\/+/, "")
    .replace(/^--\//, "");

  if (normalizedPath !== "quick-log") {
    return null;
  }

  const rawActionId = parsed.queryParams?.actionId;
  const actionId = Array.isArray(rawActionId) ? rawActionId[0] : rawActionId;

  if (typeof actionId !== "string" || actionId.trim().length === 0) {
    return null;
  }

  return { actionId };
}
