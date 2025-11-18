import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">
                  🎯 Intern Tracking Portal
                </h1>
                <p className="text-gray-600 text-lg">
                  Frontend Setup Complete! 🎉
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Firebase will be configured next
                </p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;