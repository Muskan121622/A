import axios from "axios";
import { Video } from "../types/advisory";

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

// Array of farming related queries to rotate through for variety
const FARMING_QUERIES_EN = [
    "Indian farming techniques organic kisan",
    "Smart agriculture India technology guide",
    "Successful organic farming stories India",
    "Modern dairy farming india tips",
    "Hydroponics farming at home India",
    "Vegetable farming profit India",
    "Tractor farming equipment India reviews",
    "Sustainable agriculture methods India"
];

const FARMING_QUERIES_HI = [
    "आधुनिक खेती के तरीके",
    "जैविक खेती कैसे करें",
    "भारतीय किसान सफलता की कहानियां",
    "डेयरी फार्मिंग की जानकारी",
    "सब्जी की खेती से मुनाफा",
    "कृषि यंत्र की जानकारी",
    "टपक सिंचाई प्रणाली",
    "मशरूम की खेती"
];

// Returns tuple of [videos, nextPageToken]
export const fetchFarmingVideos = async (language: string, pageToken?: string, searchQuery?: string): Promise<{ videos: Video[], nextPageToken?: string }> => {
    if (!YOUTUBE_API_KEY) {
        console.error("YouTube API Key is missing!");
        return { videos: [] };
    }

    try {
        let q = searchQuery;
        if (!q) {
            const queryList = language === 'Hindi' ? FARMING_QUERIES_HI : FARMING_QUERIES_EN;
            // Pick a random query to ensure fresh content on reload
            q = queryList[Math.floor(Math.random() * queryList.length)];
        }

        console.log(`Fetching YouTube videos for language: ${language}, query: ${q}`);

        const response = await axios.get(BASE_URL, {
            params: {
                part: "snippet",
                q: q,
                type: "video",
                videoDuration: "medium", // Filter out Shorts (which are < 1 min)
                maxResults: 6,
                regionCode: "IN",
                relevanceLanguage: language === 'Hindi' ? 'hi' : 'en',
                key: YOUTUBE_API_KEY,
                pageToken: pageToken
            },
        });

        const videos = response.data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
        }));

        return { videos, nextPageToken: response.data.nextPageToken };

    } catch (error: any) {
        console.error("Error fetching videos:", error);
        if (error.response) {
            console.error("YouTube API Error Details:", error.response.data);
            if (error.response.status === 403) {
                console.error("Access Forbidden. Likely Quota Exceeded or API Key restriction.");
            }
        }
        return { videos: [] };
    }
};
