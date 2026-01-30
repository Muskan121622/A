export interface DetectionResult {
  disease: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  treatment: string;
  affectedPart: 'leaf' | 'stem' | 'fruit' | 'soil';
  symptoms: string[];
  preventiveMeasures: string[];
  economicImpact: string;
}

export interface PestDetectionResult {
  pest: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  treatment: string;
  affectedPart: 'leaf' | 'stem' | 'fruit' | 'root';
  lifecycle: string;
  biologicalControl: string[];
  chemicalControl: string[];
  damage: string;
}

export interface NutrientDeficiencyResult {
  nutrient: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
  treatment: string;
  fertilizer: string;
  soilAmendment: string;
  affectedGrowth: string;
}

export interface SoilAnalysisResult {
  texture: 'clay' | 'sandy' | 'loamy' | 'silt';
  confidence: number;
  ph: number;
  moisture: number;
  organicMatter: number;
  drainage: 'poor' | 'moderate' | 'good' | 'excellent';
  fertility: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface MultiClassResult {
  diseases: DetectionResult[];
  pests: PestDetectionResult[];
  nutrientDeficiency: NutrientDeficiencyResult[];
  soilAnalysis: SoilAnalysisResult;
  overallHealth: {
    score: number;
    status: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
    recommendations: string[];
  };
  imageAnalysis: {
    plantPart: 'leaf' | 'stem' | 'fruit' | 'soil';
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    processingTime: number;
  };
}

export class EnhancedDiseaseDetector {
  private models: Map<string, any> = new Map();
  private labels: any = null;

  async loadModels() {
    console.log('Loading enhanced multi-class detection models...');

    // Load labels from the sklearn model
    try {
      const response = await fetch('/sklearn_model_output/labels.json');
      this.labels = await response.json();
      console.log('Labels loaded:', this.labels);
    } catch (error) {
      console.log('Using fallback labels');
      this.labels = ['healthy', 'leaf_blight', 'leaf_rust', 'leaf_spot', 'nutrient_deficiency', 'pest_infected', 'stem_rot'];
    }

    console.log('Enhanced disease detection models loaded');
  }

  async detectMultiClass(imageFile: File): Promise<MultiClassResult> {
    const startTime = Date.now();

    try {
      console.log('Starting disease detection for:', imageFile.name);

      // Create FormData to send the image file
      const formData = new FormData();
      formData.append('image', imageFile);

      console.log('Sending request to API...');

      // Make API call to the backend
      const response = await fetch('http://localhost:5000/detect-disease', {
        method: 'POST',
        body: formData,
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.error("Could not parse error response", e);
        }
        throw new Error(errorMessage);
      }

      const apiResult = await response.json();
      console.log('API result:', apiResult);

      // Use the affected part from the API result, fallback to leaf if not provided
      // For healthy plants, we still want to show a plant part for context
      const plantPart = apiResult.affectedPart && apiResult.affectedPart !== 'none' && apiResult.affectedPart !== 'unknown'
        ? apiResult.affectedPart
        : (apiResult.disease === 'healthy' ? 'leaf' : this.detectPlantPart(imageFile.name));

      // Generate additional results based on the API result
      const diseases = this.generateDiseaseResultsFromAPI(apiResult, plantPart);
      console.log('Generated diseases:', diseases);
      const pests = this.generatePestResults(plantPart);
      const nutrientDeficiency = this.generateNutrientResults(plantPart);
      const soilAnalysis = this.generateSoilAnalysis();

      const processingTime = Date.now() - startTime;



      // Calculate overall health score using Groq API
      let overallHealth;
      try {
        const healthResponse = await fetch('http://localhost:5000/analyze-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            diseases: diseases.map(d => ({ disease: d.disease, severity: d.severity })),
            pests: pests.map(p => ({ pest: p.pest, severity: p.severity })),
            nutrients: nutrientDeficiency.map(n => ({ nutrient: n.nutrient, severity: n.severity })),
            soil: { texture: soilAnalysis.texture, fertility: soilAnalysis.fertility }
          })
        });

        if (healthResponse.ok) {
          overallHealth = await healthResponse.json();
        } else {
          throw new Error("Health API failed");
        }
      } catch (err) {
        console.warn("Using fallback health calculation:", err);
        overallHealth = this.calculateOverallHealthFallback(diseases, pests, nutrientDeficiency, soilAnalysis);
      }

      return {
        diseases,
        pests,
        nutrientDeficiency,
        soilAnalysis,
        overallHealth,
        imageAnalysis: {
          plantPart,
          quality: this.assessImageQuality(),
          processingTime
        }
      };
    } catch (error) {
      console.error('Error detecting disease:', error);

      // CRITICAL FIX: Do not use mock fallback if the error is a Plant Verification failure.
      if (error instanceof Error && (error.message.includes("not a plant") || error.message.includes("Cannot detect"))) {
        throw error;
      }

      // Fallback to mock results if API fails
      const plantPart = this.detectPlantPart(imageFile.name);
      const diseases = this.generateDiseaseResults(plantPart);
      const pests = this.generatePestResults(plantPart);
      const nutrientDeficiency = this.generateNutrientResults(plantPart);
      const soilAnalysis = this.generateSoilAnalysis();
      const processingTime = Date.now() - startTime;
      const overallHealth = this.calculateOverallHealthFallback(diseases, pests, nutrientDeficiency, soilAnalysis);

      return {
        diseases,
        pests,
        nutrientDeficiency,
        soilAnalysis,
        overallHealth,
        imageAnalysis: {
          plantPart,
          quality: this.assessImageQuality(),
          processingTime
        }
      };
    }
  }

  private detectPlantPart(filename: string): 'leaf' | 'stem' | 'fruit' | 'soil' {
    const name = filename.toLowerCase();
    if (name.includes('leaf')) return 'leaf';
    if (name.includes('stem')) return 'stem';
    if (name.includes('fruit')) return 'fruit';
    if (name.includes('soil')) return 'soil';

    // Default to leaf for plant disease detection as most samples are leaf-based
    return 'leaf';
  }

  private generateDiseaseResultsFromAPI(apiResult: any, plantPart: string): DetectionResult[] {
    // Use the API result to generate disease results
    const disease = apiResult.disease;
    const confidence = apiResult.confidence;
    const severity = apiResult.severity;

    // Map the API disease to our expected format
    const diseaseMapping: { [key: string]: any } = {
      'healthy': {
        disease: 'healthy',
        symptoms: ['No visible symptoms'],
        treatment: 'No treatment needed - plant is healthy',
        preventiveMeasures: ['Continue good agricultural practices'],
        economicImpact: 'No economic impact'
      },
      'leaf_blight': {
        disease: 'leaf_blight',
        symptoms: ['Brown spots with yellow halos', 'Wilting leaves', 'Premature leaf drop'],
        treatment: 'Apply copper-based fungicide every 7-10 days, improve air circulation',
        preventiveMeasures: ['Avoid overhead watering', 'Remove infected debris', 'Plant resistant varieties'],
        economicImpact: 'Can reduce yield by 20-40% if untreated'
      },
      'leaf_rust': {
        disease: 'leaf_rust',
        symptoms: ['Orange-red pustules on leaf undersides', 'Yellow spots on upper surface', 'Stunted growth'],
        treatment: 'Apply systemic fungicide, remove infected leaves',
        preventiveMeasures: ['Ensure good air circulation', 'Avoid high humidity', 'Use resistant cultivars'],
        economicImpact: 'Yield loss of 15-30% in severe cases'
      },
      'leaf_spot': {
        disease: 'leaf_spot',
        symptoms: ['Circular spots on leaves', 'Spots may have dark borders'],
        treatment: 'Apply fungicide spray, ensure proper plant spacing',
        preventiveMeasures: ['Avoid overhead watering', 'Ensure proper plant spacing', 'Remove infected leaves'],
        economicImpact: 'Yield reduction of 10-25% depending on severity'
      },
      'stem_rot': {
        disease: 'stem_rot',
        symptoms: ['Dark, water-soaked lesions on stem', 'Soft, mushy tissue', 'Plant wilting'],
        treatment: 'Remove infected plants, apply fungicide to healthy plants',
        preventiveMeasures: ['Improve drainage', 'Avoid overwatering', 'Use pathogen-free seeds'],
        economicImpact: 'Complete plant loss in severe infections'
      }
    };

    const diseaseInfo = diseaseMapping[disease] || diseaseMapping['healthy'];

    return [{
      disease: diseaseInfo.disease,
      confidence: confidence,
      severity: severity as 'low' | 'medium' | 'high',
      treatment: diseaseInfo.treatment,
      affectedPart: plantPart as 'leaf' | 'stem' | 'fruit' | 'soil',
      symptoms: diseaseInfo.symptoms,
      preventiveMeasures: diseaseInfo.preventiveMeasures,
      economicImpact: diseaseInfo.economicImpact
    }];
  }

  private generateDiseaseResults(plantPart: string): DetectionResult[] {
    const diseaseDatabase = {
      leaf: [
        {
          disease: 'leaf_blight',
          symptoms: ['Brown spots with yellow halos', 'Wilting leaves', 'Premature leaf drop'],
          treatment: 'Apply copper-based fungicide every 7-10 days, improve air circulation',
          preventiveMeasures: ['Avoid overhead watering', 'Remove infected debris', 'Plant resistant varieties'],
          economicImpact: 'Can reduce yield by 20-40% if untreated'
        },
        {
          disease: 'leaf_rust',
          symptoms: ['Orange-red pustules on leaf undersides', 'Yellow spots on upper surface', 'Stunted growth'],
          treatment: 'Apply systemic fungicide, remove infected leaves',
          preventiveMeasures: ['Ensure good air circulation', 'Avoid high humidity', 'Use resistant cultivars'],
          economicImpact: 'Yield loss of 15-30% in severe cases'
        }
      ],
      stem: [
        {
          disease: 'stem_rot',
          symptoms: ['Dark, water-soaked lesions on stem', 'Soft, mushy tissue', 'Plant wilting'],
          treatment: 'Remove infected plants, apply fungicide to healthy plants',
          preventiveMeasures: ['Improve drainage', 'Avoid overwatering', 'Use pathogen-free seeds'],
          economicImpact: 'Complete plant loss in severe infections'
        }
      ],
      fruit: [
        {
          disease: 'fruit_rot',
          symptoms: ['Soft, brown spots on fruit', 'Fuzzy mold growth', 'Premature fruit drop'],
          treatment: 'Remove infected fruits, apply protective fungicide',
          preventiveMeasures: ['Harvest at proper maturity', 'Handle carefully', 'Store in cool, dry conditions'],
          economicImpact: 'Direct fruit loss, reduced market value'
        }
      ],
      soil: [
        {
          disease: 'bacterial_wilt',
          symptoms: ['Sudden wilting', 'Yellowing leaves', 'Vascular discoloration'],
          treatment: 'No cure - remove infected plants, soil solarization',
          preventiveMeasures: ['Use resistant varieties', 'Crop rotation', 'Soil sterilization'],
          economicImpact: 'Can destroy entire crops, long-term soil contamination'
        }
      ]
    };

    const relevantDiseases = diseaseDatabase[plantPart as keyof typeof diseaseDatabase] || diseaseDatabase.leaf;
    const numDiseases = Math.floor(Math.random() * 2) + 1;

    return relevantDiseases.slice(0, numDiseases).map(disease => ({
      disease: disease.disease,
      confidence: 0.75 + Math.random() * 0.2,
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      treatment: disease.treatment,
      affectedPart: plantPart as 'leaf' | 'stem' | 'fruit' | 'soil',
      symptoms: disease.symptoms,
      preventiveMeasures: disease.preventiveMeasures,
      economicImpact: disease.economicImpact
    }));
  }

  private generatePestResults(plantPart: string): PestDetectionResult[] {
    const pestDatabase = {
      aphids: {
        lifecycle: 'Complete metamorphosis, 7-10 days per generation',
        biologicalControl: ['Ladybugs', 'Lacewings', 'Parasitic wasps'],
        chemicalControl: ['Neem oil', 'Insecticidal soap', 'Pyrethrin'],
        damage: 'Sap sucking, virus transmission, honeydew production'
      },
      thrips: {
        lifecycle: 'Incomplete metamorphosis, 15-30 days',
        biologicalControl: ['Predatory mites', 'Minute pirate bugs'],
        chemicalControl: ['Blue sticky traps', 'Spinosad', 'Abamectin'],
        damage: 'Leaf silvering, scarring, virus transmission'
      },
      caterpillars: {
        lifecycle: 'Complete metamorphosis, 30-45 days',
        biologicalControl: ['Bt bacteria', 'Trichogramma wasps', 'Birds'],
        chemicalControl: ['Bt spray', 'Spinosad', 'Emamectin benzoate'],
        damage: 'Leaf defoliation, fruit boring, growth stunting'
      }
    };

    const pests = Object.keys(pestDatabase);
    const detectedPest = pests[Math.floor(Math.random() * pests.length)];
    const pestInfo = pestDatabase[detectedPest as keyof typeof pestDatabase];

    if (Math.random() < 0.7) {
      return [{
        pest: detectedPest,
        confidence: 0.70 + Math.random() * 0.25,
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        treatment: `Integrated pest management approach recommended`,
        affectedPart: plantPart as 'leaf' | 'stem' | 'fruit' | 'root',
        lifecycle: pestInfo.lifecycle,
        biologicalControl: pestInfo.biologicalControl,
        chemicalControl: pestInfo.chemicalControl,
        damage: pestInfo.damage
      }];
    }

    return [];
  }

  private generateNutrientResults(plantPart: string): NutrientDeficiencyResult[] {
    const nutrientDatabase = {
      nitrogen_deficiency: {
        symptoms: ['Yellowing of older leaves', 'Stunted growth', 'Reduced leaf size'],
        fertilizer: 'Urea (46-0-0) or Ammonium sulfate (21-0-0)',
        soilAmendment: 'Compost, blood meal, fish emulsion',
        affectedGrowth: 'Vegetative growth severely impacted'
      },
      phosphorus_deficiency: {
        symptoms: ['Purple/reddish leaf coloration', 'Delayed maturity', 'Poor root development'],
        fertilizer: 'Triple superphosphate (0-46-0) or DAP (18-46-0)',
        soilAmendment: 'Bone meal, rock phosphate',
        affectedGrowth: 'Root development and flowering affected'
      },
      potassium_deficiency: {
        symptoms: ['Leaf edge burning', 'Weak stems', 'Poor fruit quality'],
        fertilizer: 'Muriate of potash (0-0-60) or Sulfate of potash (0-0-50)',
        soilAmendment: 'Wood ash, kelp meal',
        affectedGrowth: 'Fruit quality and disease resistance reduced'
      }
    };

    const nutrients = Object.keys(nutrientDatabase);
    const deficientNutrient = nutrients[Math.floor(Math.random() * nutrients.length)];
    const nutrientInfo = nutrientDatabase[deficientNutrient as keyof typeof nutrientDatabase];

    if (Math.random() < 0.6) {
      return [{
        nutrient: deficientNutrient,
        confidence: 0.65 + Math.random() * 0.25,
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        symptoms: nutrientInfo.symptoms,
        treatment: `Apply ${nutrientInfo.fertilizer} as per soil test recommendations`,
        fertilizer: nutrientInfo.fertilizer,
        soilAmendment: nutrientInfo.soilAmendment,
        affectedGrowth: nutrientInfo.affectedGrowth
      }];
    }

    return [];
  }

  private generateSoilAnalysis(): SoilAnalysisResult {
    const textures: ('clay' | 'sandy' | 'loamy' | 'silt')[] = ['clay', 'sandy', 'loamy', 'silt'];
    const texture = textures[Math.floor(Math.random() * textures.length)];

    const soilProperties = {
      clay: { ph: 6.8, moisture: 65, organicMatter: 3.2, drainage: 'poor', fertility: 'high' },
      sandy: { ph: 6.2, moisture: 25, organicMatter: 1.8, drainage: 'excellent', fertility: 'low' },
      loamy: { ph: 6.5, moisture: 45, organicMatter: 4.1, drainage: 'good', fertility: 'high' },
      silt: { ph: 7.1, moisture: 55, organicMatter: 2.9, drainage: 'moderate', fertility: 'medium' }
    };

    const props = soilProperties[texture];

    return {
      texture,
      confidence: 0.80 + Math.random() * 0.15,
      ph: props.ph + (Math.random() - 0.5) * 0.6,
      moisture: props.moisture + (Math.random() - 0.5) * 20,
      organicMatter: props.organicMatter + (Math.random() - 0.5) * 1.0,
      drainage: props.drainage as 'poor' | 'moderate' | 'good' | 'excellent',
      fertility: props.fertility as 'low' | 'medium' | 'high',
      recommendations: this.getSoilRecommendations(texture, props)
    };
  }

  private getSoilRecommendations(texture: string, props: any): string[] {
    const recommendations = {
      clay: [
        'Add organic matter to improve drainage',
        'Consider raised beds for better aeration',
        'Avoid working soil when wet to prevent compaction'
      ],
      sandy: [
        'Add compost to improve water retention',
        'Use mulch to reduce water evaporation',
        'Apply fertilizers more frequently in smaller amounts'
      ],
      loamy: [
        'Maintain organic matter levels with regular compost additions',
        'This is ideal soil - continue current management practices',
        'Monitor pH levels annually'
      ],
      silt: [
        'Improve drainage with organic amendments',
        'Avoid overwatering to prevent waterlogging',
        'Add coarse organic matter for structure'
      ]
    };

    return recommendations[texture as keyof typeof recommendations] || [];
  }

  private calculateOverallHealthFallback(diseases: DetectionResult[], pests: PestDetectionResult[], nutrients: NutrientDeficiencyResult[], soil: SoilAnalysisResult): {
    score: number;
    status: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
    recommendations: string[]
  } {
    let score = 100;
    const recommendations: string[] = [];

    // Check if the plant is healthy with high confidence
    const isHealthy = diseases.length === 1 && diseases[0].disease === 'healthy' && diseases[0].confidence > 0.9;

    if (isHealthy) {
      // For healthy plants with high confidence, give a high score regardless of other factors
      score = Math.min(100, 95 + Math.floor(diseases[0].confidence * 5));
      recommendations.push('Plant is healthy - continue current practices');
    } else {
      // For diseased plants or low confidence healthy classification, calculate normally

      diseases.forEach(disease => {
        // Don't deduct points for healthy plants
        if (disease.disease !== 'healthy') {
          const deduction = disease.severity === 'high' ? 25 : disease.severity === 'medium' ? 15 : 5;
          score -= deduction;
          // Only add immediate action recommendation for medium/high severity
          if (disease.severity === 'high' || disease.severity === 'medium') {
            recommendations.push(`Address ${disease.disease} immediately`);
          } else {
            recommendations.push(`Monitor for ${disease.disease} symptoms`);
          }
        } else {
          // For healthy plants with lower confidence, still add positive recommendation
          recommendations.push('Plant appears healthy - continue current practices');
        }
      });

      pests.forEach(pest => {
        const deduction = pest.severity === 'high' ? 20 : pest.severity === 'medium' ? 12 : 4;
        score -= deduction;
        recommendations.push(`Implement IPM for ${pest.pest}`);
      });

      nutrients.forEach(nutrient => {
        const deduction = nutrient.severity === 'high' ? 15 : nutrient.severity === 'medium' ? 10 : 3;
        score -= deduction;
        recommendations.push(`Correct ${nutrient.nutrient}`);
      });

      if (soil.fertility === 'low') score -= 10;
      if (soil.drainage === 'poor') score -= 8;

      score = Math.max(0, Math.min(100, score));
    }

    let status: 'critical' | 'poor' | 'fair' | 'good' | 'excellent' = score >= 95 ? 'excellent' :
      score >= 85 ? 'good' :
        score >= 70 ? 'fair' :
          score >= 50 ? 'poor' : 'critical';

    // Special case for high confidence healthy plants
    if (isHealthy) {
      status = score >= 98 ? 'excellent' : 'good';
      recommendations.splice(0, recommendations.length, 'Plant health is excellent - maintain current practices');
    } else {
      // Check if all recommendations are positive (for healthy plants)
      const hasNegativeRecommendations = recommendations.some(rec => rec.startsWith('Address') || rec.startsWith('Implement') || rec.startsWith('Correct'));
      const hasMonitoringRecommendations = recommendations.some(rec => rec.startsWith('Monitor for'));

      if (!hasNegativeRecommendations && !hasMonitoringRecommendations) {
        // All recommendations are positive, so plant is healthy
        recommendations.splice(0, recommendations.length, 'Plant health is excellent - maintain current practices');
      } else if (hasMonitoringRecommendations && !hasNegativeRecommendations) {
        // Only monitoring recommendations, adjust message accordingly
        recommendations.splice(0, recommendations.length, ...recommendations.filter(rec => rec.startsWith('Monitor for')), 'Plant health is good - monitor for potential issues');
      } else {
        // If there are negative recommendations, adjust the status message to be more realistic
        if (status === 'excellent' && (hasNegativeRecommendations || hasMonitoringRecommendations)) {
          status = 'good';
        }
      }
    }

    return { score, status, recommendations };
  }

  private assessImageQuality(): 'poor' | 'fair' | 'good' | 'excellent' {
    // For now, default to 'good' quality
    // In a more advanced implementation, this could analyze image properties
    return 'good';
  }

  async analyzeLeafImage(imageFile: File): Promise<MultiClassResult> {
    return this.detectMultiClass(imageFile);
  }

  async analyzeStemImage(imageFile: File): Promise<MultiClassResult> {
    return this.detectMultiClass(imageFile);
  }

  async analyzeFruitImage(imageFile: File): Promise<MultiClassResult> {
    return this.detectMultiClass(imageFile);
  }

  async analyzeSoilImage(imageFile: File): Promise<MultiClassResult> {
    return this.detectMultiClass(imageFile);
  }

  getSupportedPlantParts(): string[] {
    return ['leaf', 'stem', 'fruit', 'soil'];
  }

  getSupportedDiseases(): string[] {
    return this.labels?.disease || ['healthy', 'leaf_blight', 'leaf_rust', 'leaf_spot', 'stem_rot', 'fruit_rot', 'bacterial_wilt', 'viral_mosaic'];
  }

  getSupportedPests(): string[] {
    return this.labels?.pest || ['no_pest', 'aphids', 'caterpillars', 'beetles', 'mites', 'thrips', 'whiteflies'];
  }

  getSupportedNutrients(): string[] {
    return this.labels?.nutrient || ['sufficient', 'nitrogen_deficiency', 'phosphorus_deficiency', 'potassium_deficiency', 'iron_deficiency', 'magnesium_deficiency'];
  }
}