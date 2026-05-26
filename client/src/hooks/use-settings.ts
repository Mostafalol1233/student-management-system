import { useQuery } from "@tanstack/react-query";

export function useSettings() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const get = (key: string, fallback = "") => settings[key] ?? fallback;
  return { settings, get };
}
