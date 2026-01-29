import React, { useState } from "react";
import {
  ExternalLink,
  Award,
  TrendingUp,
  Users,
  Crown,
  Target,
  Sparkles,
  Wind,
  Zap,
  Shield,
  Thermometer,
  Building2,
  Stethoscope,
  UtensilsCrossed,
  AirVent,
  ChevronRight,
  Check,
  Info
} from "lucide-react";

export const ProductCatalogPage = () => {
  const [activeTab, setActiveTab] = useState("commission");

  const products = [
    {
      id: 1,
      name: "JONIX CUBE PROFESSIONAL",
      price: "€2,000",
      icon: Stethoscope,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      uses: [
        "Medical environments (clinics, surgeries, dental, etc.)",
        "Beauty centers and waiting areas",
        "Enclosed medical spaces"
      ],
      specs: [
        { label: "Dimensions", value: "215 × 215 × 260 mm" },
        { label: "Weight", value: "2.8 kg" },
        { label: "Airflow", value: "40 m³/h" },
        { label: "Coverage", value: "Up to 85 m²" },
        { label: "Power", value: "10 W / 230 V – 50 Hz" },
        { label: "Finish", value: "Stainless steel" }
      ],
      features: [
        "Cold plasma ionization technology",
        "Silent operation",
        "Low energy consumption",
        "No filters to replace"
      ]
    },
    {
      id: 2,
      name: "JONIX STEEL 4C",
      price: "€6,000",
      icon: UtensilsCrossed,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      uses: [
        "Food processing facilities",
        "Cold rooms & restaurants",
        "High-traffic venues"
      ],
      specs: [
        { label: "Dimensions", value: "320 × 260 × 400 mm" },
        { label: "Weight", value: "9 kg" },
        { label: "Airflow", value: "160 m³/h" },
        { label: "Coverage", value: "Up to 500 m²" },
        { label: "Power", value: "37 W / 230 V – 50 Hz" }
      ],
      features: [
        "Industrial-grade construction",
        "Food-safe sanitisation",
        "High ion output",
        "Continuous disinfection"
      ]
    },
    {
      id: 3,
      name: "JONIX DUCT 2F",
      price: "€2,000",
      icon: AirVent,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      uses: [
        "HVAC & ventilation ducts",
        "Medium-size facilities",
        "Offices, clinics, gyms"
      ],
      specs: [
        { label: "Dimensions", value: "290 × 350 × 700 mm" },
        { label: "Weight", value: "5 kg" },
        { label: "Airflow", value: "Up to 2,000 m³/h" },
        { label: "Power", value: "20 W / 230 V – 50 Hz" }
      ],
      features: [
        "Installed inside air ducts",
        "Treats all supplied air",
        "Ideal for HVAC systems"
      ]
    },
    {
      id: 4,
      name: "JONIX DUCT 4F",
      price: "€4,000",
      icon: Building2,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
      uses: [
        "Large HVAC systems",
        "Commercial & industrial buildings",
        "Malls and hospitals"
      ],
      specs: [
        { label: "Dimensions", value: "290 × 350 × 700 mm" },
        { label: "Weight", value: "6 kg" },
        { label: "Airflow", value: "Up to 4,000 m³/h" },
        { label: "Power", value: "40 W / 230 V – 50 Hz" }
      ],
      features: [
        "Designed for large air volumes",
        "Multi-room coverage",
        "Low operating cost"
      ]
    }
  ];

  const commissionData = [
    { role: "Sales Member", situation: "Regular deal", commission: "5%", color: "blue" },
    { role: "Sales Member", situation: "5th deal in 4 months", commission: "10%", color: "green" },
    { role: "Team Leader", situation: "Team member deal", commission: "5%", color: "purple" },
    { role: "Team Leader", situation: "Own deal", commission: "10%", color: "orange" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-10">
      
      <div className="space-y-8">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-12 text-white shadow-2xl overflow-hidden animate-fadeInDown">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-10 h-10 text-yellow-300 animate-pulse" />
              <h1 className="text-4xl lg:text-5xl font-bold">
                Sales Commission & Product Catalog
              </h1>
              <Sparkles className="w-10 h-10 text-yellow-300 animate-pulse" />
            </div>
            
            <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
              Detailed commission plan and complete JONIX air purification devices catalog
            </p>

            <a
              href="https://jonixair.com/en"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <ExternalLink className="w-5 h-5" />
              Visit Official JonixAir Website
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex bg-white rounded-2xl shadow-lg p-2 border border-gray-200">
            <button
              onClick={() => setActiveTab("commission")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "commission"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Award className="w-5 h-5" />
              Commission Plan
            </button>
            
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "products"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Wind className="w-5 h-5" />
              Products ({products.length})
            </button>
          </div>
        </div>

        {/* Commission Plan Section */}
        {activeTab === "commission" && (
          <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            
            {/* Career Path */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Commission & Promotion Plan
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Entry Level */}
                <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Entry Level: Sales Team Member</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">Start as a Sales Team Member</p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">First 5 closed deals: <span className="font-bold text-blue-600">5% commission</span> per deal</p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">If 5 deals closed within 4 months: <span className="font-bold text-green-600">10% on the 5th deal</span></p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">After 5 deals → eligible for <span className="font-bold text-purple-600">promotion to Team Leader</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Leader */}
                <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Team Leader</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700"><span className="font-bold text-purple-600">5 members</span> required under your team</p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">Train and support team members</p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">Manage team performance</p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">Earn from <span className="font-bold text-purple-600">your deals + team deals</span></p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Commission Table */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-green-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                    <Award className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Commission Summary</h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Situation</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commissionData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                            {row.role === "Team Leader" ? <Crown className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            {row.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{row.situation}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r ${
                            row.commission === "10%" 
                              ? "from-green-500 to-emerald-500" 
                              : "from-blue-500 to-cyan-500"
                          } text-white rounded-full font-bold text-lg shadow-lg`}>
                            <TrendingUp className="w-4 h-4" />
                            {row.commission}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-4 border-t border-blue-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Note:</span> Commissions are calculated based on the total deal value and are paid upon successful deal closure.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Products Section */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                JONIX Air Purification Devices
              </h2>
              <p className="text-gray-600">Advanced cold plasma ionization technology for healthier spaces</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {products.map((product, idx) => {
                const Icon = product.icon;
                
                return (
                  <div 
                    key={product.id}
                    className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 animate-scaleIn"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    
                    {/* Header */}
                    <div className={`relative bg-gradient-to-r ${product.gradient} p-8`}>
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-2xl"></div>
                      </div>

                      <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-3 border border-white/30">
                            <span className="text-white text-sm font-semibold">Product #{product.id}</span>
                          </div>
                          
                          <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white">{product.price}</span>
                          </div>
                        </div>

                        <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                          <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-6">
                      
                      {/* Intended Use */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-5 h-5 text-gray-600" />
                          <h4 className="font-bold text-gray-900 text-lg">Intended Use</h4>
                        </div>
                        <div className="space-y-2">
                          {product.uses.map((use, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-700">{use}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Technical Specifications */}
                      <div className={`bg-gradient-to-br ${product.bgGradient} rounded-2xl p-6 border border-gray-200`}>
                        <div className="flex items-center gap-2 mb-4">
                          <Zap className="w-5 h-5 text-gray-600" />
                          <h4 className="font-bold text-gray-900 text-lg">Technical Specifications</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {product.specs.map((spec, i) => (
                            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50">
                              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">{spec.label}</p>
                              <p className="text-sm font-bold text-gray-900">{spec.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Key Features */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-5 h-5 text-gray-600" />
                          <h4 className="font-bold text-gray-900 text-lg">Key Features</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {product.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${product.gradient}`}></div>
                              <p className="text-sm text-gray-700 font-medium">{feature}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className={`bg-gradient-to-r ${product.bgGradient} px-8 py-4 border-t border-gray-200`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 font-medium">Advanced cold plasma technology</p>
                        <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                          <Sparkles className="w-4 h-4" />
                          Premium Quality
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

      {/* Styles */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>

    </div>
  );
};

export default ProductCatalogPage;