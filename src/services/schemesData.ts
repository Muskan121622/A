import { Scheme } from "../types/advisory";

// REAL DATA - Sourced from official portals (pmkisan.gov.in, myscheme.gov.in)
// As of 2024-2025

export const ALL_SCHEMES: Scheme[] = [
    {
        id: "PM_KISAN",
        name: "PM-KISAN Samman Nidhi",
        type: "Income Support",
        state: "All",
        central: true,
        eligibility: {
            maxLandHolding: 5, // Generally for Small & Marginal, strictly < 2 hectares (~5 acres)
            farmerType: ["Small", "Marginal"],
        },
        benefits: "₹6,000 per year in 3 equal installments",
        applyLink: "https://pmkisan.gov.in",
        description: "Direct income support of ₹6,000 per year to eligible farmer families to meet farm input costs.",
        docsRequired: ["Aadhaar Card", "Land Ownership Documents", "Bank Account Details"],
        // Hindi Content
        nameHi: "पीएम-किसान सम्मान निधि",
        benefitsHi: "₹6,000 प्रति वर्ष 3 समान किस्तों में",
        descriptionHi: "पात्र किसान परिवारों को कृषि इनपुट लागतों को पूरा करने के लिए ₹6,000 प्रति वर्ष की प्रत्यक्ष आय सहायता।",
        docsRequiredHi: ["आधार कार्ड", "भूमि स्वामित्व दस्तावेज", "बैंक खाता विवरण"]
    },
    {
        id: "PMFBY",
        name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        type: "Crop Insurance",
        state: "All",
        central: true,
        eligibility: {
            // Available to all, but subsidized rates differ
            farmerType: ["Small", "Marginal", "Large", "All"],
        },
        benefits: "Insurance cover against crop loss due to non-preventable natural risks.",
        applyLink: "https://pmfby.gov.in",
        description: "Comprehensive crop insurance scheme to provide financial support to farmers suffering crop loss/damage.",
        docsRequired: ["Land Possession Certificate (LPC)", "Aadhaar Card", "Bank Passbook", "Sowing Certificate"],
        // Hindi Content
        nameHi: "प्रधानमंत्री फसल बीमा योजना (PMFBY)",
        benefitsHi: "गैर-रोकथाम योग्य प्राकृतिक जोखिमों के कारण फसल के नुकसान के खिलाफ बीमा कवर।",
        descriptionHi: "फसल के नुकसान/क्षति से पीड़ित किसानों को वित्तीय सहायता प्रदान करने के लिए व्यापक फसल बीमा योजना।",
        docsRequiredHi: ["भूमि कब्ज़ा प्रमाण पत्र (LPC)", "आधार कार्ड", "बैंक पासबुक", "बुवाई प्रमाण पत्र"]
    },
    {
        id: "KCC",
        name: "Kisan Credit Card (KCC)",
        type: "Credit / Loan",
        state: "All",
        central: true,
        eligibility: {
            farmerType: ["Small", "Marginal", "Large", "All"],
        },
        benefits: "Low interest loans (effective 4%) for farming needs.",
        applyLink: "https://www.myscheme.gov.in/schemes/kcc",
        description: "Adequate and timely credit support from the banking system under a single window with flexible and simplified procedure.",
        docsRequired: ["Identity Proof", "Address Proof", "Land Documents"],
        // Hindi Content
        nameHi: "किसान क्रेडिट कार्ड (KCC)",
        benefitsHi: "खेती की जरूरतों के लिए कम ब्याज दर (प्रभावी 4%) पर ऋण।",
        descriptionHi: "लचीली और सरलीकृत प्रक्रिया के साथ एकल विंडो के तहत बैंकिंग प्रणाली से पर्याप्त और समय पर ऋण सहायता।",
        docsRequiredHi: ["पहचान प्रमाण", "पता प्रमाण", "भूमि दस्तावेज"]
    },
    {
        id: "NMB",
        name: "Nutrient Based Subsidy (Fertilizer)",
        type: "Subsidy",
        state: "All",
        central: true,
        eligibility: {
            farmerType: ["Small", "Marginal", "Large", "All"],
        },
        benefits: "Subsidized Urea, DAP, manufacturing cost compensated by Govt.",
        applyLink: "https://fert.nic.in",
        description: "Government provides fertilizers to farmers at subsidized rates to ensure balanced nutrient application.",
        docsRequired: ["Aadhaar Card (for POS machine purchase)"],
        // Hindi Content
        nameHi: "पोषक तत्व आधारित सब्सिडी (उर्वरक)",
        benefitsHi: "सब्सिडी वाला यूरिया, डीएपी, विनिर्माण लागत सरकार द्वारा भरपाई की जाती है।",
        descriptionHi: "संतुलित पोषक तत्व अनुप्रयोग सुनिश्चित करने के लिए सरकार किसानों को सब्सिडी वाली दरों पर उर्वरक प्रदान करती है।",
        docsRequiredHi: ["आधार कार्ड"]
    },
    {
        id: "BR_RKVY",
        name: "Rashtriya Krishi Vikas Yojana (Bihar)",
        type: "Infrastructure / Subsidy",
        state: "Bihar",
        central: false,
        eligibility: {
            farmerType: ["Small", "Marginal", "Large", "All"],
        },
        benefits: "Financial aid for agriculture infrastructure and mechanization.",
        applyLink: "https://state.bihar.gov.in/krishi/CitizenHome.html",
        description: "State-implemented scheme to boost agriculture sector growth and infrastructure.",
        docsRequired: ["LPC", "Aadhaar", "Bank Details"],
        // Hindi Content
        nameHi: "राष्ट्रीय कृषि विकास योजना (बिहार)",
        benefitsHi: "कृषि बुनियादी ढांचे और मशीनीकरण के लिए वित्तीय सहायता।",
        descriptionHi: "कृषि क्षेत्र के विकास और बुनियादी ढांचे को बढ़ावा देने के लिए राज्य द्वारा लागू योजना।",
        docsRequiredHi: ["एलपीसी", "आधार", "बैंक विवरण"]
    },
    {
        id: "BR_DSL_SUB",
        name: "Bihar Diesel Subsidy Scheme",
        type: "Subsidy",
        state: "Bihar",
        central: false,
        eligibility: {
            farmerType: ["Small", "Marginal", "Large", "All"],
        },
        benefits: "Subsidy on diesel for irrigation purposes during drought-like situations.",
        applyLink: "https://dbtagriculture.bihar.gov.in/",
        description: "Provides subsidy to farmers for diesel used in pump sets for irrigation.",
        docsRequired: ["Diesel Purchase Receipt", "Aadhaar", "Bank Details", "LPC"],
        // Hindi Content
        nameHi: "बिहार डीजल अनुदान योजना",
        benefitsHi: "सूखे जैसी स्थितियों के दौरान सिंचाई के लिए डीजल पर सब्सिडी।",
        descriptionHi: "सिंचाई के लिए पंप सेटों में उपयोग किए जाने वाले डीजल के लिए किसानों को सब्सिडी प्रदान करता है।",
        docsRequiredHi: ["डीजल खरीद रसीद", "आधार", "बैंक विवरण", "एलपीसी"]
    }
];
