import { useContext } from "react";
import { Fragment, jsx as reactJsx, jsxs as reactJsxs } from "react/jsx-runtime";
import { LanguageContext } from "./context";
import { translateUiText } from "./translate";

type ElementProps = Record<string, unknown>;

function translateChildren(value: unknown): unknown {
  if (typeof value === "string") return translateUiText(value);
  if (Array.isArray(value)) return value.map(translateChildren);
  return value;
}

function LocalizedIntrinsic({
  elementType,
  elementProps,
}: {
  elementType: string;
  elementProps: ElementProps;
}) {
  const language = useContext(LanguageContext);
  if (language !== "en") {
    return Array.isArray(elementProps.children)
      ? reactJsxs(elementType, elementProps)
      : reactJsx(elementType, elementProps);
  }

  const localized = { ...elementProps };
  if ("children" in localized) localized.children = translateChildren(localized.children);
  for (const attribute of ["aria-label", "title", "alt", "placeholder"] as const) {
    const value = localized[attribute];
    if (typeof value === "string") localized[attribute] = translateUiText(value);
  }
  return Array.isArray(localized.children)
    ? reactJsxs(elementType, localized)
    : reactJsx(elementType, localized);
}

function wrapIntrinsic(
  factory: typeof reactJsx,
  type: Parameters<typeof reactJsx>[0],
  props: Parameters<typeof reactJsx>[1],
  key?: Parameters<typeof reactJsx>[2],
) {
  if (typeof type !== "string") return factory(type, props, key);
  return factory(LocalizedIntrinsic, {
    elementType: type,
    elementProps: (props ?? {}) as ElementProps,
  }, key);
}

export const jsx: typeof reactJsx = (type, props, key) => wrapIntrinsic(reactJsx, type, props, key);
export const jsxs: typeof reactJsxs = (type, props, key) => wrapIntrinsic(reactJsxs, type, props, key);
export { Fragment };
