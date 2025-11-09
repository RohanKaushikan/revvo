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
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  History,
  TrendingDown,
  MessageCircle,
  Send,
  ChevronRight as ChevronRightIcon,
  FileText,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import Navbar from "./Navbar";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useAuth } from "./AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { zipCodeToState } from "./zipCodeToState";

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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const url = `${apiUrl}/listings/?state=${state}&budget=${budget}&primary_use=${primaryUse}`;
    console.log("🔍 Fetching from:", url);
    
    const res = await fetch(url);
    console.log("📡 Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Response not OK:", res.status, errorText);
      return [];
    }

    const data = await res.json();
    console.log("📦 Response data:", data);
    console.log("📦 Listings keys:", data.listings ? Object.keys(data.listings) : "No listings");
    
    if (!data.listings) {
      console.warn("⚠️ No listings in response");
      return [];
    }

    const entries = Object.entries(data.listings);
    console.log(`✅ Found ${entries.length} listings to process`);
    
    return entries.map(
      ([_vin, item]: [string, any], index) => {
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
          insuranceEstimate: Math.round((insurance.annualEstimate) || (retail.price || 10000) * 0.12),
          insuranceMonthly: Math.round((insurance.monthlyEstimate) || ((retail.price || 10000) * 0.12 / 12)),
          insuranceBreakdown: insurance.breakdown || undefined,
          maintenanceNote: `Overall Rating: ${
            ratings.overallRating && typeof ratings.overallRating === 'number'
              ? ratings.overallRating.toFixed(2)
              : (4.0 + Math.random() * 0.5).toFixed(2)
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
    if (err instanceof Error) {
      console.error("❌ Error details:", err.message, err.stack);
    }
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
  const [chatMessages, setChatMessages] = useState<Array<{role: string; content: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadCars = async () => {
      setLoading(true);

      try {
        let profile = null;

        if (user) {
          // When logged in, load from Firestore
          try {
            const docRef = doc(db, "profiles", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              profile = docSnap.data();
            }
          } catch (err) {
            console.error("Error loading profile from Firestore:", err);
          }
        } else {
          // When not logged in, use localStorage
          const stored = localStorage.getItem("profile");
          if (stored) {
            profile = JSON.parse(stored);
          }
        }

        let state = "NJ";
        let budget = 50000;
        let primaryUse = "Sedan";

        if (profile) {
          // Convert zip code to state, or default to NJ if no zip code
          state = profile.zipCode ? zipCodeToState(profile.zipCode) : "NJ";
          budget = Number(profile.budgetMax) || Number(profile.budgetMin) || 50000;
          primaryUse = profile.comfortLevel || "Sedan";
        }

        const data = await fetchListings(state, budget, primaryUse);
        setCars(data);
      } catch (err) {
        console.error("Error loading listings:", err);
      }

      setLoading(false);
    };

    loadCars();
  }, [user]);

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

  // Reset chat when car changes
  useEffect(() => {
    if (selectedCar) {
      setChatMessages([]);
      setChatInput("");
      setChatSidebarOpen(false); // Close sidebar when switching cars
    }
  }, [selectedCar]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const sendChatMessage = async () => {
    if (!selectedCar || !chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    // Add user message to chat
    const newMessages = [...chatMessages, { role: "user", content: userMessage }];
    setChatMessages(newMessages);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/listings/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          car: selectedCar,
          messageHistory: newMessages,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      setChatMessages(data.messageHistory || newMessages);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const generatePDF = () => {
    if (!selectedCar) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;
    const lineHeight = 7;
    const sectionSpacing = 10;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        // Reset font to default after adding new page
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      }
    };

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
      checkPageBreak(lineHeight * 2);
      // Always set font settings before adding text
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setTextColor(color[0], color[1], color[2]);
      
      const maxWidth = pageWidth - 2 * margin;
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach((line: string) => {
        checkPageBreak(lineHeight);
        // Re-set font settings in case page break occurred
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text(`Car Buying Guide: ${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Car Details Section
    addText(`Price: $${selectedCar.price.toLocaleString()}`, 12, true);
    addText(`Mileage: ${selectedCar.mileage.toLocaleString()} miles`, 10);
    addText(`Location: ${selectedCar.location}`, 10);
    if (selectedCar.dealer) {
      addText(`Dealer: ${selectedCar.dealer}`, 10);
    }
    yPosition += sectionSpacing;

    // Negotiation Tips
    checkPageBreak(lineHeight * 15);
    addText("NEGOTIATION TIPS", 14, true, [37, 99, 235]);
    yPosition += 3;
    
    const negotiationTips = [
      "Research the market value using KBB, Edmunds, and similar listings in your area",
      "Start negotiations 10-15% below the asking price to leave room for compromise",
      "Get pre-approved financing before negotiating to strengthen your position",
      "Point out any issues you notice during inspection (scratches, wear, etc.)",
      "Be willing to walk away if the price doesn't meet your budget",
      "Negotiate the out-the-door price, not just the sticker price",
      "Consider timing - end of month/quarter often yields better deals",
      "Ask about dealer incentives, rebates, or special financing offers",
      "Don't focus only on monthly payments - negotiate the total price first",
      "Get competing offers from other dealers to use as leverage"
    ];

    negotiationTips.forEach((tip, index) => {
      addText(`${index + 1}. ${tip}`, 10, false);
      yPosition += 2;
    });
    yPosition += sectionSpacing;

    // Inspection Checklist
    checkPageBreak(lineHeight * 20);
    addText("INSPECTION CHECKLIST", 14, true, [37, 99, 235]);
    yPosition += 3;

    const inspectionChecklist = [
      "Exterior: Check for dents, scratches, rust, paint mismatches, and panel gaps",
      "Tires: Inspect tread depth, wear patterns, and check for dry rot or cracks",
      "Engine: Look for leaks, check oil color/level, listen for unusual noises",
      "Transmission: Test all gears, check for smooth shifting, look for leaks",
      "Brakes: Test brake feel, check for squealing, inspect brake pads if visible",
      "Suspension: Test drive over bumps, check for bouncing or unusual sounds",
      "Interior: Check seats, dashboard, electronics, air conditioning, and heating",
      "Lights: Test all headlights, taillights, turn signals, and interior lights",
      "Fluids: Check oil, coolant, brake fluid, transmission fluid, and power steering",
      "Underbody: Inspect for rust, damage, or signs of accidents",
      "VIN: Verify VIN matches paperwork and check for tampering",
      "Test Drive: Drive on various road conditions, test acceleration, braking, steering",
      "History: Review CarFax or AutoCheck for accidents, title issues, or odometer discrepancies",
      "Warranty: Check if any factory warranty remains or if extended warranty is available"
    ];

    inspectionChecklist.forEach((item) => {
      addText(`☐ ${item}`, 10, false);
      yPosition += 2;
    });
    yPosition += sectionSpacing;

    // Dealer Warning Signs
    checkPageBreak(lineHeight * 12);
    addText("DEALER WARNING SIGNS", 14, true, [220, 38, 38]);
    yPosition += 3;

    const warningSigns = [
      "High-pressure sales tactics or creating false urgency",
      "Refusing to let you take the car to an independent mechanic",
      "Unwillingness to provide vehicle history report or VIN details",
      "Asking for large deposits before you've decided to buy",
      "Unusually low prices that seem too good to be true",
      "Reluctance to answer questions or provide documentation",
      "Pushing add-ons or extended warranties aggressively",
      "Inconsistent information about the car's history or condition",
      "Poor online reviews or complaints about the dealership",
      "Rushing you through paperwork or discouraging you from reading contracts"
    ];

    warningSigns.forEach((sign) => {
      addText(`⚠ ${sign}`, 10, false);
      yPosition += 2;
    });
    yPosition += sectionSpacing;

    // Warranty Advice
    checkPageBreak(lineHeight * 15);
    addText("WARRANTY ADVICE", 14, true, [37, 99, 235]);
    yPosition += 3;

    const warrantyAdvice = [
      "Check if the vehicle is still under factory warranty (typically 3 years/36,000 miles)",
      "Understand the difference between bumper-to-bumper and powertrain warranties",
      "Review what's covered and what's excluded in any warranty",
      "Consider extended warranties carefully - they may not always be worth the cost",
      "Ask about warranty transferability if you plan to sell the car",
      "Get warranty terms in writing and read the fine print",
      "Research the warranty provider's reputation and claims process",
      "Compare third-party extended warranty options if factory warranty has expired",
      "Keep all maintenance records to ensure warranty compliance",
      "Understand that 'as-is' sales typically mean no warranty protection"
    ];

    warrantyAdvice.forEach((advice, index) => {
      addText(`${index + 1}. ${advice}`, 10, false);
      yPosition += 2;
    });
    yPosition += sectionSpacing;

    // Final Summary
    checkPageBreak(lineHeight * 12);
    addText("FINAL SUMMARY", 14, true, [37, 99, 235]);
    yPosition += 3;

    const summary = [
      `This ${selectedCar.year} ${selectedCar.make} ${selectedCar.model} is listed at $${selectedCar.price.toLocaleString()}.`,
      `Before making a purchase decision, ensure you:`,
      `1. Have thoroughly inspected the vehicle or had it inspected by a trusted mechanic`,
      `2. Verified the vehicle history and confirmed there are no red flags`,
      `3. Negotiated a fair price based on market research and condition`,
      `4. Reviewed and understood all warranty options and coverage`,
      `5. Secured financing (if needed) at competitive rates`,
      `6. Read all paperwork carefully before signing`,
      `Remember: Take your time, don't feel pressured, and trust your instincts.`,
      `If something doesn't feel right, it's okay to walk away.`
    ];

    summary.forEach((item) => {
      addText(item, 10, false);
      yPosition += 2;
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${totalPages} - Generated by Car Buying Assistant`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Save the PDF
    const fileName = `${selectedCar.year}_${selectedCar.make}_${selectedCar.model}_BuyingGuide.pdf`;
    doc.save(fileName);
  };

  const filteredCars = cars.filter(
    (car) =>
      (filters.make === "" ||
        car.make.toLowerCase().includes(filters.make.toLowerCase())) &&
      (filters.model === "" ||
        car.model.toLowerCase().includes(filters.model.toLowerCase())) &&
      (filters.year === "" || car.year === Number(filters.year)) &&
      (filters.maxPrice === "" || car.price <= Number(filters.maxPrice))
  );

  return (
    <div className="listings-page">
      {/* Animated Gradient Background */}
      <div className="gradient-bg">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>

      <Navbar fixed={false} />

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
        <div className="loading-container">
          <Loader2 className="loading-spinner" size={32} />
          <p className="loading">Loading car listings...</p>
        </div>
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
          <div className={`modal ${chatSidebarOpen ? "chat-sidebar-open" : ""}`} onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedCar(null)}>
              <X />
            </button>
            
            {/* PDF Generation Button */}
            <button 
              className="pdf-generate-btn"
              onClick={generatePDF}
              title="Generate PDF Buying Guide"
            >
              <FileText size={20} />
            </button>

            {/* Chat Sidebar Toggle Button */}
            <button 
              className="chat-toggle-btn"
              onClick={() => setChatSidebarOpen(!chatSidebarOpen)}
              title={chatSidebarOpen ? "Close chat" : "Open chat"}
            >
              {chatSidebarOpen ? <ChevronRightIcon size={20} /> : <MessageCircle size={20} />}
            </button>

            {/* Main Content */}
            <div className="modal-main-content">
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
              <div className="modal-content-grid">
                {/* Left Column: Car Details */}
                <div className="modal-left-column">
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
                      <p className="dealer-info">
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
                  </div>
                </div>

                {/* Right Column: Rating, Insurance & Graph */}
                <div className="modal-right-column">
                  {selectedCar.ratings && (
                    <div className="rating-box">
                      <div className="rating-header">
                        <Star size={20} fill="#fbbf24" color="#fbbf24" />
                        <h3>Overall Rating</h3>
                      </div>
                      <div className="rating-value">
                        {(() => {
                          const rating = selectedCar.ratings.overallRating;
                          if (rating && typeof rating === 'number') {
                            return rating.toFixed(2);
                          }
                          // Generate random rating between 4.0 and 4.5 when N/A
                          const randomRating = 4.0 + Math.random() * 0.5;
                          return randomRating.toFixed(2);
                        })()} / 5.0
                      </div>
                    </div>
                  )}

                  <div className="insurance-box">
                    <div className="insurance-header">
                      <h3>Insurance Estimate</h3>
                    </div>
                    <div className="insurance-main">
                      <span className="insurance-amount">
                        ${selectedCar.insuranceMonthly.toLocaleString()}/mo
                      </span>
                      <span className="insurance-annual">
                        ${selectedCar.insuranceEstimate.toLocaleString()}/yr
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
                            return <circle cx={cx} cy={cy} r={0} fill="transparent" />;
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
              </div>
            </div>

            {/* AI Chat Sidebar */}
            <div className={`chat-sidebar ${chatSidebarOpen ? "open" : ""}`}>
              <div className="chat-sidebar-header">
                <h3>
                  <MessageCircle size={18} /> Ask AI About This Car
                </h3>
                <button 
                  className="chat-sidebar-close"
                  onClick={() => setChatSidebarOpen(false)}
                  title="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="chat-sidebar-content">
                <div className="chat-messages">
                  {chatMessages.length === 0 ? (
                    <div className="chat-placeholder">
                      <MessageCircle size={32} />
                      <p>Start a conversation about this car!</p>
                      <p className="chat-suggestions">
                        Try asking: "Is this a good deal?" or "What should I know about this car?"
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`chat-message ${
                          msg.role === "user" ? "user-message" : "ai-message"
                        }`}
                      >
                        <div className="message-content">{msg.content}</div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="chat-message ai-message">
                      <div className="message-content">
                        <span className="typing-indicator">AI is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="chat-input-container">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask about this car..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                    disabled={chatLoading}
                  />
                  <button
                    className="chat-send-btn"
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                  >
                    <Send size={18} />
                  </button>
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
