import axios from "axios";
import { NewsArticle } from "../types/advisory";

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const BASE_URL = "https://newsapi.org/v2/everything";

export const fetchFarmingNews = async (language: "Hindi" | "English" = "English", page: number = 1): Promise<NewsArticle[]> => {
    if (!NEWS_API_KEY) {
        console.error("News API Key is missing!");
        return [];
    }

    // STRENGTHENED Strict queries to filter out noise
    // We require "agriculture" or "farming" in title/description via NewsAPI if possible, or filter post-fetch.
    const englishQuery = '(agriculture OR farming OR horticulture OR "kisan scheme" OR "crop yield" OR "MSP price") AND India AND (government OR technology OR weather OR subsidy OR "crop insurance") -"politics" -"election" -"cricket" -"advertising" -"movie" -"bollywood" -"nasa" -"space" -"opinion" -"editorial" -"stock market"';

    // Hindi keywords
    const hindiQuery = '(कृषि OR किसान OR खेती OR "फसल बीमा" OR "एमएसपी") -"politics" -"election" -"cricket" -"bollywood"';

    try {
        const response = await axios.get(BASE_URL, {
            params: {
                q: language === "Hindi" ? hindiQuery : englishQuery,
                sortBy: "publishedAt",
                language: language === "Hindi" ? "hi" : "en",
                apiKey: NEWS_API_KEY,
                pageSize: 40, // Fetch more to survive strict filtering
                page: page,
            },
        });

        if (response.data.status === "ok") {
            return response.data.articles.filter((article: any) =>
                article.title &&
                article.urlToImage &&
                article.description &&
                article.description !== "No description available." &&
                // Post-filtering for stricter relevance
                !article.title.toLowerCase().includes("advertising") &&
                !article.title.toLowerCase().includes("nasa") &&
                !article.title.toLowerCase().includes("opinion") &&
                !article.title.toLowerCase().includes("editorial") &&
                !article.title.toLowerCase().includes("chaos") &&
                !article.title.toLowerCase().includes("billionaire") &&
                !article.source.name.includes("Gizmodo") &&
                !article.source.name.includes("TechCrunch") &&
                (
                    // Ensure positive relevance in Title if possible
                    article.title.toLowerCase().includes("farm") ||
                    article.title.toLowerCase().includes("agri") ||
                    article.title.toLowerCase().includes("crop") ||
                    article.title.toLowerCase().includes("seed") ||
                    article.title.toLowerCase().includes("rain") ||
                    article.title.toLowerCase().includes("monsoon") ||
                    article.title.toLowerCase().includes("rural") ||
                    article.title.toLowerCase().includes("kisan") ||
                    article.description.toLowerCase().includes("farm")
                )
            ).map((article: any) => ({
                title: article.title,
                description: article.description || "No description available.",
                url: article.url,
                urlToImage: article.urlToImage,
                source: { name: article.source.name },
                publishedAt: article.publishedAt
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
};
