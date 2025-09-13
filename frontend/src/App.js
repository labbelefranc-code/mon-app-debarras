import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

// Use different approaches to access environment variables
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin.replace('3000', '8001');
const API = `${BACKEND_URL}/api`;

console.log('Backend URL configured:', BACKEND_URL);
console.log('API endpoint:', API);

const Home = () => {
  const helloWorldApi = async () => {
    try {
      console.log('Making API call to:', `${API}/`);
      const response = await axios.get(`${API}/`);
      console.log('✅ API Response:', response.data.message);
    } catch (e) {
      console.error('❌ API Error:', e);
      console.error('Failed API URL:', `${API}/`);
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
          <img src="https://avatars.githubusercontent.com/in/1201222?s=120&u=2686cf91179bbafbc7a71bfbc43004cf9ae1acea&v=4" />
        </a>
        <p className="mt-5">Building something incredible ~!</p>
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
