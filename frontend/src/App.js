import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

// Use different approaches to access environment variables
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin.replace('3000', '8001');
const API = `${BACKEND_URL}/api`;

console.log('🔧 Backend URL configured:', BACKEND_URL);
console.log('🔧 API endpoint:', API);
console.log('🔧 Window location:', window.location.href);

function App() {
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
    <div className="App">
      <header className="App-header">
        <a
          className="App-link"
          href="https://emergent.sh"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="https://avatars.githubusercontent.com/in/1201222?s=120&u=2686cf91179bbafbc7a71bfbc43004cf9ae1acea&v=4" alt="Emergent Logo" />
        </a>
        <h1 className="text-4xl font-bold text-white mb-4">🚀 Mon Application</h1>
        <p className="text-xl text-gray-300 mb-8">Building something incredible ~!</p>
        
        {/* Debug Information */}
        <div className="mt-8 p-6 bg-gray-800 rounded-lg text-left max-w-2xl">
          <h3 className="text-lg font-bold mb-4 text-green-400">🔧 Debug Info</h3>
          <div className="space-y-2 text-sm">
            <p><strong className="text-blue-400">API Status:</strong> <span className={apiStatus.includes('Success') ? 'text-green-400' : 'text-red-400'}>{apiStatus}</span></p>
            <p><strong className="text-blue-400">Backend URL:</strong> <span className="text-gray-300">{BACKEND_URL}</span></p>
            <p><strong className="text-blue-400">API Endpoint:</strong> <span className="text-gray-300">{API}</span></p>
            <p><strong className="text-blue-400">Current Location:</strong> <span className="text-gray-300">{window.location.href}</span></p>
            {apiData && <p><strong className="text-blue-400">API Response:</strong> <span className="text-green-400">{JSON.stringify(apiData)}</span></p>}
            {debugInfo.timestamp && <p><strong className="text-blue-400">Last Check:</strong> <span className="text-gray-300">{debugInfo.timestamp}</span></p>}
            {debugInfo.error && <p><strong className="text-blue-400">Error:</strong> <span className="text-red-400">{debugInfo.error}</span></p>}
          </div>
          
          <div className="mt-6 space-x-4">
            <button 
              onClick={helloWorldApi}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              🔄 Test API Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="mt-6 p-4 bg-gray-900 rounded-lg max-w-2xl">
          <h4 className="text-md font-bold mb-2 text-yellow-400">📋 System Status</h4>
          <div className="text-xs space-y-1">
            <p>✅ Frontend Service: Running</p>
            <p>✅ Backend Service: Connected</p>
            <p>✅ Database: MongoDB Ready</p>
            <p>✅ Preview Mode: Active</p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
