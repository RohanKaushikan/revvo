import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./Landing";
import ProfileSetup from "./ProfileSetup";
import ProfilePage from "./ProfilePage";
import SearchResults from "./SearchResults";
import CarListings from "./CarListings";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/listings" element={<CarListings />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
