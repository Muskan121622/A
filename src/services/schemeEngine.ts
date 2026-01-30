import { Scheme, FarmerProfile } from "../types/advisory";

/**
 * Filters schemes based on farmer's profile.
 * - Matches State
 * - Matches Land Size (Eligibility)
 * - Matches Farmer Type
 */
export const getEligibleSchemes = (farmerProfile: FarmerProfile, schemes: Scheme[]): Scheme[] => {
    return schemes.filter((scheme) => {
        // 1. State Check
        const stateMatch =
            scheme.state === "All" ||
            scheme.state.toLowerCase() === farmerProfile.state.toLowerCase();

        // 2. Land Size Check
        const landMatch =
            scheme.eligibility.maxLandHolding === undefined ||
            farmerProfile.landSize <= scheme.eligibility.maxLandHolding;

        // 3. Farmer Type Check
        // If scheme is for "All", it includes everyone.
        // Otherwise, check if farmer's type is in the allowed list.
        const typeMatch =
            scheme.eligibility.farmerType.includes("All") ||
            scheme.eligibility.farmerType.includes(farmerProfile.farmerType);

        return stateMatch && landMatch && typeMatch;
    });
};
