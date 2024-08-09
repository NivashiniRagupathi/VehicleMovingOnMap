import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios'; // Import Axios
import { FaCar, FaPlay, FaPause } from 'react-icons/fa';
import ReactDOMServer from 'react-dom/server';
import './App.css'; // Import the CSS file

function App() {
  const [selectedOption, setSelectedOption] = useState('today');
  const [mapType] = useState('roadmap');
  const [connectionType, setConnectionType] = useState('wireless');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(25); // Playback speed in milliseconds
  const [pathData, setPathData] = useState([]);
  const animationInterval = useRef(null);


  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const response = await axios.get('https://vehiclemovingonmap.onrender.com/api/vehicle-data');
        if (Array.isArray(response.data)) {
          setPathData(response.data);
        } else {
          console.error('Unexpected data format:', response.data);
        }
      } catch (error) {
        console.error('Error fetching vehicle data:', error);
      }
    };

    fetchVehicleData();
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDr63qkhdIUs0eTN1d3fVCRvRmNk7ruOaI&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initMap();
    };
    document.head.appendChild(script);

    function getPath(option) {
      if (Array.isArray(pathData)) {
        const pathEntry = pathData.find(entry => entry.date === option);
        return pathEntry ? pathEntry.path : [];
      }
      console.error('pathData is not an array:', pathData);
      return [];
    }

    function initMap() {
      const mapOptions = {
        zoom: 14,
        center: { lat: 37.7749, lng: -122.4194 },
        mapTypeId: mapType,
      };

      const map = new window.google.maps.Map(document.getElementById('map'), mapOptions);

      const selectedPath = getPath(selectedOption);

      const pathPolyline = new window.google.maps.Polyline({
        path: selectedPath,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
      });

      pathPolyline.setMap(map);

      const startMarker = new window.google.maps.Marker({
        position: selectedPath[0],
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: 'red',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      });

      startMarker.setMap(map);

      const endMarker = new window.google.maps.Marker({
        position: selectedPath[selectedPath.length - 1],
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: 'green',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      });

      endMarker.setMap(map)


      // Convert React Icon to HTML
      const carIconHTML = ReactDOMServer.renderToString(<FaCar color="blue" size={24} />);

      // Convert HTML to Data URL
      const carIconDataURL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(carIconHTML)}`;

      const carMarker = new window.google.maps.Marker({
        position: selectedPath[0],
        map: map,
        icon: {
          url: carIconDataURL,
          scaledSize: new window.google.maps.Size(24, 24),
        },
      });


      function moveCar() {
        let step = 0;
        const numSteps = 200;

        function moveMarker() {
          if (!isPlaying) return;

          step += 1;
          if (step >= numSteps) {
            step = 0;
          }

          const startIndex = Math.floor(step / numSteps * (selectedPath.length - 1));
          const endIndex = Math.ceil(step / numSteps * (selectedPath.length - 1));
          const nextPosition = window.google.maps.geometry.spherical.interpolate(
            selectedPath[startIndex],
            selectedPath[endIndex],
            (step % (numSteps / (selectedPath.length - 1))) / (numSteps / (selectedPath.length - 1))
          );

          carMarker.setPosition(nextPosition);

          if (step < numSteps) {
            animationInterval.current = setTimeout(moveMarker, playbackSpeed);
          } else {
            clearInterval(animationInterval.current);
            animationInterval.current = null;
          }
        }

        moveMarker();
      }
      // Start animation if playing
      if (isPlaying) {
        moveCar();
      }
    }

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }

    };
  }, [selectedOption, mapType, isPlaying, playbackSpeed, pathData, animationInterval]);



  return (
    <div className="app-container">
      <div id="map"></div>
      <div className={`configure-box ${isMinimized ? 'minimized' : ''}`}>
        <div className="configure-box-header">
          <h3>Configure</h3>
          <div>
            <button className="minimize-btn" onClick={() => setIsMinimized(!isMinimized)}>–</button>
            <button className="close-btn" onClick={() => console.log('Close')}>×</button>
          </div>
        </div>
        <div className={`configure-box-content ${isMinimized ? 'hidden' : ''}`}>
          <label>
            Connection Type:
            <select value={connectionType} onChange={(e) => setConnectionType(e.target.value)}>
              <option value="wireless">Wireless</option>
              <option value="wired">Wired</option>
            </select>
          </label>
          <label>
            Time Period:
            <select value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
            </select>
          </label>
          <div className="player-controls">
          <button className="play-btn" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <label>
              Playback Speed:
              <input
                type="number"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                min="1"
                step="1"
                className="speed-input"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
