/**
 * Serializes structured data for a <script type="application/ld+json"> tag.
 *
 * JSON.stringify alone is not safe inside an HTML script element: a string
 * containing "</script>" would end the tag early and let the rest of the
 * string run as markup. Escaping "<", ">", "&" and the two JS line-separator
 * characters keeps the payload valid JSON (browsers/crawlers decode the
 * escapes) while making it impossible to break out of the element. Today's
 * data is static, so this is defense in depth for the day it isn't.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
