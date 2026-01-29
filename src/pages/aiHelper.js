import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Download, CheckCircle2, Info, Building2, Snowflake, Wind, Users, Calculator, Package, Wrench, Shield, Plus, Minus, Home, DollarSign } from 'lucide-react';

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

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '2px solid #e5e7eb',
        background: '#ffffff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              <Wind style={{ width: '32px', height: '32px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                JONIX Device Finder
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Find Your Perfect Air Sanitization Solution
              </p>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Progress Bar */}
        {step < 6 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              {[1, 2, 3, 4, 5].map((s) => {
                if (s === 4 && formData.applicationType !== 'coldRoom') return null;
                
                const isActive = s === step;
                const isComplete = s < step;
                const displayStep = formData.applicationType === 'coldRoom' ? s : (s <= 3 ? s : s - 1);
                
                return (
                  <React.Fragment key={s}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      background: isActive || isComplete ? '#3b82f6' : '#e5e7eb',
                      color: isActive || isComplete ? 'white' : '#9ca3af',
                      boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
                      transition: 'all 0.3s'
                    }}>
                      {isComplete ? <CheckCircle2 style={{ width: '24px', height: '24px' }} /> : displayStep}
                    </div>
                    {s < 5 && (s !== 4 || formData.applicationType === 'coldRoom') && (
                      <div style={{
                        height: '4px',
                        width: '80px',
                        borderRadius: '2px',
                        background: s < step ? '#3b82f6' : '#e5e7eb'
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Business Sector */}
        {step === 1 && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '42px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px', textAlign: 'center' }}>
              What's your business sector?
            </h2>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '48px', textAlign: 'center' }}>
              This helps us recommend the best device for your needs
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {[
                { id: 'healthcare', icon: Users, label: 'Healthcare', desc: 'Hospitals, clinics, medical facilities', color: '#10b981' },
                { id: 'food', icon: Snowflake, label: 'Food Industry', desc: 'Restaurants, food processing, storage', color: '#f59e0b' },
                { id: 'hospitality', icon: Building2, label: 'Hospitality', desc: 'Hotels, offices, commercial spaces', color: '#8b5cf6' },
                { id: 'retail', icon: Building2, label: 'Retail', desc: 'Shops, supermarkets, stores', color: '#3b82f6' }
              ].map(({ id, icon: Icon, label, desc, color }) => (
                <button
                  key={id}
                  onClick={() => setFormData({ ...formData, sector: id })}
                  style={{
                    padding: '32px',
                    borderRadius: '16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: formData.sector === id ? '#f0f9ff' : '#ffffff',
                    border: formData.sector === id ? `3px solid ${color}` : '2px solid #e5e7eb',
                    boxShadow: formData.sector === id ? '0 8px 24px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <Icon style={{ width: '48px', height: '48px', color, marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                    {label}
                  </h3>
                  <p style={{ fontSize: '16px', color: '#6b7280' }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Application Type */}
        {step === 2 && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '42px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px', textAlign: 'center' }}>
              What type of space?
            </h2>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '48px', textAlign: 'center' }}>
              Choose the application type
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {[
                { id: 'coldRoom', icon: Snowflake, label: 'Cold Rooms', desc: 'Refrigerated storage', color: '#06b6d4' },
                { id: 'room', icon: Building2, label: 'Regular Rooms', desc: 'Offices, clinics, spaces', color: '#8b5cf6' },
                { id: 'hvac', icon: Wind, label: 'HVAC System', desc: 'Air duct integration', color: '#10b981' }
              ].map(({ id, icon: Icon, label, desc, color }) => (
                <button
                  key={id}
                  onClick={() => setFormData({ ...formData, applicationType: id })}
                  style={{
                    padding: '32px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: formData.applicationType === id ? '#f0f9ff' : '#ffffff',
                    border: formData.applicationType === id ? `3px solid ${color}` : '2px solid #e5e7eb',
                    boxShadow: formData.applicationType === id ? '0 8px 24px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <Icon style={{ width: '48px', height: '48px', color, marginBottom: '16px', marginLeft: 'auto', marginRight: 'auto' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                    {label}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Number of Rooms */}
        {step === 3 && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '42px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px', textAlign: 'center' }}>
              How many {formData.applicationType === 'coldRoom' ? 'cold rooms' : formData.applicationType === 'hvac' ? 'zones' : 'rooms'}?
            </h2>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '48px', textAlign: 'center' }}>
              Enter the number of spaces you need to protect
            </p>

            <div style={{ 
              padding: '48px', 
              borderRadius: '16px', 
              background: '#f9fafb',
              border: '2px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <button
                  onClick={() => setFormData({ ...formData, numberOfRooms: Math.max(1, formData.numberOfRooms - 1) })}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#3b82f6',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <Minus style={{ width: '32px', height: '32px', color: 'white' }} />
                </button>

                <input
                  type="number"
                  min="1"
                  value={formData.numberOfRooms}
                  onChange={(e) => setFormData({ ...formData, numberOfRooms: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{
                    flex: 1,
                    padding: '24px',
                    borderRadius: '12px',
                    fontSize: '64px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    background: 'white',
                    border: '2px solid #d1d5db',
                    color: '#1f2937'
                  }}
                />

                <button
                  onClick={() => setFormData({ ...formData, numberOfRooms: formData.numberOfRooms + 1 })}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#3b82f6',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <Plus style={{ width: '32px', height: '32px', color: 'white' }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Cold Room Products */}
        {step === 4 && formData.applicationType === 'coldRoom' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '42px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px', textAlign: 'center' }}>
              What will you store?
            </h2>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '48px', textAlign: 'center' }}>
              Select products to determine the best operating cycle
            </p>

            <div style={{ display: 'grid', gap: '24px' }}>
              {Object.entries(COLD_ROOM_PRODUCTS).map(([key, category]) => (
                <div key={key} style={{ 
                  padding: '24px', 
                  borderRadius: '16px', 
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '36px' }}>{category.icon}</span>
                    {category.name}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {category.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleProduct(item.id)}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: formData.coldRoomProducts?.includes(item.id) ? '#dbeafe' : 'white',
                          border: formData.coldRoomProducts?.includes(item.id) ? '2px solid #3b82f6' : '1px solid #d1d5db',
                          color: '#1f2937'
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</span>
                        {item.timing !== "none" && (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: '#fef3c7',
                            color: '#92400e',
                            fontWeight: 'bold'
                          }}>
                            {item.timing}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', padding: '24px', borderRadius: '12px', background: '#eff6ff', border: '2px solid #3b82f6' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Info style={{ width: '24px', height: '24px', color: '#3b82f6', flexShrink: 0, marginTop: '4px' }} />
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '8px', fontSize: '16px' }}>
                    Operating Cycles
                  </h4>
                  <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
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
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '42px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px', textAlign: 'center' }}>
              Enter {formData.applicationType === 'coldRoom' ? 'volume' : 'area'} for each space
            </h2>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '48px', textAlign: 'center' }}>
              {formData.applicationType === 'coldRoom' 
                ? 'Volume (m³) = Length × Width × Height'
                : 'Area (m²) = Length × Width'
              }
            </p>

            <div style={{ display: 'grid', gap: '24px' }}>
              {formData.rooms.map((room, idx) => (
                <div key={idx} style={{ 
                  padding: '32px', 
                  borderRadius: '16px', 
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>
                    {formData.applicationType === 'coldRoom' ? 'Cold Room' : 'Room'} {idx + 1}
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '14px' }}>
                        Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => updateRoom(idx, 'name', e.target.value)}
                        placeholder="e.g. Main Storage"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: 'white',
                          border: '1px solid #d1d5db',
                          fontSize: '16px',
                          color: '#1f2937',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calculator style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                        {formData.applicationType === 'coldRoom' ? 'Volume (m³)' : 'Area (m²)'} *
                      </label>
                      <input
                        type="number"
                        value={room.size}
                        onChange={(e) => updateRoom(idx, 'size', e.target.value)}
                        placeholder="Enter size"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: 'white',
                          border: '2px solid #3b82f6',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#1f2937',
                          boxSizing: 'border-box'
                        }}
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
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
              }}>
                <CheckCircle2 style={{ width: '48px', height: '48px', color: 'white' }} />
              </div>
              <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>
                We Found {recommendations.length} Perfect Solution{recommendations.length > 1 ? 's' : ''}!
              </h2>
              <p style={{ fontSize: '20px', color: '#6b7280' }}>
                Compare options and choose what works best
              </p>
            </div>

            {/* Best Option Badge */}
            {recommendations[0] && (
              <div style={{ 
                maxWidth: '900px', 
                margin: '0 auto 32px', 
                padding: '24px', 
                borderRadius: '16px', 
                background: '#d1fae5',
                border: '2px solid #10b981'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <CheckCircle2 style={{ width: '32px', height: '32px', color: '#10b981' }} />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#065f46', marginBottom: '4px' }}>
                      ⭐ BEST RECOMMENDATION
                    </h3>
                    <p style={{ fontSize: '16px', color: '#047857', margin: 0 }}>
                      <strong>{recommendations[0].name}</strong> - {recommendations[0].reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* All Recommendations */}
            <div style={{ display: 'grid', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
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
                    style={{
                      padding: '32px',
                      borderRadius: '16px',
                      background: isBest ? '#f0fdf4' : '#ffffff',
                      border: isBest ? '3px solid #10b981' : '2px solid #e5e7eb',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                      <div style={{ flex: 1 }}>
                        {isBest && (
                          <div style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: '#d1fae5',
                            color: '#065f46',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            border: '1px solid #10b981'
                          }}>
                            ⭐ BEST OPTION
                          </div>
                        )}
                        <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                          {rec.name}
                        </h3>
                        <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
                          {rec.reason}
                        </p>
                        
                        {rec.timingCycle && rec.timingCycle !== "none" && (
                          <div style={{
                            marginTop: '16px',
                            display: 'inline-block',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: '#fef3c7',
                            border: '1px solid #f59e0b'
                          }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>
                              Cycle: {rec.timingCycle} ({rec.timingCycle === "T1" ? "1h ON, 1h OFF" : "1h ON, 2h OFF"})
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right', marginLeft: '32px' }}>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Price</div>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1f2937' }}>
                          €{rec.totalCost.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {rec.totalUnits} unit{rec.totalUnits > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Room Coverage */}
                    <div style={{ marginBottom: '24px', padding: '20px', borderRadius: '12px', background: '#f9fafb' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Home style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                        Coverage Details
                      </h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {rec.rooms.map((r, ridx) => (
                          <div key={ridx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span style={{ color: '#4b5563' }}>
                              {r.name || `Room ${ridx + 1}`}: {r.size} {formData.applicationType === 'coldRoom' ? 'm³' : 'm²'}
                            </span>
                            {r.device && (
                              <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                                {r.qty > 1 ? `${r.qty}× ` : ''}{r.device}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Specs */}
                    {rec.device && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ padding: '16px', borderRadius: '8px', background: '#f9fafb' }}>
                          <Package style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '8px' }} />
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Max Coverage</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                            {rec.device.maxCoverage || rec.device.maxVolume} {rec.device.maxVolume ? 'm³' : 'm²'}
                          </div>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '8px', background: '#f9fafb' }}>
                          <Wind style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '8px' }} />
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Air Flow</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                            {rec.device.airflow} m³/h
                          </div>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '8px', background: '#f9fafb' }}>
                          <Info style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '8px' }} />
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Power</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                            {rec.device.power}W
                          </div>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '8px', background: '#f9fafb' }}>
                          <Wrench style={{ width: '20px', height: '20px', color: '#3b82f6', marginBottom: '8px' }} />
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Generators</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                            {rec.device.generatorCount}x
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{rec.device.generatorType}</div>
                        </div>
                      </div>
                    )}

                    {/* Generator Cost */}
                    <div style={{ padding: '20px', borderRadius: '12px', background: '#fef3c7', border: '1px solid #f59e0b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield style={{ width: '20px', height: '20px' }} />
                            Generator Replacement Cost
                          </h4>
                          <p style={{ fontSize: '14px', color: '#78350f', margin: 0 }}>
                            After 5 years (€100 per generator)
                          </p>
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400e' }}>
                          €{generatorCost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Why JONIX */}
            <div style={{ maxWidth: '900px', margin: '48px auto 0', padding: '32px', borderRadius: '16px', background: '#f9fafb', border: '2px solid #e5e7eb' }}>
              <h4 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '32px', textAlign: 'center' }}>
                Why Choose JONIX?
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🦠</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                    99.99% Efficacy
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Eliminates bacteria, viruses, molds
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌿</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                    Chemical-Free
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Safe with people present
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚡</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                    Energy Efficient
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Low power consumption
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🇮🇹</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                    Made in Italy
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Patented technology
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step > 0 && step < 6 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
            {step > 1 && (
              <button
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: '#f3f4f6',
                  color: '#1f2937',
                  border: '2px solid #d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <ChevronLeft style={{ width: '24px', height: '24px' }} />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 48px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: canProceed() ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#e5e7eb',
                color: 'white',
                border: 'none',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                boxShadow: canProceed() ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
                transition: 'all 0.3s',
                opacity: canProceed() ? 1 : 0.5
              }}
            >
              {step === 5 ? 'Find Solutions' : 'Continue'}
              <ChevronRight style={{ width: '24px', height: '24px' }} />
            </button>
          </div>
        )}

        {step === 6 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
            <button
              onClick={handleReset}
              style={{
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: '#f3f4f6',
                color: '#1f2937',
                border: '2px solid #d1d5db',
                cursor: 'pointer'
              }}
            >
              Start New Search
            </button>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Download style={{ width: '24px', height: '24px' }} />
              Download PDF
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ 
        marginTop: '96px', 
        padding: '32px 24px', 
        textAlign: 'center', 
        borderTop: '2px solid #e5e7eb',
        color: '#6b7280'
      }}>
        <p style={{ fontSize: '14px', marginBottom: '8px' }}>
          JONIX S.p.A. Benefit Corporation | Via Dell'Artigianato 1, 35020 S.Pietro Viminario (PD), Italy
        </p>
        <p style={{ fontSize: '12px' }}>
          Tel: +39 0429 760311 | info@jonixair.com | www.jonixair.com
        </p>
      </footer>

      {/* Print Styles */}
      <style>{`
        @media print {
          header, footer, button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;