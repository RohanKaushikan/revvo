import React, { useState, useEffect, useRef } from "react";
import "./CarListings.css";
import {
  Car as CarIcon,
  MapPin,
  Building2,
  Gauge,
  PaintBucket,
  Fuel,
  Settings,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Info,
  History,
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  insuranceMonthly: number;
  insuranceBreakdown?: any;
  maintenanceNote: string;
  ratings?: any;
  history?: any;
  dealer?: string;
  listing?: string;
  exteriorColor?: string;
  interiorColor?: string;
  drivetrain?: string;
  transmission?: string;
  fuel?: string;
  baseMsrp?: number;
}

const fetchListings = async (
  state: string,
  budget: number,
  primaryUse: string
): Promise<Car[]> => {
  try {
    const res = await fetch(
      `http://127.0.0.1:8000/listings/?state=${state}&budget=${budget}&primary_use=${primaryUse}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.listings) return [];

    return Object.entries(data.listings).map(
      ([vin, item]: [string, any], index) => {
        const retail = item.retailListing || {};
        const vehicle = item.vehicle || {};
        const ratings = item.ratings || {};
        const insurance = item.insurance || {};
        const history = item.history || {};
        const parsedImages = Array.isArray(retail.images)
          ? retail.images
          : typeof retail.images === "string"
          ? retail.images.split(",").map((url: string) => url.trim())
          : [];

        return {
          id: index,
          make: vehicle.make || "Unknown",
          model: vehicle.model || "N/A",
          year: vehicle.year || 0,
          price: retail.price || 0,
          mileage: retail.miles || 0,
          image:
            parsedImages[0] ||
            "https://source.unsplash.com/1000x700/?car,vehicle,auto",
          images: parsedImages,
          location: `${retail.city || "Unknown"}, ${retail.state || ""}`,
          description: `${vehicle.make || ""} ${vehicle.model || ""} ${
            vehicle.trim || ""
          } — ${vehicle.engine || "N/A"} engine, ${vehicle.transmission || ""}`,
          insuranceEstimate: Math.round(insurance.annualEstimate || (retail.price || 10000) * 0.12),
          insuranceMonthly: Math.round(insurance.monthlyEstimate || ((retail.price || 10000) * 0.12) / 12),
          insuranceBreakdown: insurance.breakdown || null,
          maintenanceNote: `Overall Rating: ${
            ratings.overallRating?.toFixed(2) || "N/A"
          } / 5`,
          ratings,
          history,
          dealer: retail.dealer,
          listing: retail.listing,
          exteriorColor: vehicle.exteriorColor,
          interiorColor: vehicle.interiorColor,
          drivetrain: vehicle.drivetrain,
          transmission: vehicle.transmission,
          fuel: vehicle.fuel,
          baseMsrp: vehicle.baseMsrp,
        };
      }
    );
  } catch (err) {
    console.error("❌ Fetch failed:", err);
    return [];
  }
};

// Calculate depreciation curve using dual-exponential model
const calculateDepreciation = (currentPrice: number, currentAge: number, baseMsrp?: number) => {
  // If we have MSRP, use it; otherwise estimate original price by reverse-calculating
  const alpha = 0.7;
  const beta = 0.5;
  const gamma = 0.08;

  let V0: number;
  if (baseMsrp && baseMsrp > currentPrice) {
    V0 = baseMsrp;
  } else {
    // Reverse-calculate original price from current value
    // currentPrice = V₀(αe^(-βt) + (1-α)e^(-γt)) + S
    // Estimate V0 by working backwards
    const depreciationFactor = alpha * Math.exp(-beta * currentAge) + (1 - alpha) * Math.exp(-gamma * currentAge);
    V0 = (currentPrice - currentPrice * 0.15) / depreciationFactor;
  }

  const S = V0 * 0.15; // Salvage value: 15% of original price

  const data = [];
  const maxAge = Math.max(15, currentAge + 10);

  for (let t = 0; t <= maxAge; t++) {
    // V(t) = V₀(αe^(-βt) + (1-α)e^(-γt)) + S
    const value = V0 * (alpha * Math.exp(-beta * t) + (1 - alpha) * Math.exp(-gamma * t)) + S;
    data.push({
      year: t,
      value: Math.round(value),
      isCurrent: t === currentAge,
    });
  }

  return data;
};

const CarListings: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    year: "",
    maxPrice: "",
  });
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadCars = async () => {
      setLoading(true);
      const data = await fetchListings("NJ", 80000, "Luxury");
      setCars(data);
      setLoading(false);
    };
    loadCars();
  }, []);

  // Carousel auto-slide
  useEffect(() => {
    if (!selectedCar) return;
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => {
      setCurrentImage((prev) =>
        selectedCar.images.length
          ? (prev + 1) % selectedCar.images.length
          : 0
      );
    }, 4000);
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [selectedCar]);

  const filteredCars = cars.filter(
    (car) =>
      (filters.make === "" ||
        car.make.toLowerCase().includes(filters.make.toLowerCase())) &&
      (filters.model === "" ||
        car.model.toLowerCase().includes(filters.model.toLowerCase())) &&
      (filters.year === "" || car.year === Number(filters.year)) &&
      (filters.maxPrice === "" ||
        car.price <= Number(filters.maxPrice))
  );

  return (
    <div className="listings-page">
      {/* Animated Gradient Background */}
      <div className="gradient-bg">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <h2>
          <CarIcon size={22} style={{ marginRight: "8px" }} />
          Find Your Perfect Ride
        </h2>
        <div className="filters">
          {["make", "model", "year", "maxPrice"].map((key) => (
            <input
              key={key}
              type={key === "year" || key === "maxPrice" ? "number" : "text"}
              placeholder={
                key === "maxPrice"
                  ? "Max Price ($)"
                  : key[0].toUpperCase() + key.slice(1)
              }
              value={(filters as any)[key]}
              onChange={(e) =>
                setFilters({ ...filters, [key]: e.target.value })
              }
            />
          ))}
        </div>
      </div>

      {/* Listings */}
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
                setCurrentImage(0);
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
                  <Gauge size={14} style={{ marginRight: "5px" }} />
                  {car.mileage.toLocaleString()} mi • <MapPin size={14} />{" "}
                  {car.location}
                </p>
                <p className="insurance-preview">
                  🛡 ~${car.insuranceMonthly.toLocaleString()}/mo insurance
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
          onClick={() => setSelectedCar(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedCar(null)}>
              <X />
            </button>

            {/* Carousel */}
            <div className="image-carousel-container">
              <div
                className="image-carousel"
                style={{
                  transform: `translateX(-${currentImage * 100}%)`,
                }}
              >
                {selectedCar.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${selectedCar.make}-${i}`}
                    className="carousel-image"
                  />
                ))}
              </div>

              <button
                className="carousel-btn carousel-btn-left"
                onClick={() =>
                  setCurrentImage(
                    currentImage === 0
                      ? selectedCar.images.length - 1
                      : currentImage - 1
                  )
                }
              >
                <ChevronLeft />
              </button>
              <button
                className="carousel-btn carousel-btn-right"
                onClick={() =>
                  setCurrentImage(
                    (currentImage + 1) % selectedCar.images.length
                  )
                }
              >
                <ChevronRight />
              </button>

              <div className="carousel-indicators">
                {selectedCar.images.map((_, i) => (
                  <button
                    key={i}
                    className={`indicator ${
                      currentImage === i ? "active" : ""
                    }`}
                    onClick={() => setCurrentImage(i)}
                  />
                ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="modal-columns">
              <div className="car-details">
                <h2>
                  {selectedCar.year} {selectedCar.make} {selectedCar.model}
                </h2>
                <p className="modal-price">
                  ${selectedCar.price.toLocaleString()}
                </p>
                <p className="modal-detail">
                  <MapPin size={14} /> {selectedCar.location} •{" "}
                  <Gauge size={14} /> {selectedCar.mileage.toLocaleString()} mi
                </p>
                <p className="description">{selectedCar.description}</p>
                {selectedCar.listing && (
                  <a
                    href={selectedCar.listing}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="listing-link"
                  >
                    View Full Listing
                  </a>
                )}
                {selectedCar.dealer && (
                  <p>
                    <Building2 size={14} /> Dealer: {selectedCar.dealer}
                  </p>
                )}

                <div className="vehicle-meta">
                  <p>
                    <Settings size={14} /> {selectedCar.transmission}
                  </p>
                  <p>
                    <Fuel size={14} /> {selectedCar.fuel}
                  </p>
                  <p>
                    <PaintBucket size={14} /> Exterior:{" "}
                    {selectedCar.exteriorColor}
                  </p>
                  <p>Interior: {selectedCar.interiorColor}</p>
                </div>

                {selectedCar.history && (
                  <div className="history-section">
                    <h3>
                      <History size={16} /> Vehicle History
                    </h3>
                    <ul>
                      <li>
                        Accidents: {selectedCar.history.accidentCount ?? "N/A"}
                      </li>
                      <li>
                        Owner Count: {selectedCar.history.ownerCount ?? "N/A"}
                      </li>
                      <li>
                        One Owner: {selectedCar.history.oneOwner ? "Yes" : "No"}
                      </li>
                      <li>
                        Personal Use:{" "}
                        {selectedCar.history.personalUse ? "Yes" : "No"}
                      </li>
                      <li>
                        Usage Type: {selectedCar.history.usageType ?? "N/A"}
                      </li>
                    </ul>
                  </div>
                )}

                {/* Depreciation Graph */}
                <div className="depreciation-section">
                  <h3>
                    <TrendingDown size={16} /> Value Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={calculateDepreciation(
                        selectedCar.price,
                        new Date().getFullYear() - selectedCar.year,
                        selectedCar.baseMsrp
                      )}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="year"
                        label={{ value: "Vehicle age (years)", position: "insideBottom", offset: -5 }}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Est. Value"]}
                        labelFormatter={(label) => `${label} years old`}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (payload.isCurrent) {
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={5}
                                fill="#ef4444"
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            );
                          }
                          return null;
                        }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="depreciation-note">
                    Red dot shows current age ({new Date().getFullYear() - selectedCar.year} yrs) at ${selectedCar.price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Ratings & Insights */}
              <div className="car-ratings">
                {selectedCar.ratings && (
                  <div className="ratings-section">
                    <h3>
                      <Star size={16} /> Ratings
                    </h3>
                    <ul>
                      <li>
                        Deal:{" "}
                        {selectedCar.ratings.dealRating?.toFixed(2) || "N/A"}
                      </li>
                      <li>
                        Fuel Economy:{" "}
                        {selectedCar.ratings.fuelEconomyRating?.toFixed(2) ||
                          "N/A"}
                      </li>
                      <li>
                        Maintenance:{" "}
                        {selectedCar.ratings.maintenanceRating?.toFixed(2) ||
                          "N/A"}
                      </li>
                      <li>
                        Safety:{" "}
                        {selectedCar.ratings.safetyRating?.toFixed(2) || "N/A"}
                      </li>
                      <li>
                        Owner Satisfaction:{" "}
                        {selectedCar.ratings.ownerSatisfactionRating?.toFixed(
                          2
                        ) || "N/A"}
                      </li>
                      <li>
                        <strong>
                          Overall:{" "}
                          {selectedCar.ratings.overallRating?.toFixed(2) ||
                            "N/A"}
                        </strong>
                      </li>
                    </ul>
                  </div>
                )}

                <div className="insight-box">
                  <div className="rating-display">
                    <Star size={16} fill="#fbbf24" color="#fbbf24" />
                    <span className="rating-text">{selectedCar.maintenanceNote}</span>
                  </div>
                  <div className="insurance-display">
                    <span className="insurance-label">Insurance Estimate</span>
                    <span className="insurance-amount">
                      ${selectedCar.insuranceMonthly.toLocaleString()}/mo
                    </span>
                    <span className="insurance-annual">
                      (${selectedCar.insuranceEstimate.toLocaleString()}/yr)
                    </span>
                    <span className="insurance-suggestion">
                      Insurance for this car might be cheaper at{" "}
                      {(() => {
                        const insurers = [
                          { name: "GEICO", logo: "https://logo.clearbit.com/geico.com" },
                          { name: "State Farm", logo: "https://logo.clearbit.com/statefarm.com" },
                          { name: "Progressive", logo: "https://logo.clearbit.com/progressive.com" },
                          { name: "Allstate", logo: "https://logo.clearbit.com/allstate.com" },
                          { name: "USAA", logo: "https://logo.clearbit.com/usaa.com" }
                        ];
                        const index = selectedCar.id % insurers.length;
                        const insurer = insurers[index];
                        return (
                          <>
                            <img
                              src={insurer.logo}
                              alt={insurer.name}
                              className="insurer-logo"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {insurer.name}
                          </>
                        );
                      })()}
                    </span>
                  </div>

                  {selectedCar.insuranceBreakdown && (() => {
                    console.log('✅ Insurance breakdown data:', selectedCar.insuranceBreakdown);
                    return (
                    <div className="insurance-breakdown">
                      <h4 className="breakdown-title">Cost Factors</h4>
                      <div className="factor-list">
                        {[
                          { key: 'locationMultiplier', label: 'Location (State)', value: selectedCar.insuranceBreakdown.locationMultiplier },
                          { key: 'makeMultiplier', label: 'Make/Brand', value: selectedCar.insuranceBreakdown.makeMultiplier },
                          { key: 'bodyStyleMultiplier', label: 'Body Style', value: selectedCar.insuranceBreakdown.bodyStyleMultiplier },
                          { key: 'engineMultiplier', label: 'Engine Size', value: selectedCar.insuranceBreakdown.engineMultiplier },
                          { key: 'ageMultiplier', label: 'Vehicle Age', value: selectedCar.insuranceBreakdown.ageMultiplier },
                          { key: 'mileageMultiplier', label: 'Mileage', value: selectedCar.insuranceBreakdown.mileageMultiplier },
                          { key: 'accidentMultiplier', label: 'Accident History', value: selectedCar.insuranceBreakdown.accidentMultiplier },
                        ].filter(factor => {
                          // Only show factors that have meaningful impact (not neutral)
                          if (factor.value === undefined) return false;
                          const impact = Math.abs((factor.value - 1) * 100);
                          return impact >= 2; // Hide factors with <2% impact
                        }).map(factor => {
                          const impact = ((factor.value - 1) * 100);
                          const isIncreasing = factor.value > 1.0;
                          const isNeutral = false; // Already filtered out neutrals

                          return (
                            <div key={factor.key} className="factor-item">
                              <span className="factor-label">{factor.label}</span>
                              <div className="factor-bar-container">
                                <div
                                  className={`factor-bar ${isNeutral ? 'neutral' : isIncreasing ? 'increase' : 'decrease'}`}
                                  style={{ width: `${Math.min(Math.abs(impact), 100)}%` }}
                                />
                              </div>
                              <span className={`factor-value ${isNeutral ? 'neutral' : isIncreasing ? 'increase' : 'decrease'}`}>
                                {isNeutral ? '—' : `${impact > 0 ? '+' : ''}${impact.toFixed(0)}%`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarListings;
