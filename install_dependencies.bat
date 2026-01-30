@echo off
echo Installing additional dependencies for advanced AI features...

npm install leaflet react-leaflet @types/leaflet mapbox-gl react-map-gl
npm install tensorflow @tensorflow/tfjs @tensorflow/tfjs-react-native
npm install ml-matrix ml-regression recharts
npm install firebase
npm install @turf/turf geojson

echo Dependencies installed successfully!
pause