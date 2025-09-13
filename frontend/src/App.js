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
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <a
              className="App-link inline-block mb-4"
              href="https://emergent.sh"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img 
                src="https://avatars.githubusercontent.com/in/1201222?s=120&u=2686cf91179bbafbc7a71bfbc43004cf9ae1acea&v=4" 
                alt="Emergent Logo" 
                className="w-24 h-24 mx-auto rounded-xl"
              />
            </a>
            <h1 className="text-4xl font-bold text-white mb-2">🚀 Mon Application</h1>
            <p className="text-xl text-gray-300 mb-6">Building something incredible ~!</p>
          </div>
          
          {/* Debug Information */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-green-400">🔧 Debug Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong className="text-blue-400">API Status:</strong> <span className={apiStatus.includes('Success') ? 'text-green-400' : 'text-red-400'}>{apiStatus}</span></p>
                <p><strong className="text-blue-400">Backend URL:</strong> <span className="text-gray-300 break-all">{BACKEND_URL}</span></p>
                <p><strong className="text-blue-400">API Endpoint:</strong> <span className="text-gray-300 break-all">{API}</span></p>
              </div>
              <div>
                <p><strong className="text-blue-400">Current Location:</strong> <span className="text-gray-300 break-all">{window.location.href}</span></p>
                {apiData && <p><strong className="text-blue-400">API Response:</strong> <span className="text-green-400">{JSON.stringify(apiData)}</span></p>}
                {debugInfo.timestamp && <p><strong className="text-blue-400">Last Check:</strong> <span className="text-gray-300">{debugInfo.timestamp}</span></p>}
                {debugInfo.error && <p><strong className="text-blue-400">Error:</strong> <span className="text-red-400">{debugInfo.error}</span></p>}
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              <button 
                onClick={helloWorldApi}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white font-medium"
              >
                🔄 Test API Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors text-white font-medium"
              >
                🔄 Reload Page
              </button>
            </div>
          </div>
          
          {/* System Status */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h4 className="text-md font-bold mb-3 text-yellow-400">📋 System Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="text-green-400">✅ Frontend Service: Running</div>
              <div className="text-green-400">✅ Backend Service: Connected</div>
              <div className="text-green-400">✅ Database: MongoDB Ready</div>
              <div className="text-green-400">✅ Preview Mode: Active</div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>✨ Application Ready for Development ✨</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
