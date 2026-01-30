
export const translateToHindi = (text: string): string => {
    // Simple mapping for common phrases and disease names
    const translations: { [key: string]: string } = {
        "The overall plant health is": "Samagra paudhe ka swasthya",
        "Score is": "Score hai",
        "out of 100": "100 mein se",
        "critical": "gamboohr (critical)",
        "poor": "kharaab",
        "fair": "theek",
        "good": "achha",
        "excellent": "behtareen",
        "I have detected": "Mujhe pata chala hai ki",
        "disease issues": "bimariyan hain",
        "Found": "Payi gayi",
        "with": "jiska",
        "confidence": "vishwas (confidence) hai",
        "Treatment": "Upchaar",
        "No diseases detected": "Koi bimari nahi payi gayi",
        "I also found": "Mujhe yeh bhi mila",
        "pest issues": "kide makode ki samasya",
        "Identified": "Pehchana gaya",
        "Control it using": "Isse rokne ke liye upyog karein",
        "There are": "Wahan hain",
        "nutrient deficiencies": "poshak tatvon ki kami",
        "It seems to lack": "Aisa lagta hai ki isme kami hai",
        "Recommended fertilizer is": "Sujhav diya gaya khaad hai",
        "Soil texture is": "Mitti ki banawat hai",
        "and fertility is": "aur upjau shakti hai",
        "Please check the detailed priority recommendations below": "Kripya neeche diye gaye vistrit sujhavon ki jaanch karein",
        "leaf_blight": "patti ka jhulsa rog (leaf blight)",
        "leaf_rust": "patti ka rust rog",
        "leaf_spot": "patti ke dhabbe",
        "stem_rot": "tana sadan",
        "fruit_rot": "phal sadan",
        "bacterial_wilt": "bacterial jhulsa",
        "aphids": "mahu (aphids)",
        "thrips": "thrips",
        "caterpillars": "illi (caterpillars)",
        "nitrogen_deficiency": "nitrogen ki kami",
        "phosphorus_deficiency": "phosphorus ki kami",
        "potassium_deficiency": "potassium ki kami",
        // Digital Twin Terms
        "Your farm area is": "Aapka khet ka kshetra hai",
        "hectares": "hectare",
        "mapped into": "jise baanta gaya hai",
        "soil zones": "mitti ke hisson mein",

        "active irrigation zones": "sinchai ke kshetra",
        "Average crop health is": "Fasal ka ausatan swasthya hai",
        "High pest risk detected for": "Iske liye kide ka khatra zyada hai",
        "Medium pest risk for": "Iske liye kide ka khatra madhyam (medium) hai",
        "Low pest risk for": "Iske liye kide ka khatra kam hai",
        "is in": "hai",
        "stage": "avastha mein",
        "vegetative": "badhne ki (vegetative)",
        "flowering": "phool aane ki",
        "fruiting": "phal aane ki",
        "harvesting": "katne ki",
        "active": "sakriya (active)"
    };

    let translatedText = text;
    Object.keys(translations).forEach(key => {
        // Case insensitive replacement
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        translatedText = translatedText.replace(regex, translations[key]);
    });

    return translatedText;
};
