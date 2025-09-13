import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

// Use different approaches to access environment variables
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin.replace('3000', '8001');
const API = `${BACKEND_URL}/api`;

console.log('🔧 Backend URL configured:', BACKEND_URL);
console.log('🔧 API endpoint:', API);

const Home = () => {
  const [apiStatus, setApiStatus] = useState('Loading...');
  const [apiData, setApiData] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  const helloWorldApi = async () => {
    try {
      console.log('📡 Making API call to:', `${API}/`);
      setApiStatus('Calling API...');
      
      const response = await axios.get(`${API}/`);
      console.log('✅ API Response:', response.data.message);
      
      setApiStatus('✅ Success');
      setApiData(response.data);
      setDebugInfo({
        url: `${API}/`,
        status: response.status,
        timestamp: new Date().toLocaleTimeString()
      });
      
    } catch (e) {
      console.error('❌ API Error:', e);
      console.error('Failed API URL:', `${API}/`);
      
      setApiStatus('❌ Failed');
      setDebugInfo({
        url: `${API}/`,
        error: e.message,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  return (
    <div>
      <header className="App-header">
        <a
          className="App-link"
          href="https://emergent.sh"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="https://avatars.githubusercontent.com/in/1201222?s=120&u=2686cf91179bbafbc7a71bfbc43004cf9ae1acea&v=4" alt="Emergent Logo" />
        </a>
        <p className="mt-5">Building something incredible ~!</p>
        
        {/* Debug Information */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg text-left max-w-lg">
          <h3 className="text-lg font-bold mb-2">🔧 Debug Info</h3>
          <p><strong>API Status:</strong> {apiStatus}</p>
          <p><strong>Backend URL:</strong> {BACKEND_URL}</p>
          <p><strong>API Endpoint:</strong> {API}</p>
          {apiData && <p><strong>API Response:</strong> {JSON.stringify(apiData)}</p>}
          {debugInfo.timestamp && <p><strong>Last Check:</strong> {debugInfo.timestamp}</p>}
          {debugInfo.error && <p className="text-red-400"><strong>Error:</strong> {debugInfo.error}</p>}
          
          <button 
            onClick={helloWorldApi}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            🔄 Test API Again
          </button>
        </div>
      </header>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
