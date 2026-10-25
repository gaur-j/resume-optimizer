// types/role.ts
export interface RoleFaq {
  q: string;
  a: string;
}

export interface Role {
  slug: string;
  title: string;
  pluralTitle?: string;
  industry: string;
  category?: string;
  topSkills: string[];
  softSkills?: string[];
  tools?: string[];
  certifications?: string[];
  actionVerbs: string[];
  atsTips?: string[];
  commonMistakes?: string[];
  sampleBullets?: string[];
  faqs?: RoleFaq[];
  relatedSlugs?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}
