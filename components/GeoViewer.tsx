import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Import types dynamically or use any for libraries without types
// @ts-ignore
import parseGeoraster from 'georaster';
// @ts-ignore
import GeoRasterLayer from 'georaster-layer-for-leaflet';

interface GeoViewerProps {
    resourceUrl: string;
    fileName: string;
    format: string;
}

// Component to handle map bounds updates
const MapController = ({ bounds }: { bounds: any }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && map) {
            map.fitBounds(bounds);
        }
    }, [bounds, map]);
    return null;
};

// Component to add GeoRasterLayer to map
const GeoRasterLayerComponent = ({ georaster }: { georaster: any }) => {
    const map = useMap();

    useEffect(() => {
        if (georaster && map) {
            const layer = new GeoRasterLayer({
                georaster: georaster,
                opacity: 0.7,
                resolution: 96
            });
            layer.addTo(map);
            map.fitBounds(layer.getBounds());

            return () => {
                map.removeLayer(layer);
            };
        }
    }, [georaster, map]);

    return null;
};

export default function GeoViewer({ resourceUrl, fileName, format }: GeoViewerProps) {
    const [geoData, setGeoData] = useState<any>(null);
    const [georaster, setGeoraster] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bounds, setBounds] = useState<any>(null);

    useEffect(() => {
        loadGeoData();
    }, [resourceUrl, format]);

    const loadGeoData = async () => {
        setLoading(true);
        setError('');
        setGeoData(null);
        setGeoraster(null);

        try {
            const ext = format.toLowerCase() || fileName.split('.').pop()?.toLowerCase();

            if (['geojson', 'json'].includes(ext || '')) {
                // Use proxy API to fetch GeoJSON
                const response = await axios.get('/api/resource', {
                    params: { url: resourceUrl }
                });
                setGeoData(response.data);
                // Calculate bounds for GeoJSON would be done by Leaflet automatically when added
            } else if (['tif', 'tiff'].includes(ext || '')) {
                // Use proxy API to fetch GeoTIFF
                const response = await axios.get('/api/resource', {
                    params: { url: resourceUrl },
                    responseType: 'arraybuffer'
                });
                const arrayBuffer = response.data;
                const raster = await parseGeoraster(arrayBuffer);
                setGeoraster(raster);
            } else {
                setError('Format geospatial tidak didukung.');
            }
        } catch (err: any) {
            console.error('Error loading geospatial data:', err);
            setError('Gagal memuat data geospatial. ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[500px] bg-gray-100 rounded-md">
                <div className="text-muted">Memuat peta...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-[500px] bg-red-50 rounded-md text-red-600">
                {error}
            </div>
        );
    }

    return (
        <div className="h-[600px] w-full border border-gray-300 rounded-md overflow-hidden relative z-0">
            <MapContainer
                center={[-6.2088, 106.8456]} // Default to Jakarta
                zoom={10}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {geoData && (
                    <GeoJSON
                        data={geoData}
                        onEachFeature={(feature: any, layer: any) => {
                            if (feature.properties) {
                                layer.bindPopup(
                                    Object.entries(feature.properties)
                                        .map(([key, val]) => `<b>${key}:</b> ${val}`)
                                        .join('<br/>')
                                );
                            }
                        }}
                        eventHandlers={{
                            add: (e: any) => {
                                const map = e.target._map;
                                if (map) map.fitBounds(e.target.getBounds());
                            }
                        }}
                    />
                )}

                {georaster && (
                    <GeoRasterLayerComponent georaster={georaster} />
                )}
            </MapContainer>
        </div>
    );
}
