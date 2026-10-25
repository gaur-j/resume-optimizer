// types/industry.ts
export interface KeywordCategory {
  categoryName: string;
  keywords: string[];
}

export interface IndustryFaq {
  q: string;
  a: string;
}

export interface Industry {
  slug: string;
  name: string;
  description: string;
  categories: KeywordCategory[];
  tips?: string[];
  faqs?: IndustryFaq[];
  relatedIndustrySlugs?: string[];
  relatedRoleSlugs?: string[]; // slugs from ats-roles.json
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}
