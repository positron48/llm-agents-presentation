import { useContext } from "react";
import { Fragment, jsxDEV as reactJsxDEV } from "react/jsx-dev-runtime";
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
    return reactJsxDEV(elementType, elementProps, undefined, Array.isArray(elementProps.children), undefined, undefined);
  }

  const localized = { ...elementProps };
  if ("children" in localized) localized.children = translateChildren(localized.children);
  for (const attribute of ["aria-label", "title", "alt", "placeholder"] as const) {
    const value = localized[attribute];
    if (typeof value === "string") localized[attribute] = translateUiText(value);
  }
  return reactJsxDEV(elementType, localized, undefined, Array.isArray(localized.children), undefined, undefined);
}

export const jsxDEV: typeof reactJsxDEV = (type, props, key, isStaticChildren, source, self) => {
  if (typeof type !== "string") return reactJsxDEV(type, props, key, isStaticChildren, source, self);
  return reactJsxDEV(LocalizedIntrinsic, {
    elementType: type,
    elementProps: (props ?? {}) as ElementProps,
  }, key, false, source, self);
};
export { Fragment };
