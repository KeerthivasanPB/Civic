'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, Crosshair } from 'lucide-react';
import { useEffect, useState } from 'react';

// Fix for default marker icons in React-Leaflet
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Project {
  id: number;
  title: string;
  department: string;
  contractor: string;
  status: string;
  startDate: string;
  endDate: string;
  lat: number;
  lng: number;
  description: string;
}

function MapController({ selectedProject }: { selectedProject: Project | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedProject) {
      map.flyTo([selectedProject.lat, selectedProject.lng], 16, { animate: true, duration: 1.5 });
    }
  }, [selectedProject, map]);
  return null;
}

function LocateControl() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 15 });
    map.once('locationfound', (e) => {
      setLocating(false);
      L.circleMarker(e.latlng, { radius: 8, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.5 }).addTo(map)
        .bindPopup("You are here").openPopup();
    });
    map.once('locationerror', () => {
      setLocating(false);
      alert("Could not access your location. Please check browser permissions.");
    });
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ top: '80px', right: '10px', position: 'absolute', zIndex: 1000 }}>
      <button 
        onClick={handleLocate}
        className="bg-white p-2 rounded shadow-md border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-blue-600"
        title="Find My Location"
      >
        <Crosshair size={20} className={locating ? "animate-spin text-gray-400" : ""} />
      </button>
    </div>
  );
}

export default function MapComponent({ projects, selectedProject, setSelectedProject }: { projects: Project[], selectedProject: Project | null, setSelectedProject: (p: Project) => void }) {
  // Ensure Leaflet css renders correctly
  useEffect(() => {
    // Some minor CSS fixes for popup to look good with Tailwind
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-popup-content-wrapper { 
        border-radius: 12px; 
        padding: 0; 
        overflow: hidden;
      }
      .leaflet-popup-content { 
        margin: 16px !important; 
        width: 260px !important;
      }
      .leaflet-popup-close-button {
        margin-top: 4px;
        margin-right: 4px;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <MapContainer 
      center={[12.9716, 77.5946]} 
      zoom={13} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
    >
      <MapController selectedProject={selectedProject} />
      <LocateControl />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {projects.map(project => (
        <Marker 
          key={project.id} 
          position={[project.lat, project.lng]}
          icon={customIcon}
          eventHandlers={{
            click: () => {
              setSelectedProject(project);
            },
          }}
        >
          <Popup>
            <div className="text-gray-900 mt-2">
                <h3 className="font-extrabold text-[15px] mb-1 text-gray-900 leading-tight pr-4">{project.title}</h3>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-3 font-medium">
                  <span className="font-semibold text-gray-600">{project.department}</span>
                  <span>•</span>
                  <span>{project.contractor}</span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg text-xs mb-3 border border-gray-100 shadow-inner flex flex-col gap-1.5">
                  <p className="flex justify-between"><strong className="text-gray-700">Start:</strong> <span className="text-gray-600 font-medium">{project.startDate}</span></p>
                  <p className="flex justify-between"><strong className="text-gray-700">End:</strong> <span className="text-gray-600 font-medium">{project.endDate}</span></p>
                </div>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-1">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${project.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : project.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                    {project.status.toUpperCase()}
                  </span>
                  <button className="text-red-600 text-[11px] font-bold flex items-center gap-1 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors -mr-2">
                    <AlertTriangle size={12} strokeWidth={2.5} /> Report
                  </button>
                </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
