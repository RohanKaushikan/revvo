import React, { useState } from "react";
import "./CarListings.css";

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  image: string;
  location: string;
  description: string;
  insuranceEstimate: number;
  maintenanceNote: string;
}

const mockCars: Car[] = [
  {
    id: 1,
    make: "Tesla",
    model: "Model 3",
    year: 2023,
    price: 41999,
    mileage: 12000,
    image: "https://source.unsplash.com/1000x700/?tesla,car",
    location: "Newark, NJ",
    description:
      "The Tesla Model 3 offers cutting-edge EV performance with minimal maintenance and high resale value.",
    insuranceEstimate: 1450,
    maintenanceNote:
      "Generally reliable — check for tire wear and software update status.",
  },
  {
    id: 2,
    make: "Toyota",
    model: "Camry",
    year: 2021,
    price: 23999,
    mileage: 28000,
    image: "https://source.unsplash.com/1000x700/?toyota,camry",
    location: "Edison, NJ",
    description:
      "A dependable midsize sedan known for comfort, fuel efficiency, and long-term reliability.",
    insuranceEstimate: 1200,
    maintenanceNote:
      "Excellent reliability — inspect for brake wear and oil change history.",
  },
  {
    id: 3,
    make: "Honda",
    model: "Civic",
    year: 2022,
    price: 20999,
    mileage: 18000,
    image: "https://source.unsplash.com/1000x700/?honda,civic",
    location: "Princeton, NJ",
    description:
      "Popular among new buyers for its smooth ride, solid build, and great resale value.",
    insuranceEstimate: 1100,
    maintenanceNote:
      "Mostly trouble-free — verify recall fixes and transmission fluid changes.",
  },
  {
    id: 4,
    make: "BMW",
    model: "3 Series",
    year: 2020,
    price: 32999,
    mileage: 36000,
    image: "https://source.unsplash.com/1000x700/?bmw,car",
    location: "New Brunswick, NJ",
    description:
      "Luxury meets performance — refined interior, excellent handling, and strong resale value.",
    insuranceEstimate: 1800,
    maintenanceNote:
      "Ensure regular servicing — common for minor electrical and suspension issues.",
  },
];

const CarListings: React.FC = () => {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const filteredCars = mockCars.filter((car) => {
    return (
      (make === "" || car.make.toLowerCase().includes(make.toLowerCase())) &&
      (model === "" || car.model.toLowerCase().includes(model.toLowerCase())) &&
      (year === "" || car.year === Number(year)) &&
      (maxPrice === "" || car.price <= Number(maxPrice))
    );
  });

  return (
    <div className="listings-page">
      <div className="filter-bar">
        <h2>🔍 Find Your Perfect Ride</h2>
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

      <div className="car-grid">
        {filteredCars.map((car) => (
          <div
            className="car-card"
            key={car.id}
            onClick={() => setSelectedCar(car)}
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
        {filteredCars.length === 0 && (
          <p className="no-results">No cars match your filters.</p>
        )}
      </div>

      {/* Modal */}
      {selectedCar && (
        <div className="modal-overlay" onClick={() => setSelectedCar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedCar(null)}>
              ×
            </button>
            <img
              src={selectedCar.image}
              alt={selectedCar.model}
              className="modal-img"
            />
            <div className="modal-content">
              <h2>
                {selectedCar.year} {selectedCar.make} {selectedCar.model}
              </h2>
              <p className="modal-price">
                ${selectedCar.price.toLocaleString()}
              </p>
              <p className="modal-detail">
                📍 {selectedCar.location} • {selectedCar.mileage.toLocaleString()}{" "}
                miles
              </p>
              <p className="description">{selectedCar.description}</p>
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
      )}
    </div>
  );
};

export default CarListings;
