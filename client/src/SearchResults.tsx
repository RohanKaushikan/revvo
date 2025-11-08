import { useNavigate } from "react-router-dom";
import { Car, User } from "lucide-react";
import CarListings from "./CarListings";
import "./SearchResults.css";

const SearchResults: React.FC = () => {
  const navigate = useNavigate();
  const hasProfile = localStorage.getItem("profile");

  return (
    <div className="search-page">
      <nav className="navbar">
        <div className="logo" onClick={() => navigate("/")}>
          <Car size={28} />
          <span>CarInsight</span>
        </div>
        <div className="nav-actions">
          {hasProfile && (
            <button className="profile-icon" onClick={() => navigate("/profile")}>
              <User size={24} />
            </button>
          )}
        </div>
      </nav>

      <CarListings />
    </div>
  );
};

export default SearchResults;
