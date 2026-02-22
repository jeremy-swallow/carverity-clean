type StructuredData = Record<string, any>;

type SeoOptions = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  structuredData?: StructuredData | StructuredData[];
};

function ensureMetaTag(
  selector: string,
  attributes: Record<string, string>
) {
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => {
      tag!.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  } else {
    Object.entries(attributes).forEach(([key, value]) => {
      tag!.setAttribute(key, value);
    });
  }
}

function ensureLinkTag(
  selector: string,
  attributes: Record<string, string>
) {
  let tag = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!tag) {
    tag = document.createElement("link");
    Object.entries(attributes).forEach(([key, value]) => {
      tag!.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  } else {
    Object.entries(attributes).forEach(([key, value]) => {
      tag!.setAttribute(key, value);
    });
  }
}

function clearStructuredData() {
  const existing = document.head.querySelectorAll(
    'script[data-dynamic-seo="true"]'
  );
  existing.forEach((node) => node.remove());
}

function injectStructuredData(data: StructuredData | StructuredData[]) {
  const list = Array.isArray(data) ? data : [data];

  list.forEach((item) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-dynamic-seo", "true");
    script.text = JSON.stringify(item);
    document.head.appendChild(script);
  });
}

export function applySeo(options: SeoOptions) {
  const {
    title,
    description,
    canonical,
    ogImage = "https://www.carverity.com.au/og-image.png?v=1",
    structuredData,
  } = options;

  // Title
  document.title = title;

  // Description
  ensureMetaTag('meta[name="description"]', {
    name: "description",
    content: description,
  });

  // Canonical
  if (canonical) {
    ensureLinkTag('link[rel="canonical"]', {
      rel: "canonical",
      href: canonical,
    });
  }

  // Open Graph
  ensureMetaTag('meta[property="og:title"]', {
    property: "og:title",
    content: title,
  });

  ensureMetaTag('meta[property="og:description"]', {
    property: "og:description",
    content: description,
  });

  ensureMetaTag('meta[property="og:url"]', {
    property: "og:url",
    content: canonical || window.location.href,
  });

  ensureMetaTag('meta[property="og:image"]', {
    property: "og:image",
    content: ogImage,
  });

  // Twitter
  ensureMetaTag('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: title,
  });

  ensureMetaTag('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: description,
  });

  ensureMetaTag('meta[name="twitter:image"]', {
    name: "twitter:image",
    content: ogImage,
  });

  // Structured Data
  clearStructuredData();
  if (structuredData) {
    injectStructuredData(structuredData);
  }
}
