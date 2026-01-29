import React from "react";

export const ProductCatalogPage = () => {
  return (
    <div className="container mx-auto px-6 py-10 space-y-10">

      {/* Header */}
      <header className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Sales Commission & Product Catalog
        </h1>
        <p className="text-gray-600 mt-2">
          Detailed commission plan and available Jonix devices
        </p>
        <a
          href="https://jonixair.com/en"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Official JonixAir Website
        </a>
      </header>

      {/* Commission & Promotion Plan */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Commission & Promotion Plan
        </h2>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <h3 className="font-bold text-lg">Entry Level: Sales Team Member</h3>
          <p>• Start as a Sales Team Member</p>
          <p>• First 5 closed deals: 5% commission per deal</p>
          <p>
            • If 5 deals closed within 4 months: 10% on the 5th deal
          </p>
          <p>• After 5 deals → eligible for promotion to Team Leader</p>

          <h3 className="font-bold text-lg mt-4">Team Leader</h3>
          <p>• 5 members required under your team</p>
          <p>• Train and support members</p>
          <p>• Manage team performance</p>

          <p className="font-semibold mt-4">Commission Summary</p>
          <table className="w-full text-left border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Role</th>
                <th className="border px-4 py-2">Situation</th>
                <th className="border px-4 py-2">Commission</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">Sales Member</td>
                <td className="border px-4 py-2">Regular deal</td>
                <td className="border px-4 py-2">5%</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Sales Member</td>
                <td className="border px-4 py-2">5th deal in 4 months</td>
                <td className="border px-4 py-2">10%</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Team Leader</td>
                <td className="border px-4 py-2">Team member deal</td>
                <td className="border px-4 py-2">5%</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Team Leader</td>
                <td className="border px-4 py-2">Own deal</td>
                <td className="border px-4 py-2">10%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Product Catalog */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Jonix Devices Product Catalog
        </h2>

        {/* Product: Cube Professional */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
          <h3 className="text-xl font-bold">1) JONIX CUBE PROFESSIONAL</h3>
          <p className="text-gray-600 font-semibold">Price: €2,000</p>

          <p className="font-semibold">Intended Use:</p>
          <ul className="list-disc list-inside">
            <li>Medical environments (clinics, surgeries, dental, etc.)</li>
            <li>Beauty centers and waiting areas</li>
            <li>Enclosed medical spaces</li>
          </ul>

          <p className="font-semibold">Technical Specifications:</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>Dimensions: 215 × 215 × 260 mm</li>
            <li>Weight: 2.8 kg</li>
            <li>Airflow: 40 m³/h</li>
            <li>Coverage: Up to 85 m²</li>
            <li>Power: 10 W / 230 V – 50 Hz</li>
            <li>Finish: Stainless steel</li>
          </ul>

          <p className="font-semibold">Important Notes:</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>Cold plasma ionization technology</li>
            <li>Silent operation</li>
            <li>Low energy consumption</li>
            <li>No filters to replace</li>
          </ul>
        </div>

        {/* Product: JONIX STEEL 4C */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
          <h3 className="text-xl font-bold">2) JONIX STEEL 4C</h3>
          <p className="text-gray-600 font-semibold">Price: €6,000</p>

          <p className="font-semibold">Intended Use:</p>
          <ul className="list-disc list-inside">
            <li>Food processing facilities</li>
            <li>Cold rooms & restaurants</li>
            <li>High-traffic venues</li>
          </ul>

          <p className="font-semibold">Technical Specifications:</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>Dimensions: 320 × 260 × 400 mm</li>
            <li>Weight: 9 kg</li>
            <li>Airflow: 160 m³/h</li>
            <li>Coverage: Up to 500 m²</li>
            <li>Power: 37 W / 230 V – 50 Hz</li>
          </ul>

          <p className="font-semibold">Important Notes:</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>Industrial-grade construction</li>
            <li>Food-safe sanitisation</li>
            <li>High ion output</li>
            <li>Continuous disinfection</li>
          </ul>
        </div>

        {/* Product: JONIX DUCT 2F */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
          <h3 className="text-xl font-bold">3) JONIX DUCT 2F</h3>
          <p className="text-gray-600 font-semibold">Price: €2,000</p>

          <p className="font-semibold">Intended Use:</p>
          <ul className="list-disc list-inside">
            <li>HVAC & ventilation ducts</li>
            <li>Medium-size facilities</li>
            <li>Offices, clinics, gyms</li>
          </ul>

          <p className="font-semibold">Technical Specifications:</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>Dimensions: 290 × 350 × 700 mm</li>
            <li>Weight: 5 kg</li>
            <li>Airflow: Up to 2,000 m³/h</li>
            <li>Power: 20 W / 230 V – 50 Hz</li>
          </ul>

          <p className="font-semibold">Important Notes:</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>Installed inside air ducts</li>
            <li>Treats all supplied air</li>
            <li>Ideal for HVAC systems</li>
          </ul>
        </div>

        {/* Product: JONIX DUCT 4F */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
          <h3 className="text-xl font-bold">4) JONIX DUCT 4F</h3>
          <p className="text-gray-600 font-semibold">Price: €4,000</p>

          <p className="font-semibold">Intended Use:</p>
          <ul className="list-disc list-inside">
            <li>Large HVAC systems</li>
            <li>Commercial & industrial buildings</li>
            <li>Malls and hospitals</li>
          </ul>

          <p className="font-semibold">Technical Specifications:</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>Dimensions: 290 × 350 × 700 mm</li>
            <li>Weight: 6 kg</li>
            <li>Airflow: Up to 4,000 m³/h</li>
            <li>Power: 40 W / 230 V – 50 Hz</li>
          </ul>

          <p className="font-semibold">Important Notes:</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>Designed for large air volumes</li>
            <li>Multi-room coverage</li>
            <li>Low operating cost</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ProductCatalogPage;
