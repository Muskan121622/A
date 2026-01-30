export interface SchemeEligibility {
    maxLandHolding?: number; // in acres
    farmerType: string[]; // e.g., ["Small", "Marginal", "Large", "All"]
    gender?: string[]; // ["Male", "Female", "All"]
    caste?: string[]; // ["SC", "ST", "OBC", "General", "All"]
}

export interface Scheme {
    id: string;
    name: string;
    type: string; // e.g., "Income Support", "Insurance", "Subsidy"
    state: string; // "All" or specific state name like "Bihar"
    central: boolean; // true if central govt scheme
    eligibility: SchemeEligibility;
    benefits: string;
    applyLink: string;
    description: string;
    docsRequired?: string[];

    // Hindi/Regional Content
    nameHi?: string;
    benefitsHi?: string;
    descriptionHi?: string;
    docsRequiredHi?: string[];
}

export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    source: {
        name: string;
    };
    publishedAt: string;
}

export interface Video {
    id: string; // YouTube Video ID
    title: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
}

export interface FarmerProfile {
    name?: string;
    state: string; // e.g., "Bihar"
    district?: string;
    landSize: number; // in acres
    farmerType: "Small" | "Marginal" | "Large" | "Landless"; // derived or selected
    gender?: "Male" | "Female" | "Other";
    caste?: "SC" | "ST" | "OBC" | "General";
    crops?: string[];
}
