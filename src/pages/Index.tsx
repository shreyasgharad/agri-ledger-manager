
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Dashboard
    navigate("/");
  }, [navigate]);

  // This will only be shown briefly during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-agri-green-700">Loading AgriLedger Manager...</h1>
      </div>
    </div>
  );
};

export default Index;
