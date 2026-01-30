import * as turf from '@turf/turf';

export interface FarmBoundary {
  coordinates: [number, number][];
  area: number; // in hectares
}

export interface SoilZone {
  id: string;
  coordinates: [number, number][];
  soilType: 'clay' | 'sandy' | 'loamy' | 'silt';
  ph: number;
  organicMatter: number;
  nutrients: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
}

export interface IrrigationZone {
  id: string;
  coordinates: [number, number][];
  type: 'drip' | 'sprinkler' | 'flood' | 'manual';
  efficiency: number;
  waterRequirement: number; // liters per day
  schedule: string[];
}

export interface PestProneArea {
  id: string;
  coordinates: [number, number][];
  pestType: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastInfestation: Date;
  preventiveMeasures: string[];
}

export interface CropGrowthStage {
  id: string;
  coordinates: [number, number][];
  cropType: string;
  stage: 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';
  plantingDate: Date;
  expectedHarvest: Date;
  health: number; // 0-100
}

export interface DigitalTwinData {
  farmBoundary: FarmBoundary;
  soilZones: SoilZone[];
  irrigationZones: IrrigationZone[];
  pestProneAreas: PestProneArea[];
  cropGrowthStages: CropGrowthStage[];
  weatherData: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
  };
}

export class DigitalTwinEngine {
  private farmData: DigitalTwinData | null = null;

  async initializeFarm(coordinates: [number, number][]): Promise<DigitalTwinData> {
    const boundary = this.createFarmBoundary(coordinates);
    const soilZones = this.generateSoilZones(boundary);
    const irrigationZones = this.generateIrrigationZones(boundary);
    const pestProneAreas = this.identifyPestProneAreas(boundary);
    const cropGrowthStages = this.generateCropStages(boundary);

    this.farmData = {
      farmBoundary: boundary,
      soilZones,
      irrigationZones,
      pestProneAreas,
      cropGrowthStages,
      weatherData: await this.fetchWeatherData()
    };

    return this.farmData;
  }

  private createFarmBoundary(coordinates: [number, number][]): FarmBoundary {
    // Close the polygon by adding the first coordinate at the end
    const closedCoords = [...coordinates];
    if (closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] || 
        closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1]) {
      closedCoords.push(closedCoords[0]);
    }
    
    const polygon = turf.polygon([closedCoords]);
    const area = turf.area(polygon) / 10000; // Convert to hectares

    return {
      coordinates,
      area
    };
  }

  private generateSoilZones(boundary: FarmBoundary): SoilZone[] {
    const zones: SoilZone[] = [];
    const soilTypes: Array<'clay' | 'sandy' | 'loamy' | 'silt'> = ['clay', 'sandy', 'loamy', 'silt'];
    
    // Divide farm into 4 soil zones for demo
    // Close the polygon for bbox calculation
    const closedBoundary = [...boundary.coordinates];
    if (closedBoundary[0][0] !== closedBoundary[closedBoundary.length - 1][0] || 
        closedBoundary[0][1] !== closedBoundary[closedBoundary.length - 1][1]) {
      closedBoundary.push(closedBoundary[0]);
    }
    const bbox = turf.bbox(turf.polygon([closedBoundary]));
    const width = (bbox[2] - bbox[0]) / 2;
    const height = (bbox[3] - bbox[1]) / 2;

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const zoneCoords: [number, number][] = [
          [bbox[0] + i * width, bbox[1] + j * height],
          [bbox[0] + (i + 1) * width, bbox[1] + j * height],
          [bbox[0] + (i + 1) * width, bbox[1] + (j + 1) * height],
          [bbox[0] + i * width, bbox[1] + (j + 1) * height],
          [bbox[0] + i * width, bbox[1] + j * height]
        ];

        zones.push({
          id: `soil-zone-${i}-${j}`,
          coordinates: zoneCoords,
          soilType: soilTypes[i * 2 + j],
          ph: 6.0 + Math.random() * 2,
          organicMatter: 2 + Math.random() * 3,
          nutrients: {
            nitrogen: 20 + Math.random() * 30,
            phosphorus: 15 + Math.random() * 25,
            potassium: 100 + Math.random() * 100
          }
        });
      }
    }

    return zones;
  }

  private generateIrrigationZones(boundary: FarmBoundary): IrrigationZone[] {
    const zones: IrrigationZone[] = [];
    const types: Array<'drip' | 'sprinkler' | 'flood' | 'manual'> = ['drip', 'sprinkler', 'flood'];
    
    // Create 3 irrigation zones
    const closedBoundary = [...boundary.coordinates];
    if (closedBoundary[0][0] !== closedBoundary[closedBoundary.length - 1][0] || 
        closedBoundary[0][1] !== closedBoundary[closedBoundary.length - 1][1]) {
      closedBoundary.push(closedBoundary[0]);
    }
    const bbox = turf.bbox(turf.polygon([closedBoundary]));
    const width = (bbox[2] - bbox[0]) / 3;

    for (let i = 0; i < 3; i++) {
      const zoneCoords: [number, number][] = [
        [bbox[0] + i * width, bbox[1]],
        [bbox[0] + (i + 1) * width, bbox[1]],
        [bbox[0] + (i + 1) * width, bbox[3]],
        [bbox[0] + i * width, bbox[3]],
        [bbox[0] + i * width, bbox[1]]
      ];

      zones.push({
        id: `irrigation-zone-${i}`,
        coordinates: zoneCoords,
        type: types[i],
        efficiency: 70 + Math.random() * 25,
        waterRequirement: 1000 + Math.random() * 2000,
        schedule: ['06:00', '18:00']
      });
    }

    return zones;
  }

  private identifyPestProneAreas(boundary: FarmBoundary): PestProneArea[] {
    const areas: PestProneArea[] = [];
    const pests = ['aphids', 'caterpillars', 'beetles', 'mites'];
    const riskLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

    // Generate 2-3 pest-prone areas
    const closedBoundary = [...boundary.coordinates];
    if (closedBoundary[0][0] !== closedBoundary[closedBoundary.length - 1][0] || 
        closedBoundary[0][1] !== closedBoundary[closedBoundary.length - 1][1]) {
      closedBoundary.push(closedBoundary[0]);
    }
    const bbox = turf.bbox(turf.polygon([closedBoundary]));
    
    for (let i = 0; i < 3; i++) {
      const centerX = bbox[0] + Math.random() * (bbox[2] - bbox[0]);
      const centerY = bbox[1] + Math.random() * (bbox[3] - bbox[1]);
      const radius = 0.001; // Small circular area

      const circle = turf.circle([centerX, centerY], radius, { units: 'kilometers' });
      const coords = circle.geometry.coordinates[0] as [number, number][];

      areas.push({
        id: `pest-area-${i}`,
        coordinates: coords,
        pestType: pests[i % pests.length],
        riskLevel: riskLevels[i % riskLevels.length],
        lastInfestation: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        preventiveMeasures: [
          'Regular monitoring',
          'Beneficial insect release',
          'Organic pesticide application'
        ]
      });
    }

    return areas;
  }

  private generateCropStages(boundary: FarmBoundary): CropGrowthStage[] {
    const stages: CropGrowthStage[] = [];
    const crops = ['wheat', 'rice', 'corn', 'tomato'];
    const growthStages: Array<'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest'> = 
      ['seedling', 'vegetative', 'flowering', 'fruiting'];

    // Divide farm into crop sections
    const closedBoundary = [...boundary.coordinates];
    if (closedBoundary[0][0] !== closedBoundary[closedBoundary.length - 1][0] || 
        closedBoundary[0][1] !== closedBoundary[closedBoundary.length - 1][1]) {
      closedBoundary.push(closedBoundary[0]);
    }
    const bbox = turf.bbox(turf.polygon([closedBoundary]));
    const width = (bbox[2] - bbox[0]) / 2;
    const height = (bbox[3] - bbox[1]) / 2;

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const zoneCoords: [number, number][] = [
          [bbox[0] + i * width, bbox[1] + j * height],
          [bbox[0] + (i + 1) * width, bbox[1] + j * height],
          [bbox[0] + (i + 1) * width, bbox[1] + (j + 1) * height],
          [bbox[0] + i * width, bbox[1] + (j + 1) * height],
          [bbox[0] + i * width, bbox[1] + j * height]
        ];

        const plantingDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
        
        stages.push({
          id: `crop-stage-${i}-${j}`,
          coordinates: zoneCoords,
          cropType: crops[i * 2 + j],
          stage: growthStages[Math.floor(Math.random() * growthStages.length)],
          plantingDate,
          expectedHarvest: new Date(plantingDate.getTime() + 120 * 24 * 60 * 60 * 1000),
          health: 70 + Math.random() * 30
        });
      }
    }

    return stages;
  }

  private async fetchWeatherData() {
    // Simulated weather data
    return {
      temperature: 25 + Math.random() * 10,
      humidity: 60 + Math.random() * 30,
      rainfall: Math.random() * 20,
      windSpeed: 5 + Math.random() * 15
    };
  }

  async updateCropHealth(zoneId: string, healthScore: number) {
    if (this.farmData) {
      const zone = this.farmData.cropGrowthStages.find(z => z.id === zoneId);
      if (zone) {
        zone.health = healthScore;
      }
    }
  }

  async getIrrigationRecommendations(): Promise<string[]> {
    if (!this.farmData) return [];

    const recommendations: string[] = [];
    
    this.farmData.irrigationZones.forEach(zone => {
      if (zone.efficiency < 80) {
        recommendations.push(`Improve irrigation efficiency in ${zone.id} (current: ${zone.efficiency.toFixed(1)}%)`);
      }
      
      if (this.farmData!.weatherData.rainfall < 5) {
        recommendations.push(`Increase watering frequency in ${zone.id} due to low rainfall`);
      }
    });

    return recommendations;
  }

  async getPestAlerts(): Promise<string[]> {
    if (!this.farmData) return [];

    const alerts: string[] = [];
    
    this.farmData.pestProneAreas.forEach(area => {
      if (area.riskLevel === 'high') {
        alerts.push(`High risk of ${area.pestType} in ${area.id}`);
      }
      
      const daysSinceInfestation = Math.floor(
        (Date.now() - area.lastInfestation.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceInfestation < 7) {
        alerts.push(`Recent ${area.pestType} activity detected in ${area.id}`);
      }
    });

    return alerts;
  }
}