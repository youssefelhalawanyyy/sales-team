import React, { useState } from 'react';

export default function DealEditor({
  deal,
  onSave,
  onClose
}) {
  const [data, setData] = useState({ ...deal });

  function update(k, v) {
    setData({ ...data, [k]: v });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">

      <div className="bg-white p-6 rounded-lg w-full max-w-lg">

        <h2 className="text-xl font-bold mb-4">
          Edit Deal
        </h2>

        <input
          className="w-full border p-2 mb-2 rounded"
          value={data.businessName}
          onChange={e =>
            update('businessName', e.target.value)
          }
        />

        <input
          className="w-full border p-2 mb-2 rounded"
          value={data.phoneNumber}
          onChange={e =>
            update('phoneNumber', e.target.value)
          }
        />

        <textarea
          className="w-full border p-2 mb-2 rounded"
          value={data.notes}
          onChange={e =>
            update('notes', e.target.value)
          }
        />

        <div className="flex justify-end gap-2">

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(data)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>

        </div>
      </div>
    </div>
  );
}
