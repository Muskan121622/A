export interface SensorReading {
  id: string;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    zone: string;
  };
  soilMoisture: number; // percentage
  ph: number;
  temperature: number; // Celsius
  conductivity: number; // µS/cm
  nitrogen: number; // ppm
  phosphorus: number; // ppm
  potassium: number; // ppm
  batteryLevel: number; // percentage
}

export interface IrrigationRecommendation {
  zoneId: string;
  action: 'irrigate' | 'stop' | 'reduce' | 'increase';
  duration: number; // minutes
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface AlertData {
  id: string;
  type: 'moisture' | 'ph' | 'temperature' | 'nutrient' | 'battery';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  sensorId: string;
  timestamp: Date;
  resolved: boolean;
}

export class IoTSoilMonitor {
  private sensors: Map<string, SensorReading[]> = new Map();
  private alerts: AlertData[] = [];
  private thresholds = {
    moisture: { min: 30, max: 80 },
    ph: { min: 6.0, max: 7.5 },
    temperature: { min: 15, max: 35 },
    battery: { min: 20 }
  };

  constructor() {
    this.initializeSensors();
    this.startSimulation();
  }

  private initializeSensors() {
    // Initialize 6 sensors across different zones
    const sensorLocations = [
      { id: 'sensor-001', lat: 26.1445, lng: 91.7362, zone: 'north-field' },
      { id: 'sensor-002', lat: 26.1440, lng: 91.7365, zone: 'south-field' },
      { id: 'sensor-003', lat: 26.1450, lng: 91.7360, zone: 'east-field' },
      { id: 'sensor-004', lat: 26.1435, lng: 91.7358, zone: 'west-field' },
      { id: 'sensor-005', lat: 26.1448, lng: 91.7368, zone: 'greenhouse-1' },
      { id: 'sensor-006', lat: 26.1442, lng: 91.7355, zone: 'greenhouse-2' }
    ];

    sensorLocations.forEach(sensor => {
      this.sensors.set(sensor.id, []);
    });
  }

  private startSimulation() {
    // Simulate sensor readings every 30 seconds
    setInterval(() => {
      this.generateSensorReadings();
    }, 30000);

    // Generate initial readings
    this.generateSensorReadings();
  }

  private generateSensorReadings() {
    this.sensors.forEach((readings, sensorId) => {
      const location = this.getSensorLocation(sensorId);
      const reading = this.simulateSensorReading(sensorId, location);
      
      readings.push(reading);
      
      // Keep only last 100 readings per sensor
      if (readings.length > 100) {
        readings.shift();
      }

      // Check for alerts
      this.checkAlerts(reading);
    });
  }

  private simulateSensorReading(sensorId: string, location: any): SensorReading {
    const baseTime = Date.now();
    const timeVariation = Math.random() * 60000; // Up to 1 minute variation
    
    // Simulate realistic sensor data with some noise
    const soilMoisture = Math.max(0, Math.min(100, 
      45 + (Math.random() - 0.5) * 30 + Math.sin(baseTime / 86400000) * 10
    ));
    
    const ph = Math.max(4, Math.min(9, 
      6.5 + (Math.random() - 0.5) * 2
    ));
    
    const temperature = Math.max(0, Math.min(50, 
      22 + (Math.random() - 0.5) * 10 + Math.sin(baseTime / 43200000) * 5
    ));
    
    const conductivity = Math.max(100, Math.min(2000, 
      800 + (Math.random() - 0.5) * 400
    ));

    return {
      id: `${sensorId}-${Date.now()}`,
      timestamp: new Date(baseTime + timeVariation),
      location,
      soilMoisture: Math.round(soilMoisture * 10) / 10,
      ph: Math.round(ph * 100) / 100,
      temperature: Math.round(temperature * 10) / 10,
      conductivity: Math.round(conductivity),
      nitrogen: Math.round((20 + Math.random() * 40) * 10) / 10,
      phosphorus: Math.round((10 + Math.random() * 30) * 10) / 10,
      potassium: Math.round((80 + Math.random() * 120) * 10) / 10,
      batteryLevel: Math.max(0, Math.min(100, 
        85 - Math.random() * 70 // Simulate battery drain
      ))
    };
  }

  private getSensorLocation(sensorId: string) {
    const locations: Record<string, any> = {
      'sensor-001': { lat: 26.1445, lng: 91.7362, zone: 'north-field' },
      'sensor-002': { lat: 26.1440, lng: 91.7365, zone: 'south-field' },
      'sensor-003': { lat: 26.1450, lng: 91.7360, zone: 'east-field' },
      'sensor-004': { lat: 26.1435, lng: 91.7358, zone: 'west-field' },
      'sensor-005': { lat: 26.1448, lng: 91.7368, zone: 'greenhouse-1' },
      'sensor-006': { lat: 26.1442, lng: 91.7355, zone: 'greenhouse-2' }
    };
    return locations[sensorId];
  }

  private checkAlerts(reading: SensorReading) {
    // Check moisture levels
    if (reading.soilMoisture < this.thresholds.moisture.min) {
      this.createAlert({
        type: 'moisture',
        severity: 'warning',
        message: `Low soil moisture detected: ${reading.soilMoisture}%`,
        sensorId: reading.id,
        reading
      });
    } else if (reading.soilMoisture > this.thresholds.moisture.max) {
      this.createAlert({
        type: 'moisture',
        severity: 'warning',
        message: `High soil moisture detected: ${reading.soilMoisture}%`,
        sensorId: reading.id,
        reading
      });
    }

    // Check pH levels
    if (reading.ph < this.thresholds.ph.min || reading.ph > this.thresholds.ph.max) {
      this.createAlert({
        type: 'ph',
        severity: 'warning',
        message: `pH out of optimal range: ${reading.ph}`,
        sensorId: reading.id,
        reading
      });
    }

    // Check temperature
    if (reading.temperature < this.thresholds.temperature.min || 
        reading.temperature > this.thresholds.temperature.max) {
      this.createAlert({
        type: 'temperature',
        severity: 'info',
        message: `Temperature outside optimal range: ${reading.temperature}°C`,
        sensorId: reading.id,
        reading
      });
    }

    // Check battery level
    if (reading.batteryLevel < this.thresholds.battery.min) {
      this.createAlert({
        type: 'battery',
        severity: reading.batteryLevel < 10 ? 'critical' : 'warning',
        message: `Low battery level: ${reading.batteryLevel}%`,
        sensorId: reading.id,
        reading
      });
    }

    // Check nutrient levels
    if (reading.nitrogen < 15 || reading.phosphorus < 8 || reading.potassium < 60) {
      this.createAlert({
        type: 'nutrient',
        severity: 'info',
        message: `Low nutrient levels detected`,
        sensorId: reading.id,
        reading
      });
    }
  }

  private createAlert(params: {
    type: AlertData['type'];
    severity: AlertData['severity'];
    message: string;
    sensorId: string;
    reading: SensorReading;
  }) {
    const alert: AlertData = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      severity: params.severity,
      message: params.message,
      sensorId: params.sensorId,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
  }

  async getLatestReadings(): Promise<SensorReading[]> {
    const latestReadings: SensorReading[] = [];
    
    this.sensors.forEach((readings, sensorId) => {
      if (readings.length > 0) {
        latestReadings.push(readings[readings.length - 1]);
      }
    });

    return latestReadings;
  }

  async getHistoricalData(sensorId: string, hours: number = 24): Promise<SensorReading[]> {
    const readings = this.sensors.get(sensorId) || [];
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return readings.filter(reading => reading.timestamp >= cutoffTime);
  }

  async getActiveAlerts(): Promise<AlertData[]> {
    return this.alerts.filter(alert => !alert.resolved);
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  async getIrrigationRecommendations(): Promise<IrrigationRecommendation[]> {
    const recommendations: IrrigationRecommendation[] = [];
    const latestReadings = await this.getLatestReadings();

    latestReadings.forEach(reading => {
      const zoneId = reading.location.zone;
      
      if (reading.soilMoisture < 25) {
        recommendations.push({
          zoneId,
          action: 'irrigate',
          duration: 30,
          reason: `Critical low moisture: ${reading.soilMoisture}%`,
          urgency: 'high'
        });
      } else if (reading.soilMoisture < 35) {
        recommendations.push({
          zoneId,
          action: 'irrigate',
          duration: 15,
          reason: `Low moisture: ${reading.soilMoisture}%`,
          urgency: 'medium'
        });
      } else if (reading.soilMoisture > 75) {
        recommendations.push({
          zoneId,
          action: 'stop',
          duration: 0,
          reason: `High moisture: ${reading.soilMoisture}%`,
          urgency: 'low'
        });
      }
    });

    return recommendations;
  }

  async getZoneAnalytics(zoneId: string): Promise<{
    avgMoisture: number;
    avgPh: number;
    avgTemperature: number;
    moistureTrend: 'increasing' | 'decreasing' | 'stable';
    recommendations: string[];
  }> {
    const allReadings: SensorReading[] = [];
    
    // Collect readings from all sensors in the zone
    this.sensors.forEach(readings => {
      const zoneReadings = readings.filter(r => r.location.zone === zoneId);
      allReadings.push(...zoneReadings);
    });

    if (allReadings.length === 0) {
      return {
        avgMoisture: 0,
        avgPh: 0,
        avgTemperature: 0,
        moistureTrend: 'stable',
        recommendations: ['No data available for this zone']
      };
    }

    // Calculate averages
    const avgMoisture = allReadings.reduce((sum, r) => sum + r.soilMoisture, 0) / allReadings.length;
    const avgPh = allReadings.reduce((sum, r) => sum + r.ph, 0) / allReadings.length;
    const avgTemperature = allReadings.reduce((sum, r) => sum + r.temperature, 0) / allReadings.length;

    // Calculate moisture trend
    const recentReadings = allReadings.slice(-10);
    const oldReadings = allReadings.slice(-20, -10);
    
    let moistureTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentReadings.length > 0 && oldReadings.length > 0) {
      const recentAvg = recentReadings.reduce((sum, r) => sum + r.soilMoisture, 0) / recentReadings.length;
      const oldAvg = oldReadings.reduce((sum, r) => sum + r.soilMoisture, 0) / oldReadings.length;
      
      if (recentAvg > oldAvg + 2) moistureTrend = 'increasing';
      else if (recentAvg < oldAvg - 2) moistureTrend = 'decreasing';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (avgMoisture < 30) {
      recommendations.push('Increase irrigation frequency');
    } else if (avgMoisture > 70) {
      recommendations.push('Reduce irrigation or improve drainage');
    }
    
    if (avgPh < 6.0) {
      recommendations.push('Apply lime to increase soil pH');
    } else if (avgPh > 7.5) {
      recommendations.push('Apply sulfur to decrease soil pH');
    }
    
    if (avgTemperature > 30) {
      recommendations.push('Consider shade cloth or mulching');
    }

    return {
      avgMoisture: Math.round(avgMoisture * 10) / 10,
      avgPh: Math.round(avgPh * 100) / 100,
      avgTemperature: Math.round(avgTemperature * 10) / 10,
      moistureTrend,
      recommendations
    };
  }

  async simulateIrrigation(zoneId: string, duration: number): Promise<boolean> {
    console.log(`Simulating irrigation for ${zoneId} for ${duration} minutes`);
    
    // Simulate irrigation effect by increasing moisture in zone sensors
    this.sensors.forEach((readings, sensorId) => {
      const latestReading = readings[readings.length - 1];
      if (latestReading && latestReading.location.zone === zoneId) {
        // Increase moisture by 10-20% after irrigation
        const moistureIncrease = 10 + Math.random() * 10;
        const newMoisture = Math.min(100, latestReading.soilMoisture + moistureIncrease);
        
        // Add a new reading with increased moisture
        const irrigatedReading: SensorReading = {
          ...latestReading,
          id: `${sensorId}-irrigated-${Date.now()}`,
          timestamp: new Date(),
          soilMoisture: Math.round(newMoisture * 10) / 10
        };
        
        readings.push(irrigatedReading);
      }
    });

    return true;
  }
}