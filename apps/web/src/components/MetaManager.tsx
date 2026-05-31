import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "../services/api";

function setMeta(selector: string, attribute: "content" | "href", value: string) {
  const element = document.head.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, value);
  }
}

export function MetaManager() {
  const { data } = useQuery({
    queryKey: ["meta"],
    queryFn: api.meta,
    retry: false,
    throwOnError: false,
    meta: { silent: true }
  });

  useEffect(() => {
    if (!data) return;
    document.title = data.title;
    setMeta('meta[name="description"]', "content", data.description);
    setMeta('meta[property="og:title"]', "content", data.title);
    setMeta('meta[property="og:description"]', "content", data.description);
    setMeta('meta[property="og:image"]', "content", data.logoUrl);
    setMeta('meta[name="theme-color"]', "content", data.themeColor);
    setMeta('link[rel="icon"]', "href", data.iconUrl);
  }, [data]);

  return null;
}
