import React, { useState, useEffect } from "react";
import "./CarListings.css";
import { Car as CarIcon } from "lucide-react";

// ==============================
// 🔹 Type Definitions
// ==============================
interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  image: string;
  images: string[];
  location: string;
  description: string;
  insuranceEstimate: number;
  maintenanceNote: string;
}

// ==============================
// 🔹 Fetch API Function
// ==============================
const fetchListings = async (
  state: string,
  budget: number,
  primaryUse: string
): Promise<Car[]> => {
  try {
    const res = await fetch(
      `http://127.0.0.1:8000/listings/?state=${state}&budget=${budget}&primary_use=${primaryUse}`
    );

    if (!res.ok) {
      console.error(`❌ API request failed (${res.status})`);
      return [];
    }

    const data = await res.json();
    if (!data.listings) {
      console.warn("⚠️ No listings found in API response:", data);
      return [];
    }

    // Transform backend structure → Car[]
    const cars: Car[] = Object.entries(data.listings).map(
      ([vin, item]: [string, any], index) => {
        const retail = item.retailListing || {};
        const vehicle = item.vehicle || {};
        const ratings = item.ratings || {};

        return {
          id: index,
          make: vehicle.make || "Unknown",
          model: vehicle.model || "N/A",
          year: vehicle.year || 0,
          price: retail.price || 0,
          mileage: retail.miles || 0,
          image:
            retail.images ||
            "https://source.unsplash.com/1000x700/?car,vehicle,auto",
          images: [retail.images].filter(Boolean),
          location: `${retail.city || "Unknown"}, ${retail.state || ""}`,
          description: `${vehicle.make || ""} ${vehicle.model || ""} ${
            vehicle.trim || ""
          } — ${vehicle.engine || "N/A"} engine, ${vehicle.transmission || ""}`,
          insuranceEstimate: Math.round((retail.price || 10000) * 0.12),
          maintenanceNote: `⭐ Overall Rating: ${
            ratings.overallRating?.toFixed(2) || "N/A"
          } / 5`,
        };
      }
    );

    return cars;
  } catch (err) {
    console.error("❌ Failed to fetch listings:", err);
    return [];
  }
};

// ==============================
// 🔹 Component
// ==============================
const CarListings: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter inputs
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Modal & image carousel
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset carousel when car changes
  useEffect(() => setCurrentImageIndex(0), [selectedCar]);

  // Fetch listings on mount
  useEffect(() => {
    const loadCars = async () => {
      setLoading(true);
      const data = await fetchListings("NJ", 10000, "Uber_Black");
      setCars(data);
      setLoading(false);
    };
    loadCars();
  }, []);

  // Filtering logic
  const filteredCars = cars.filter(
    (car) =>
      (make === "" || car.make.toLowerCase().includes(make.toLowerCase())) &&
      (model === "" || car.model.toLowerCase().includes(model.toLowerCase())) &&
      (year === "" || car.year === Number(year)) &&
      (maxPrice === "" || car.price <= Number(maxPrice))
  );

  // ==============================
  // 🔹 Render
  // ==============================
  return (
    <div className="page">
      <div className="listings-page">
        <div className="filter-bar">
          <h2>
            <CarIcon size={22} style={{ marginRight: "8px" }} />
            Find Your Perfect Ride
          </h2>
          <div className="filters">
            <input
              type="text"
              placeholder="Make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
            />
            <input
              type="text"
              placeholder="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <input
              type="number"
              placeholder="Max Price ($)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="loading">Loading car listings...</p>
        ) : filteredCars.length === 0 ? (
          <p className="no-results">No cars match your filters.</p>
        ) : (
          <div className="car-grid">
            {filteredCars.map((car) => (
              <div
                className="car-card"
                key={car.id}
                onClick={() => {
                  setSelectedCar(car);
                  setCurrentImageIndex(0);
                }}
              >
                <div className="image-wrapper">
                  <img src={car.image} alt={`${car.make} ${car.model}`} />
                </div>
                <div className="car-info">
                  <h3>
                    {car.year} {car.make} {car.model}
                  </h3>
                  <p className="price">${car.price.toLocaleString()}</p>
                  <p className="details">
                    {car.mileage.toLocaleString()} miles • {car.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedCar && (
          <div
            className="modal-overlay"
            onClick={() => {
              setSelectedCar(null);
              setCurrentImageIndex(0);
            }}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="close-btn"
                onClick={() => {
                  setSelectedCar(null);
                  setCurrentImageIndex(0);
                }}
              >
                ×
              </button>

              <div className="image-carousel-container">
                <div
                  className="image-carousel"
                  style={{
                    transform: `translateX(-${currentImageIndex * 100}%)`,
                  }}
                >
                  {selectedCar.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${selectedCar.make} ${selectedCar.model} - ${index + 1}`}
                      className="carousel-image"
                    />
                  ))}
                </div>

                {/* Carousel Controls */}
                {currentImageIndex > 0 && (
                  <button
                    className="carousel-btn carousel-btn-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(currentImageIndex - 1);
                    }}
                  >
                    ‹
                  </button>
                )}
                {currentImageIndex < selectedCar.images.length - 1 && (
                  <button
                    className="carousel-btn carousel-btn-right"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(currentImageIndex + 1);
                    }}
                  >
                    ›
                  </button>
                )}
              </div>

              <div className="modal-content">
                <div className="modal-content-wrapper">
                  <div className="vehicle-info">
                    <h2>
                      {selectedCar.year} {selectedCar.make} {selectedCar.model}
                    </h2>
                    <p className="modal-price">
                      ${selectedCar.price.toLocaleString()}
                    </p>
                    <p className="modal-detail">
                      📍 {selectedCar.location} •{" "}
                      {selectedCar.mileage.toLocaleString()} miles
                    </p>
                    <p className="description">{selectedCar.description}</p>
                  </div>

                  <div className="insight-box">
                    <p>💡 {selectedCar.maintenanceNote}</p>
                    <p>
                      🛡 Estimated Insurance: $
                      {selectedCar.insuranceEstimate.toLocaleString()}/yr
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarListings;
