import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Download, CheckCircle2, Info, Building2, Snowflake, Wind, Users, Calculator, Package, Wrench, Shield, Plus, Minus, Home, DollarSign, Calendar, Phone, Mail, Globe } from 'lucide-react';

// Complete Device Database
const DEVICES = {
  cube: {
    name: "JONIX Cube",
    model: "Cube",
    price: 1500,
    maxCoverage: 70,
    airflow: 40,
    power: 10,
    dimensions: "215 x 215 x 260 mm",
    weight: 2.5,
    generatorCount: 2,
    generatorType: "Type 175"
  },
  cubePro: {
    name: "JONIX Cube Professional",
    model: "Cube Professional",
    price: 2000,
    maxCoverage: 85,
    airflow: 40,
    power: 10,
    dimensions: "215 x 215 x 260 mm",
    weight: 2.8,
    generatorCount: 2,
    generatorType: "Type 175"
  },
  steel1c: {
    name: "JONIX Steel 1C",
    model: "Steel 1C",
    price: 3500,
    maxCoverage: 200,
    maxVolume: 12,
    airflow: 80,
    power: 32,
    dimensions: "320 x 260 x 400 mm",
    weight: 9,
    tempRange: "-18°C to +40°C",
    generatorCount: 2,
    generatorType: "Type 175"
  },
  steel2c: {
    name: "JONIX Steel 2C",
    model: "Steel 2C",
    price: 5000,
    maxCoverage: 350,
    maxVolume: 60,
    airflow: 120,
    power: 52,
    dimensions: "320 x 260 x 400 mm",
    weight: 11,
    tempRange: "-18°C to +40°C",
    generatorCount: 4,
    generatorType: "Type 175"
  },
  steel4c: {
    name: "JONIX Steel 4C",
    model: "Steel 4C",
    price: 6000,
    maxCoverage: 500,
    maxVolume: 100,
    airflow: 160,
    power: 37,
    dimensions: "320 x 260 x 400 mm",
    weight: 9,
    tempRange: "-18°C to +40°C",
    generatorCount: 4,
    generatorType: "Type 520"
  },
  duct2f: {
    name: "JONIX Duct 2F",
    model: "Duct 2F",
    price: 2000,
    airflow: 2000,
    power: 20,
    dimensions: "290 x 350 x 700 mm",
    weight: 5,
    generatorCount: 2,
    generatorType: "Type 520"
  },
  duct4f: {
    name: "JONIX Duct 4F",
    model: "Duct 4F",
    price: 4000,
    airflow: 4000,
    power: 40,
    dimensions: "290 x 350 x 700 mm",
    weight: 6,
    generatorCount: 4,
    generatorType: "Type 520"
  }
};

// Cold Room Product Categories
const COLD_ROOM_PRODUCTS = {
  meat: {
    name: "Meat Products",
    items: [
      { id: "beef", name: "Beef / Pork / Lamb", timing: "none" },
      { id: "ground", name: "Ground Meat", timing: "none" },
      { id: "poultry", name: "Poultry", timing: "none" },
      { id: "offal", name: "Offal", timing: "none" },
      { id: "sausages", name: "Fresh Sausages", timing: "none" }
    ],
    icon: "🥩"
  },
  fish: {
    name: "Fish & Seafood",
    items: [
      { id: "fresh_fish", name: "Fresh Fish", timing: "none" },
      { id: "shellfish", name: "Shellfish", timing: "none" },
      { id: "smoked_fish", name: "Smoked Fish", timing: "none" }
    ],
    icon: "🐟"
  },
  dairy: {
    name: "Dairy Products",
    items: [
      { id: "milk", name: "Fresh Milk", timing: "T1" },
      { id: "yogurt", name: "Yogurt", timing: "T2" },
      { id: "cheese", name: "Fresh Cheeses", timing: "T1" },
      { id: "cream", name: "Fresh Cream", timing: "T1" }
    ],
    icon: "🥛"
  },
  eggs: {
    name: "Eggs",
    items: [
      { id: "whole_eggs", name: "Whole Eggs", timing: "T1" },
      { id: "pasteurized_eggs", name: "Pasteurized Eggs", timing: "T1" }
    ],
    icon: "🥚"
  },
  vegetables: {
    name: "Vegetables",
    items: [
      { id: "leafy", name: "Leafy Vegetables", timing: "T1" },
      { id: "regular_veg", name: "Regular Vegetables", timing: "T2" }
    ],
    icon: "🥬"
  },
  fruits: {
    name: "Fruits",
    items: [
      { id: "delicate", name: "Delicate Fruits", timing: "T1" },
      { id: "resistant", name: "Resistant Fruits", timing: "T2" }
    ],
    icon: "🍓"
  },
  others: {
    name: "Other Products",
    items: [
      { id: "fresh_pasta", name: "Fresh Pasta", timing: "T1" },
      { id: "ready_meals", name: "Ready Meals", timing: "T1" },
      { id: "fresh_sauces", name: "Fresh Sauces", timing: "T1" },
      { id: "frozen", name: "Frozen Products", timing: "none" }
    ],
    icon: "🍝"
  }
};

// Generate recommendations
const generateRecommendations = (formData) => {
  const recommendations = [];
  const { sector, applicationType, rooms, coldRoomProducts } = formData;

  // Determine timing for cold rooms
  let timingNeeded = "none";
  if (applicationType === 'coldRoom' && coldRoomProducts?.length > 0) {
    const selectedProducts = Object.values(COLD_ROOM_PRODUCTS)
      .flatMap(cat => cat.items)
      .filter(item => coldRoomProducts.includes(item.id));
    
    if (selectedProducts.some(p => p.timing === "T1")) timingNeeded = "T1";
    else if (selectedProducts.some(p => p.timing === "T2")) timingNeeded = "T2";
  }

  if (applicationType === 'coldRoom') {
    // Cold Room Logic
    const totalVolume = rooms.reduce((sum, r) => sum + parseFloat(r.size || 0), 0);
    
    // Option 1: Individual units per room
    const individualDevices = rooms.map(room => {
      const vol = parseFloat(room.size || 0);
      if (vol <= 12) return { device: DEVICES.steel1c, qty: 1 };
      if (vol <= 60) return { device: DEVICES.steel2c, qty: 1 };
      return { device: DEVICES.steel4c, qty: Math.ceil(vol / 100) };
    });

    const totalIndividualCost = individualDevices.reduce((sum, d) => sum + (d.device.price * d.qty), 0);
    const totalIndividualUnits = individualDevices.reduce((sum, d) => sum + d.qty, 0);

    recommendations.push({
      id: 'individual',
      name: 'Individual Unit Per Cold Room',
      totalCost: totalIndividualCost,
      totalUnits: totalIndividualUnits,
      rooms: rooms.map((r, idx) => ({
        name: r.name || `Cold Room ${idx + 1}`,
        size: r.size,
        device: individualDevices[idx].device.name,
        qty: individualDevices[idx].qty,
        unitCost: individualDevices[idx].device.price * individualDevices[idx].qty
      })),
      coverage: totalVolume,
      timingCycle: timingNeeded,
      efficiency: "excellent",
      reason: `Dedicated device for each cold room. Total ${totalIndividualUnits} units. ${timingNeeded !== "none" ? `Operating cycle: ${timingNeeded}` : "Continuous operation"}`
    });

    // Option 2: Bulk solution if applicable
    if (totalVolume <= 60 && rooms.length > 1) {
      const bulkDevice = totalVolume <= 12 ? DEVICES.steel1c : DEVICES.steel2c;
      const bulkQty = Math.ceil(totalVolume / (bulkDevice.maxVolume || 60));
      
      recommendations.push({
        id: 'bulk',
        name: `${bulkQty}× ${bulkDevice.name} (Shared Coverage)`,
        totalCost: bulkDevice.price * bulkQty,
        totalUnits: bulkQty,
        device: bulkDevice,
        rooms: rooms.map((r, idx) => ({
          name: r.name || `Cold Room ${idx + 1}`,
          size: r.size
        })),
        coverage: totalVolume,
        timingCycle: timingNeeded,
        efficiency: "good",
        reason: `Centralized solution for all cold rooms. ${bulkQty} unit${bulkQty > 1 ? 's' : ''} covering ${totalVolume.toFixed(1)} m³ total.`
      });
    }

  } else if (applicationType === 'room') {
    // Regular Rooms Logic
    const totalArea = rooms.reduce((sum, r) => sum + parseFloat(r.size || 0), 0);

    // Select device based on sector
    let primaryDevice, secondaryDevice;
    if (sector === 'healthcare') {
      primaryDevice = DEVICES.cubePro;
      secondaryDevice = DEVICES.cube;
    } else if (sector === 'food') {
      primaryDevice = DEVICES.steel4c;
      secondaryDevice = DEVICES.steel1c;
    } else {
      primaryDevice = DEVICES.cube;
      secondaryDevice = DEVICES.cubePro;
    }

    // Option 1: One unit per room (primary device)
    const primaryPerRoom = rooms.map(room => {
      const area = parseFloat(room.size || 0);
      return Math.ceil(area / primaryDevice.maxCoverage);
    });
    const totalPrimaryUnits = primaryPerRoom.reduce((sum, qty) => sum + qty, 0);

    recommendations.push({
      id: 'primary_each',
      name: `${primaryDevice.name} - One Per Room`,
      totalCost: primaryDevice.price * totalPrimaryUnits,
      totalUnits: totalPrimaryUnits,
      device: primaryDevice,
      rooms: rooms.map((r, idx) => ({
        name: r.name || `Room ${idx + 1}`,
        size: r.size,
        device: primaryDevice.name,
        qty: primaryPerRoom[idx],
        unitCost: primaryDevice.price * primaryPerRoom[idx]
      })),
      coverage: totalArea,
      efficiency: "excellent",
      reason: `${primaryDevice.name} in each room. Perfect for ${sector} sector. Individual coverage up to ${primaryDevice.maxCoverage} m² per unit.`
    });

    // Option 2: Secondary device per room
    const secondaryPerRoom = rooms.map(room => {
      const area = parseFloat(room.size || 0);
      return Math.ceil(area / secondaryDevice.maxCoverage);
    });
    const totalSecondaryUnits = secondaryPerRoom.reduce((sum, qty) => sum + qty, 0);

    recommendations.push({
      id: 'secondary_each',
      name: `${secondaryDevice.name} - One Per Room`,
      totalCost: secondaryDevice.price * totalSecondaryUnits,
      totalUnits: totalSecondaryUnits,
      device: secondaryDevice,
      rooms: rooms.map((r, idx) => ({
        name: r.name || `Room ${idx + 1}`,
        size: r.size,
        device: secondaryDevice.name,
        qty: secondaryPerRoom[idx],
        unitCost: secondaryDevice.price * secondaryPerRoom[idx]
      })),
      coverage: totalArea,
      efficiency: "excellent",
      reason: `${secondaryDevice.name} in each room. Alternative coverage up to ${secondaryDevice.maxCoverage} m² per unit.`
    });

    // Option 3: Single central unit (if total area fits)
    if (totalArea <= primaryDevice.maxCoverage) {
      recommendations.push({
        id: 'single_primary',
        name: `Single ${primaryDevice.name} (Central)`,
        totalCost: primaryDevice.price,
        totalUnits: 1,
        device: primaryDevice,
        rooms: rooms.map((r, idx) => ({
          name: r.name || `Room ${idx + 1}`,
          size: r.size
        })),
        coverage: totalArea,
        efficiency: "good",
        reason: `Single centrally-located ${primaryDevice.name} for all rooms (total ${totalArea} m²). Most economical option.`
      });
    }

    // Option 4: Minimum units needed
    const minUnits = Math.ceil(totalArea / primaryDevice.maxCoverage);
    if (minUnits > 1 && minUnits < totalPrimaryUnits) {
      recommendations.push({
        id: 'minimum_coverage',
        name: `${minUnits}× ${primaryDevice.name} (Minimum)`,
        totalCost: primaryDevice.price * minUnits,
        totalUnits: minUnits,
        device: primaryDevice,
        rooms: rooms.map((r, idx) => ({
          name: r.name || `Room ${idx + 1}`,
          size: r.size
        })),
        coverage: totalArea,
        efficiency: "good",
        reason: `Minimum ${minUnits} units needed for ${totalArea} m² total coverage. Shared between rooms.`
      });
    }

  } else if (applicationType === 'hvac') {
    // HVAC Logic
    const totalArea = rooms.reduce((sum, r) => sum + parseFloat(r.size || 0), 0);
    const estimatedAirflow = totalArea * 10;

    if (estimatedAirflow <= 2000) {
      recommendations.push({
        id: 'duct2f',
        name: 'JONIX Duct 2F',
        totalCost: DEVICES.duct2f.price,
        totalUnits: 1,
        device: DEVICES.duct2f,
        rooms: rooms,
        coverage: totalArea,
        efficiency: "excellent",
        reason: `Perfect for your HVAC system (${estimatedAirflow.toFixed(0)} m³/h estimated). Covers up to 2000 m³/h.`
      });
    } else if (estimatedAirflow <= 4000) {
      recommendations.push({
        id: 'duct4f',
        name: 'JONIX Duct 4F',
        totalCost: DEVICES.duct4f.price,
        totalUnits: 1,
        device: DEVICES.duct4f,
        rooms: rooms,
        coverage: totalArea,
        efficiency: "excellent",
        reason: `High-capacity solution for your HVAC system (${estimatedAirflow.toFixed(0)} m³/h estimated). Covers up to 4000 m³/h.`
      });
      
      // Also show Duct 2F as alternative
      const duct2fQty = Math.ceil(estimatedAirflow / 2000);
      recommendations.push({
        id: 'duct2f_multi',
        name: `${duct2fQty}× JONIX Duct 2F`,
        totalCost: DEVICES.duct2f.price * duct2fQty,
        totalUnits: duct2fQty,
        device: DEVICES.duct2f,
        rooms: rooms,
        coverage: totalArea,
        efficiency: "good",
        reason: `Alternative: ${duct2fQty} Duct 2F units for your system size.`
      });
    } else {
      const duct4fQty = Math.ceil(estimatedAirflow / 4000);
      recommendations.push({
        id: 'duct4f_multi',
        name: `${duct4fQty}× JONIX Duct 4F`,
        totalCost: DEVICES.duct4f.price * duct4fQty,
        totalUnits: duct4fQty,
        device: DEVICES.duct4f,
        rooms: rooms,
        coverage: totalArea,
        efficiency: "good",
        reason: `${duct4fQty} high-capacity units needed for ${estimatedAirflow.toFixed(0)} m³/h system.`
      });
    }
  }

  return recommendations.sort((a, b) => {
    if (a.efficiency === "excellent" && b.efficiency !== "excellent") return -1;
    if (a.efficiency !== "excellent" && b.efficiency === "excellent") return 1;
    return a.totalCost - b.totalCost;
  });
};

function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    sector: '',
    applicationType: '',
    numberOfRooms: 1,
    rooms: [{ name: '', size: '' }],
    coldRoomProducts: []
  });
  const [recommendations, setRecommendations] = useState(null);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // Initialize rooms
      const roomsArray = Array.from({ length: formData.numberOfRooms }, (_, i) => ({
        name: formData.rooms[i]?.name || '',
        size: formData.rooms[i]?.size || ''
      }));
      setFormData({ ...formData, rooms: roomsArray });
      
      if (formData.applicationType === 'coldRoom') {
        setStep(4); // Go to products
      } else {
        setStep(5); // Skip to sizes
      }
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      const recs = generateRecommendations(formData);
      setRecommendations(recs);
      setStep(6);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleReset = () => {
    setStep(1);
    setFormData({
      sector: '',
      applicationType: '',
      numberOfRooms: 1,
      rooms: [{ name: '', size: '' }],
      coldRoomProducts: []
    });
    setRecommendations(null);
  };

  const canProceed = () => {
    if (step === 1) return formData.sector !== '';
    if (step === 2) return formData.applicationType !== '';
    if (step === 3) return formData.numberOfRooms > 0;
    if (step === 4) return true;
    if (step === 5) {
      return formData.rooms.every(r => r.size && parseFloat(r.size) > 0);
    }
    return true;
  };

  const updateRoom = (index, field, value) => {
    const newRooms = [...formData.rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setFormData({ ...formData, rooms: newRooms });
  };

  const toggleProduct = (productId) => {
    const current = formData.coldRoomProducts || [];
    if (current.includes(productId)) {
      setFormData({ ...formData, coldRoomProducts: current.filter(p => p !== productId) });
    } else {
      setFormData({ ...formData, coldRoomProducts: [...current, productId] });
    }
  };

  // Quick selection buttons for number of rooms
  const quickSelectRooms = [1, 2, 3, 4, 5, 10];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="no-print border-b-2 border-gray-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Wind className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                JONIX Device Finder
              </h1>
              <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                Find Your Perfect Air Sanitization Solution
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        {/* Progress Bar */}
        {step < 6 && (
          <div className="no-print mb-8 lg:mb-12">
            <div className="flex items-center justify-center gap-2 lg:gap-3 overflow-x-auto pb-2">
              {[1, 2, 3, 4, 5].map((s) => {
                if (s === 4 && formData.applicationType !== 'coldRoom') return null;
                
                const isActive = s === step;
                const isComplete = s < step;
                const displayStep = formData.applicationType === 'coldRoom' ? s : (s <= 3 ? s : s - 1);
                
                return (
                  <React.Fragment key={s}>
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center font-bold text-sm lg:text-base transition-all flex-shrink-0 ${
                      isActive || isComplete 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isComplete ? <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6" /> : displayStep}
                    </div>
                    {s < 5 && (s !== 4 || formData.applicationType === 'coldRoom') && (
                      <div className={`h-1 w-12 lg:w-20 rounded transition-all flex-shrink-0 ${
                        s < step ? 'bg-blue-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Business Sector */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 text-center">
              What's your business sector?
            </h2>
            <p className="text-base lg:text-lg text-gray-600 mb-8 lg:mb-12 text-center">
              This helps us recommend the best device for your needs
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              {[
                { id: 'healthcare', icon: Users, label: 'Healthcare', desc: 'Hospitals, clinics, medical facilities', color: '#10b981' },
                { id: 'food', icon: Snowflake, label: 'Food Industry', desc: 'Restaurants, food processing, storage', color: '#f59e0b' },
                { id: 'hospitality', icon: Building2, label: 'Hospitality', desc: 'Hotels, offices, commercial spaces', color: '#8b5cf6' },
                { id: 'retail', icon: Building2, label: 'Retail', desc: 'Shops, supermarkets, stores', color: '#3b82f6' }
              ].map(({ id, icon: Icon, label, desc, color }) => (
                <button
                  key={id}
                  onClick={() => setFormData({ ...formData, sector: id })}
                  className={`p-6 lg:p-8 rounded-2xl text-left cursor-pointer transition-all ${
                    formData.sector === id
                      ? 'bg-blue-50 shadow-lg scale-[1.02]'
                      : 'bg-white shadow-md hover:shadow-lg'
                  }`}
                  style={{
                    border: formData.sector === id ? `3px solid ${color}` : '2px solid #e5e7eb'
                  }}
                >
                  <Icon style={{ color }} className="w-10 h-10 lg:w-12 lg:h-12 mb-4" />
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
                    {label}
                  </h3>
                  <p className="text-sm lg:text-base text-gray-600">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Application Type */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 text-center">
              What type of space?
            </h2>
            <p className="text-base lg:text-lg text-gray-600 mb-8 lg:mb-12 text-center">
              Choose the application type
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
              {[
                { id: 'coldRoom', icon: Snowflake, label: 'Cold Rooms', desc: 'Refrigerated storage', color: '#06b6d4' },
                { id: 'room', icon: Building2, label: 'Regular Rooms', desc: 'Offices, clinics, spaces', color: '#8b5cf6' },
                { id: 'hvac', icon: Wind, label: 'HVAC System', desc: 'Air duct integration', color: '#10b981' }
              ].map(({ id, icon: Icon, label, desc, color }) => (
                <button
                  key={id}
                  onClick={() => setFormData({ ...formData, applicationType: id })}
                  className={`p-6 lg:p-8 rounded-2xl text-center cursor-pointer transition-all ${
                    formData.applicationType === id
                      ? 'bg-blue-50 shadow-lg scale-[1.02]'
                      : 'bg-white shadow-md hover:shadow-lg'
                  }`}
                  style={{
                    border: formData.applicationType === id ? `3px solid ${color}` : '2px solid #e5e7eb'
                  }}
                >
                  <Icon style={{ color }} className="w-10 h-10 lg:w-12 lg:h-12 mb-4 mx-auto" />
                  <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2">
                    {label}
                  </h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Number of Rooms - REDESIGNED */}
        {step === 3 && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 text-center">
              How many {formData.applicationType === 'coldRoom' ? 'cold rooms' : formData.applicationType === 'hvac' ? 'zones' : 'rooms'}?
            </h2>
            <p className="text-base lg:text-lg text-gray-600 mb-8 lg:mb-12 text-center">
              Select or enter the number of spaces you need to protect
            </p>

            {/* Main Counter Display */}
            <div className="mb-8 p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
              <div className="flex items-center justify-center gap-4 lg:gap-8">
                <button
                  onClick={() => setFormData({ ...formData, numberOfRooms: Math.max(1, formData.numberOfRooms - 1) })}
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 border-none cursor-pointer shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105 transition-all flex-shrink-0 group"
                >
                  <Minus className="w-8 h-8 lg:w-10 lg:h-10 text-white group-hover:scale-110 transition-transform" />
                </button>

                <div className="flex-1 max-w-xs">
                  <div className="text-center mb-2">
                    <span className="text-sm lg:text-base font-semibold text-blue-700 uppercase tracking-wider">
                      Number of Spaces
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={formData.numberOfRooms}
                    onChange={(e) => setFormData({ ...formData, numberOfRooms: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full p-6 lg:p-8 rounded-2xl text-5xl lg:text-7xl font-bold text-center bg-white border-3 border-blue-300 text-blue-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 shadow-inner transition-all"
                  />
                </div>

                <button
                  onClick={() => setFormData({ ...formData, numberOfRooms: formData.numberOfRooms + 1 })}
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 border-none cursor-pointer shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105 transition-all flex-shrink-0 group"
                >
                  <Plus className="w-8 h-8 lg:w-10 lg:h-10 text-white group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Quick Selection Buttons */}
            <div className="mb-6">
              <p className="text-center text-sm lg:text-base font-semibold text-gray-700 mb-4">
                Quick Select:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {quickSelectRooms.map((num) => (
                  <button
                    key={num}
                    onClick={() => setFormData({ ...formData, numberOfRooms: num })}
                    className={`px-6 py-3 rounded-xl font-bold text-base transition-all ${
                      formData.numberOfRooms === num
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40 scale-105'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:text-blue-600 hover:shadow-md'
                    }`}
                  >
                    {num} {num === 1 ? 'Space' : 'Spaces'}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    💡 Pro Tip
                  </h3>
                  <p className="text-sm lg:text-base text-gray-700 leading-relaxed">
                    Include all spaces that need air sanitization - even if they're different sizes. 
                    You'll specify individual dimensions in the next step for accurate recommendations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Cold Room Products */}
        {step === 4 && formData.applicationType === 'coldRoom' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 text-center">
              What will you store?
            </h2>
            <p className="text-base lg:text-lg text-gray-600 mb-8 lg:mb-12 text-center">
              Select products to determine the best operating cycle
            </p>

            <div className="space-y-4 lg:space-y-6">
              {Object.entries(COLD_ROOM_PRODUCTS).map(([key, category]) => (
                <div key={key} className="p-4 lg:p-6 rounded-2xl bg-gray-50 border-2 border-gray-200">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <span className="text-2xl lg:text-3xl">{category.icon}</span>
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {category.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleProduct(item.id)}
                        className={`p-3 lg:p-4 rounded-lg text-left cursor-pointer flex justify-between items-center transition-all ${
                          formData.coldRoomProducts?.includes(item.id)
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-white border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className="text-sm lg:text-base font-medium text-gray-900">{item.name}</span>
                        {item.timing !== "none" && (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-bold flex-shrink-0 ml-2">
                            {item.timing}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 lg:mt-8 p-4 lg:p-6 rounded-xl bg-blue-50 border-2 border-blue-500">
              <div className="flex gap-4">
                <Info className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm lg:text-base">
                    Operating Cycles
                  </h4>
                  <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
                    <strong>Always ON:</strong> Continuous for meat, fish, frozen<br/>
                    <strong>T1:</strong> 1h ON, 1h OFF - For dairy, eggs, leafy vegetables<br/>
                    <strong>T2:</strong> 1h ON, 2h OFF - For yogurt, vegetables, fruits
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Room Sizes */}
        {step === 5 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 text-center">
              Enter {formData.applicationType === 'coldRoom' ? 'volume' : 'area'} for each space
            </h2>
            <p className="text-base lg:text-lg text-gray-600 mb-8 lg:mb-12 text-center">
              {formData.applicationType === 'coldRoom' 
                ? 'Volume (m³) = Length × Width × Height'
                : 'Area (m²) = Length × Width'
              }
            </p>

            <div className="space-y-4 lg:space-y-6">
              {formData.rooms.map((room, idx) => (
                <div key={idx} className="p-6 lg:p-8 rounded-2xl bg-gray-50 border-2 border-gray-200">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
                    {formData.applicationType === 'coldRoom' ? 'Cold Room' : 'Room'} {idx + 1}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2 text-sm lg:text-base">
                        Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => updateRoom(idx, 'name', e.target.value)}
                        placeholder="e.g. Main Storage"
                        className="w-full p-3 lg:p-4 rounded-lg bg-white border border-gray-300 text-base text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-2 text-sm lg:text-base flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-blue-500" />
                        {formData.applicationType === 'coldRoom' ? 'Volume (m³)' : 'Area (m²)'} *
                      </label>
                      <input
                        type="number"
                        value={room.size}
                        onChange={(e) => updateRoom(idx, 'size', e.target.value)}
                        placeholder="Enter size"
                        className="w-full p-3 lg:p-4 rounded-lg bg-white border-2 border-blue-500 text-base font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Results */}
        {step === 6 && recommendations && (
          <div>
            {/* Print Header - Only visible in print */}
            <div className="print-only print-header">
              <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-300">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Wind className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">JONIX Air Sanitization</h1>
                    <p className="text-lg text-gray-600">Device Recommendation Report</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Report ID: {Date.now().toString().slice(-8)}</p>
                </div>
              </div>

              {/* Print Summary */}
              <div className="mb-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Project Summary</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Business Sector</p>
                    <p className="font-bold text-gray-900 capitalize">{formData.sector?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Application Type</p>
                    <p className="font-bold text-gray-900">
                      {formData.applicationType === 'coldRoom' ? 'Cold Rooms' : 
                       formData.applicationType === 'hvac' ? 'HVAC System' : 'Regular Rooms'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Number of Spaces</p>
                    <p className="font-bold text-gray-900">{formData.rooms.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mb-8 lg:mb-12 no-print">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 inline-flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                We Found {recommendations.length} Perfect Solution{recommendations.length > 1 ? 's' : ''}!
              </h2>
              <p className="text-base lg:text-xl text-gray-600">
                Compare options and choose what works best
              </p>
            </div>

            {/* Best Option Badge */}
            {recommendations[0] && (
              <div className="max-w-5xl mx-auto mb-6 lg:mb-8 p-4 lg:p-6 rounded-2xl bg-green-100 border-2 border-green-500 no-print">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 lg:w-8 lg:h-8 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-base lg:text-lg font-bold text-green-800 mb-1">
                      ⭐ BEST RECOMMENDATION
                    </h3>
                    <p className="text-sm lg:text-base text-green-700">
                      <strong>{recommendations[0].name}</strong> - {recommendations[0].reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* All Recommendations */}
            <div className="space-y-6 max-w-5xl mx-auto">
              {recommendations.map((rec, idx) => {
                const isBest = idx === 0;
                const generatorCost = rec.device 
                  ? rec.device.generatorCount * 100 * rec.totalUnits
                  : rec.rooms.reduce((sum, r) => {
                      const devices = r.device ? [r.device] : [];
                      return sum + devices.reduce((s, d) => {
                        const device = Object.values(DEVICES).find(dev => dev.name === d);
                        return s + (device ? device.generatorCount * 100 * (r.qty || 1) : 0);
                      }, 0);
                    }, 0);

                return (
                  <div
                    key={rec.id}
                    className={`print-recommendation p-6 lg:p-8 rounded-2xl shadow-lg transition-all ${
                      isBest 
                        ? 'bg-green-50 border-3 border-green-500' 
                        : 'bg-white border-2 border-gray-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-4 mb-6">
                      <div className="flex-1">
                        {isBest && (
                          <div className="inline-block px-4 py-2 rounded-lg bg-green-200 text-green-800 text-xs font-bold mb-3 border border-green-500">
                            ⭐ BEST OPTION
                          </div>
                        )}
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                          {rec.name}
                        </h3>
                        <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                          {rec.reason}
                        </p>
                        
                        {rec.timingCycle && rec.timingCycle !== "none" && (
                          <div className="mt-4 inline-block px-4 py-2 rounded-lg bg-yellow-100 border border-yellow-500">
                            <span className="text-xs lg:text-sm font-bold text-yellow-800">
                              Cycle: {rec.timingCycle} ({rec.timingCycle === "T1" ? "1h ON, 1h OFF" : "1h ON, 2h OFF"})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-left lg:text-right lg:ml-8 flex-shrink-0">
                        <div className="text-xs lg:text-sm text-gray-600 mb-1">Total Price</div>
                        <div className="text-3xl lg:text-5xl font-bold text-gray-900">
                          €{rec.totalCost.toLocaleString()}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-600 mt-1">
                          {rec.totalUnits} unit{rec.totalUnits > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Room Coverage */}
                    <div className="mb-6 p-4 lg:p-5 rounded-xl bg-gray-50">
                      <h4 className="text-sm lg:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-500" />
                        Coverage Details
                      </h4>
                      <div className="space-y-2">
                        {rec.rooms.map((r, ridx) => (
                          <div key={ridx} className="flex flex-col sm:flex-row sm:justify-between text-xs lg:text-sm gap-1">
                            <span className="text-gray-600">
                              {r.name || `Room ${ridx + 1}`}: {r.size} {formData.applicationType === 'coldRoom' ? 'm³' : 'm²'}
                            </span>
                            {r.device && (
                              <span className="text-blue-500 font-semibold">
                                {r.qty > 1 ? `${r.qty}× ` : ''}{r.device}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Specs */}
                    {rec.device && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
                        <div className="p-3 lg:p-4 rounded-lg bg-gray-50">
                          <Package className="w-5 h-5 text-blue-500 mb-2" />
                          <div className="text-xs text-gray-600 mb-1">Max Coverage</div>
                          <div className="text-base lg:text-lg font-bold text-gray-900">
                            {rec.device.maxCoverage || rec.device.maxVolume} {rec.device.maxVolume ? 'm³' : 'm²'}
                          </div>
                        </div>
                        <div className="p-3 lg:p-4 rounded-lg bg-gray-50">
                          <Wind className="w-5 h-5 text-blue-500 mb-2" />
                          <div className="text-xs text-gray-600 mb-1">Air Flow</div>
                          <div className="text-base lg:text-lg font-bold text-gray-900">
                            {rec.device.airflow} m³/h
                          </div>
                        </div>
                        <div className="p-3 lg:p-4 rounded-lg bg-gray-50">
                          <Info className="w-5 h-5 text-blue-500 mb-2" />
                          <div className="text-xs text-gray-600 mb-1">Power</div>
                          <div className="text-base lg:text-lg font-bold text-gray-900">
                            {rec.device.power}W
                          </div>
                        </div>
                        <div className="p-3 lg:p-4 rounded-lg bg-gray-50">
                          <Wrench className="w-5 h-5 text-blue-500 mb-2" />
                          <div className="text-xs text-gray-600 mb-1">Generators</div>
                          <div className="text-base lg:text-lg font-bold text-gray-900">
                            {rec.device.generatorCount}x
                          </div>
                          <div className="text-xs text-gray-400">{rec.device.generatorType}</div>
                        </div>
                      </div>
                    )}

                    {/* Generator Cost */}
                    <div className="p-4 lg:p-5 rounded-xl bg-yellow-100 border border-yellow-500">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div>
                          <h4 className="text-sm lg:text-base font-bold text-yellow-800 mb-1 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Generator Replacement Cost
                          </h4>
                          <p className="text-xs lg:text-sm text-yellow-700">
                            After 5 years (€100 per generator)
                          </p>
                        </div>
                        <div className="text-2xl lg:text-3xl font-bold text-yellow-800">
                          €{generatorCost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Why JONIX */}
            <div className="max-w-5xl mx-auto mt-8 lg:mt-12 p-6 lg:p-8 rounded-2xl bg-gray-50 border-2 border-gray-200 print-section">
              <h4 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 lg:mb-8 text-center">
                Why Choose JONIX?
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl mb-3">🦠</div>
                  <div className="text-sm lg:text-base font-bold text-gray-900 mb-2">
                    99.99% Efficacy
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600">
                    Eliminates bacteria, viruses, molds
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl mb-3">🌿</div>
                  <div className="text-sm lg:text-base font-bold text-gray-900 mb-2">
                    Chemical-Free
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600">
                    Safe with people present
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl mb-3">⚡</div>
                  <div className="text-sm lg:text-base font-bold text-gray-900 mb-2">
                    Energy Efficient
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600">
                    Low power consumption
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl mb-3">🇮🇹</div>
                  <div className="text-sm lg:text-base font-bold text-gray-900 mb-2">
                    Made in Italy
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600">
                    Patented technology
                  </div>
                </div>
              </div>
            </div>

            {/* Print Footer - Only visible in print */}
            <div className="print-only print-footer">
              <div className="mt-12 pt-8 border-t-2 border-gray-300">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        JONIX S.p.A. Benefit Corporation
                      </p>
                      <p className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Via Dell'Artigianato 1, 35020 S.Pietro Viminario (PD), Italy
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Tel: +39 0429 760311
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        info@jonixair.com
                      </p>
                      <p className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        www.jonixair.com
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Important Notes</h3>
                    <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                      <li>All prices are in EUR and exclude VAT</li>
                      <li>Installation costs not included</li>
                      <li>Recommendations based on provided specifications</li>
                      <li>Contact us for detailed technical specifications</li>
                      <li>Custom solutions available upon request</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 text-center text-xs text-gray-500">
                  <p>This is an automated recommendation. For final quotation, please contact our sales team.</p>
                  <p className="mt-1">© {new Date().getFullYear()} JONIX S.p.A. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step > 0 && step < 6 && (
          <div className="no-print flex justify-center gap-3 lg:gap-4 mt-8 lg:mt-12">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 lg:gap-3 px-6 lg:px-8 py-3 lg:py-4 rounded-xl text-base lg:text-lg font-bold bg-gray-100 text-gray-900 border-2 border-gray-300 cursor-pointer transition-all hover:bg-gray-200"
              >
                <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 lg:gap-3 px-8 lg:px-12 py-3 lg:py-4 rounded-xl text-base lg:text-lg font-bold border-none transition-all ${
                canProceed()
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer shadow-lg shadow-blue-500/40 hover:from-blue-600 hover:to-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {step === 5 ? 'Find Solutions' : 'Continue'}
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
        )}

        {step === 6 && (
          <div className="no-print flex flex-col sm:flex-row justify-center gap-3 lg:gap-4 mt-8 lg:mt-12">
            <button
              onClick={handleReset}
              className="px-6 lg:px-8 py-3 lg:py-4 rounded-xl text-base lg:text-lg font-bold bg-gray-100 text-gray-900 border-2 border-gray-300 cursor-pointer hover:bg-gray-200 transition-all"
            >
              Start New Search
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 lg:gap-3 px-6 lg:px-8 py-3 lg:py-4 rounded-xl text-base lg:text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 text-white border-none cursor-pointer shadow-lg shadow-green-500/40 hover:from-green-600 hover:to-green-700 transition-all"
            >
              <Download className="w-5 h-5 lg:w-6 lg:h-6" />
              Download PDF
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print mt-16 lg:mt-24 py-6 lg:py-8 text-center border-t-2 border-gray-200 text-gray-600 px-4">
        <p className="text-xs lg:text-sm mb-2">
          JONIX S.p.A. Benefit Corporation | Via Dell'Artigianato 1, 35020 S.Pietro Viminario (PD), Italy
        </p>
        <p className="text-xs">
          Tel: +39 0429 760311 | info@jonixair.com | www.jonixair.com
        </p>
      </footer>

      {/* Enhanced Print Styles */}
      <style>{`
        @media print {
          /* Hide non-print elements */
          .no-print {
            display: none !important;
          }

          /* Show print-only elements */
          .print-only {
            display: block !important;
          }

          /* Page setup */
          @page {
            size: A4;
            margin: 20mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Print header styling */
          .print-header {
            margin-bottom: 30px;
          }

          /* Prevent page breaks inside recommendations */
          .print-recommendation {
            page-break-inside: avoid;
            margin-bottom: 30px;
          }

          /* Print section page break handling */
          .print-section {
            page-break-inside: avoid;
          }

          /* Footer on last page */
          .print-footer {
            page-break-before: auto;
          }

          /* Ensure colors print */
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Better table rendering */
          table {
            page-break-inside: avoid;
          }

          /* Improve text readability */
          body {
            font-size: 11pt;
            line-height: 1.4;
          }

          h1 { font-size: 24pt; }
          h2 { font-size: 20pt; }
          h3 { font-size: 16pt; }
          h4 { font-size: 14pt; }
        }

        /* Hide print-only elements by default */
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default App;