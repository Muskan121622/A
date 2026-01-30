export interface WeatherData {
  temperature: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
  district: string;
  date: string;
}

export class WeatherService {
  private static instance: WeatherService;
  private weatherCache: Map<string, WeatherData> = new Map();

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  async getCurrentWeather(district: string): Promise<WeatherData> {
    const cacheKey = `${district}-${new Date().toDateString()}`;
    
    if (this.weatherCache.has(cacheKey)) {
      return this.weatherCache.get(cacheKey)!;
    }

    // Simulate API call with Bihar-specific weather patterns
    const weatherData = this.generateWeatherData(district);
    this.weatherCache.set(cacheKey, weatherData);
    
    return weatherData;
  }

  private generateWeatherData(district: string): WeatherData {
    const baseTemp = this.getBaseTemperature(district);
    const baseRainfall = this.getBaseRainfall(district);
    
    return {
      temperature: baseTemp + (Math.random() - 0.5) * 10,
      rainfall: baseRainfall + (Math.random() - 0.5) * 200,
      humidity: 65 + (Math.random() - 0.5) * 30,
      windSpeed: 5 + Math.random() * 10,
      district,
      date: new Date().toISOString()
    };
  }

  private getBaseTemperature(district: string): number {
    const tempMap: Record<string, number> = {
      'Patna': 28,
      'Gaya': 29,
      'Muzaffarpur': 27,
      'Darbhanga': 26,
      'Bhagalpur': 28
    };
    return tempMap[district] || 27;
  }

  private getBaseRainfall(district: string): number {
    const rainfallMap: Record<string, number> = {
      'Patna': 1000,
      'Gaya': 900,
      'Muzaffarpur': 1100,
      'Darbhanga': 1200,
      'Bhagalpur': 950
    };
    return rainfallMap[district] || 1000;
  }
}