import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./Landing";
import ProfileSetup from "./ProfileSetup";
import ProfilePage from "./ProfilePage";
import CarListings from "./CarListings";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/listings" element={<CarListings />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
