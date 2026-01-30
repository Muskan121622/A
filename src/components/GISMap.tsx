import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Layers, MapPin, Droplets, Bug, Leaf, Activity } from 'lucide-react';
import type { DigitalTwinData } from '@/lib/gis-digital-twin';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GISMapProps {
  farmData: DigitalTwinData;
}

export function GISMap({ farmData }: GISMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [activeLayers, setActiveLayers] = useState({
    boundaries: true,
    soil: true,
    irrigation: true,
    pests: true,
    crops: true,
    ndvi: false,
  });

  const layerGroupsRef = useRef<Record<string, L.LayerGroup>>({});

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Delay map initialization slightly to allow page to render first
    const timer = setTimeout(() => {
      // Initialize map
      const map = L.map(mapContainerRef.current!).setView(
        [farmData.location.lat, farmData.location.lng],
        15
      );

      // Add satellite tile layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }).addTo(map);

      // Add labels overlay
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Labels &copy; Esri',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Initialize layer groups
      layerGroupsRef.current = {
        boundaries: L.layerGroup().addTo(map),
        soil: L.layerGroup().addTo(map),
        irrigation: L.layerGroup().addTo(map),
        pests: L.layerGroup().addTo(map),
        crops: L.layerGroup().addTo(map),
        ndvi: L.layerGroup(),
      };

      renderLayers();
    }, 100); // Small delay to allow UI to render

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [farmData]);

  useEffect(() => {
    renderLayers();
  }, [activeLayers, farmData]);

  const renderLayers = () => {
    if (!mapRef.current) return;

    // Clear all layer groups
    Object.values(layerGroupsRef.current).forEach(group => group.clearLayers());

    // Render farm boundaries
    if (activeLayers.boundaries) {
      farmData.fieldBoundaries.forEach(boundary => {
        const coords = boundary.coordinates.map(c => [c.lat, c.lng] as [number, number]);
        const polygon = L.polygon(coords, {
          color: '#10b981',
          weight: 3,
          fillColor: '#10b981',
          fillOpacity: 0.1,
        });

        polygon.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg">${boundary.name}</h3>
            <p><strong>Area:</strong> ${boundary.area.toFixed(2)} hectares</p>
            <p><strong>Perimeter:</strong> ${boundary.perimeter.toFixed(0)} meters</p>
          </div>
        `);

        polygon.addTo(layerGroupsRef.current.boundaries);
      });
    }

    // Render soil zones
    if (activeLayers.soil) {
      const soilColors: Record<string, string> = {
        clay: '#92400e',
        sandy: '#fbbf24',
        loamy: '#059669',
        silt: '#7c3aed',
        mixed: '#6b7280',
      };

      farmData.soilZones.forEach(zone => {
        const coords = zone.coordinates.map(c => [c.lat, c.lng] as [number, number]);
        const polygon = L.polygon(coords, {
          color: soilColors[zone.soilType],
          weight: 2,
          fillColor: soilColors[zone.soilType],
          fillOpacity: 0.4,
        });

        polygon.bindPopup(`
          <div class="p-2 max-w-xs">
            <h3 class="font-bold text-lg mb-2">${zone.name}</h3>
            <p><strong>Type:</strong> ${zone.soilType}</p>
            <p><strong>pH:</strong> ${zone.ph.toFixed(1)}</p>
            <p><strong>Fertility:</strong> ${zone.fertility}</p>
            <p><strong>Drainage:</strong> ${zone.drainage}</p>
            <div class="mt-2">
              <strong>NPK:</strong> ${zone.nutrients.nitrogen}/${zone.nutrients.phosphorus}/${zone.nutrients.potassium}
            </div>
          </div>
        `);

        polygon.addTo(layerGroupsRef.current.soil);
      });
    }

    // Render irrigation zones
    if (activeLayers.irrigation) {
      const irrigationColors: Record<string, string> = {
        drip: '#06b6d4',
        sprinkler: '#3b82f6',
        pivot: '#8b5cf6',
        flood: '#0ea5e9',
        manual: '#64748b',
      };

      farmData.irrigationZones.forEach(zone => {
        const coords = zone.coordinates.map(c => [c.lat, c.lng] as [number, number]);
        const polygon = L.polygon(coords, {
          color: irrigationColors[zone.type],
          weight: 2,
          fillColor: irrigationColors[zone.type],
          fillOpacity: 0.3,
        });

        polygon.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg mb-2">${zone.name}</h3>
            <p><strong>Type:</strong> ${zone.type}</p>
            <p><strong>Efficiency:</strong> ${zone.efficiency.toFixed(1)}%</p>
            <p><strong>Water Req:</strong> ${zone.waterRequirement.toLocaleString()} L/day</p>
            <p><strong>Status:</strong> <span class="capitalize">${zone.status}</span></p>
          </div>
        `);

        polygon.addTo(layerGroupsRef.current.irrigation);
      });
    }

    // Render pest-prone areas
    if (activeLayers.pests) {
      const riskColors: Record<string, string> = {
        low: '#22c55e',
        medium: '#eab308',
        high: '#ef4444',
        critical: '#991b1b',
      };

      farmData.pestProneAreas.forEach(area => {
        const coords = area.coordinates.map(c => [c.lat, c.lng] as [number, number]);
        const polygon = L.polygon(coords, {
          color: riskColors[area.riskLevel],
          weight: 2,
          fillColor: riskColors[area.riskLevel],
          fillOpacity: 0.5,
        });

        polygon.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg mb-2">${area.name}</h3>
            <p><strong>Pest:</strong> ${area.pestType}</p>
            <p><strong>Risk Level:</strong> <span class="capitalize font-bold" style="color: ${riskColors[area.riskLevel]}">${area.riskLevel}</span></p>
            <p><strong>Monitoring:</strong> ${area.monitoringSchedule}</p>
            <div class="mt-2">
              <strong>Prevention:</strong>
              <ul class="list-disc pl-4 text-sm">
                ${area.preventiveMeasures.slice(0, 2).map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>
          </div>
        `);

        polygon.addTo(layerGroupsRef.current.pests);
      });
    }

    // Render crop growth zones with NDVI colors
    if (activeLayers.crops || activeLayers.ndvi) {
      farmData.cropGrowthZones.forEach((zone, index) => {
        const coords = zone.coordinates.map(c => [c.lat, c.lng] as [number, number]);

        // NDVI color scale (red = low vegetation, green = high vegetation)
        let fillColor = '#10b981'; // Default green
        let healthStatus = 'Excellent';
        let healthEmoji = '🟢';

        if (activeLayers.ndvi) {
          const ndvi = zone.ndvi;
          if (ndvi < 0.3) {
            fillColor = '#991b1b'; // Red
            healthStatus = 'Very Low - Needs Immediate Attention!';
            healthEmoji = '🔴';
          } else if (ndvi < 0.5) {
            fillColor = '#f59e0b'; // Orange
            healthStatus = 'Low - Action Required';
            healthEmoji = '🟠';
          } else if (ndvi < 0.6) {
            fillColor = '#eab308'; // Yellow
            healthStatus = 'Medium - Monitor Closely';
            healthEmoji = '🟡';
          } else if (ndvi < 0.7) {
            fillColor = '#84cc16'; // Light green
            healthStatus = 'Good - Healthy Crops';
            healthEmoji = '🟢';
          } else {
            fillColor = '#059669'; // Dark green
            healthStatus = 'Excellent - Very Healthy!';
            healthEmoji = '🟢';
          }
        }

        const polygon = L.polygon(coords, {
          color: activeLayers.ndvi ? fillColor : '#10b981',
          weight: 2,
          fillColor: fillColor,
          fillOpacity: activeLayers.ndvi ? 0.7 : 0.3,
        });

        // Get approximate location name
        const centerLat = zone.coordinates.reduce((sum, c) => sum + c.lat, 0) / zone.coordinates.length;
        const centerLng = zone.coordinates.reduce((sum, c) => sum + c.lng, 0) / zone.coordinates.length;

        polygon.bindPopup(`
          <div class="p-3 min-w-[280px]">
            <h3 class="font-bold text-lg mb-3 border-b pb-2">${zone.name}</h3>
            
            <div class="space-y-2">
              <div class="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                <strong>📍 Location:</strong><br/>
                <span class="text-sm">Lat: ${centerLat.toFixed(4)}°, Lng: ${centerLng.toFixed(4)}°</span><br/>
                <span class="text-xs text-gray-600">Zone ${index + 1} - ${zone.coordinates.length} points mapped</span>
              </div>
              
              <div class="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <strong>🌾 Crop:</strong> ${zone.cropType.toUpperCase()} (${zone.variety})<br/>
                <strong>📊 Stage:</strong> <span class="capitalize">${zone.stage}</span>
              </div>
              
              ${activeLayers.ndvi ? `
                <div class="p-2 rounded" style="background-color: ${fillColor}20; border: 2px solid ${fillColor};">
                  <strong>${healthEmoji} NDVI Health Status:</strong><br/>
                  <span class="font-bold" style="color: ${fillColor};">${healthStatus}</span><br/>
                  <span class="text-sm">NDVI Score: ${zone.ndvi.toFixed(2)}/1.00</span><br/>
                  <span class="text-sm">Overall Health: ${zone.health.toFixed(1)}%</span>
                </div>
              ` : `
                <div class="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  <strong>💚 Health:</strong> ${zone.health.toFixed(1)}%<br/>
                  <strong>📈 NDVI:</strong> ${zone.ndvi.toFixed(2)}
                </div>
              `}
              
              <div class="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                <strong>📅 Planting:</strong> ${new Date(zone.plantingDate).toLocaleDateString('en-IN')}<br/>
                <strong>🌾 Harvest:</strong> ${new Date(zone.expectedHarvest).toLocaleDateString('en-IN')}<br/>
                <strong>📊 Predicted Yield:</strong> ${zone.yieldPrediction.toLocaleString('en-IN')} kg
              </div>
              
              ${zone.stressFactors.length > 0 || (activeLayers.ndvi && zone.ndvi < 0.6) ? `
                <div class="bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-4 border-red-500">
                  <strong class="text-red-700">⚠️ Issues Detected:</strong>
                  <ul class="list-disc pl-4 text-sm mt-1">
                    ${zone.stressFactors.length > 0 ? zone.stressFactors.map(f => `<li>${f}</li>`).join('') : ''}
                    ${activeLayers.ndvi && zone.ndvi < 0.3 ? '<li><strong>CRITICAL: Very low vegetation health - immediate irrigation/fertilization needed!</strong></li>' : ''}
                    ${activeLayers.ndvi && zone.ndvi >= 0.3 && zone.ndvi < 0.5 ? '<li><strong>WARNING: Low crop health - check for water stress, pests, or nutrient deficiency</strong></li>' : ''}
                    ${activeLayers.ndvi && zone.ndvi >= 0.5 && zone.ndvi < 0.6 ? '<li>Moderate health - monitor closely and consider soil testing</li>' : ''}
                  </ul>
                  <p class="text-xs mt-2 text-red-600"><strong>Action needed in this zone!</strong></p>
                </div>
              ` : `
                <div class="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  <strong class="text-green-700">✅ No Issues Detected</strong><br/>
                  <span class="text-sm">This zone is healthy!</span>
                </div>
              `}
            </div>
          </div>
        `);

        polygon.addTo(activeLayers.ndvi ? layerGroupsRef.current.ndvi : layerGroupsRef.current.crops);
      });
    }

    // Add weather station markers
    farmData.weatherMicroclimates.forEach(weather => {
      const icon = L.divIcon({
        html: '🌤️',
        className: 'weather-icon',
        iconSize: [30, 30],
      });

      const marker = L.marker([weather.coordinates.lat, weather.coordinates.lng], { icon });

      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-lg mb-2">Weather Station</h3>
          <p><strong>Temperature:</strong> ${weather.temperature.current.toFixed(1)}°C</p>
          <p><strong>Humidity:</strong> ${weather.humidity.toFixed(0)}%</p>
          <p><strong>Wind:</strong> ${weather.windSpeed.toFixed(1)} km/h</p>
          <p><strong>Rainfall (week):</strong> ${weather.rainfall.weekly.toFixed(1)} mm</p>
        </div>
      `);

      marker.addTo(layerGroupsRef.current.crops);
    });
  };

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => {
      const newState = { ...prev, [layer]: !prev[layer] };

      // If toggling NDVI, turn off regular crops
      if (layer === 'ndvi' && !prev.ndvi) {
        newState.crops = false;
      } else if (layer === 'crops' && !prev.crops) {
        newState.ndvi = false;
      }

      return newState;
    });

    // Toggle layer visibility
    const layerGroup = layerGroupsRef.current[layer];
    if (layerGroup && mapRef.current) {
      if (activeLayers[layer]) {
        mapRef.current.removeLayer(layerGroup);
      } else {
        mapRef.current.addLayer(layerGroup);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Layer Controls */}
      <Card className="p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Map Layers
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <Button
            size="sm"
            variant={activeLayers.boundaries ? "default" : "outline"}
            onClick={() => toggleLayer('boundaries')}
            className="flex items-center gap-1"
          >
            <MapPin className="w-4 h-4" />
            Boundaries
          </Button>
          <Button
            size="sm"
            variant={activeLayers.soil ? "default" : "outline"}
            onClick={() => toggleLayer('soil')}
            className="flex items-center gap-1"
          >
            <Layers className="w-4 h-4" />
            Soil Zones
          </Button>
          <Button
            size="sm"
            variant={activeLayers.irrigation ? "default" : "outline"}
            onClick={() => toggleLayer('irrigation')}
            className="flex items-center gap-1"
          >
            <Droplets className="w-4 h-4" />
            Irrigation
          </Button>
          <Button
            size="sm"
            variant={activeLayers.pests ? "default" : "outline"}
            onClick={() => toggleLayer('pests')}
            className="flex items-center gap-1"
          >
            <Bug className="w-4 h-4" />
            Pest Zones
          </Button>
          <Button
            size="sm"
            variant={activeLayers.crops ? "default" : "outline"}
            onClick={() => toggleLayer('crops')}
            className="flex items-center gap-1"
          >
            <Leaf className="w-4 h-4" />
            Crop Zones
          </Button>
          <Button
            size="sm"
            variant={activeLayers.ndvi ? "default" : "outline"}
            onClick={() => toggleLayer('ndvi')}
            className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600"
          >
            <Activity className="w-4 h-4" />
            NDVI View
          </Button>
        </div>
      </Card>

      {/* Map Container */}
      <Card className="overflow-hidden">
        <div
          ref={mapContainerRef}
          className="w-full h-[600px]"
          style={{ background: '#f0f0f0' }}
        />
      </Card>

      {/* Legend */}
      {activeLayers.ndvi && (
        <Card className="p-4">
          <h3 className="font-bold mb-3">NDVI Legend (Vegetation Health)</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ background: '#991b1b' }} />
              <span className="text-sm">Very Low (&lt;0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ background: '#f59e0b' }} />
              <span className="text-sm">Low (0.3-0.5)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ background: '#eab308' }} />
              <span className="text-sm">Medium (0.5-0.6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ background: '#84cc16' }} />
              <span className="text-sm">Good (0.6-0.7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ background: '#059669' }} />
              <span className="text-sm">Excellent (&gt;0.7)</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
