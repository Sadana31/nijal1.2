'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function ColumnConfigDrag() {
  const router = useRouter();

  const defaultColumns = [
    { label: 'Shipping Bill', key: 'shippingBillNo' },
    { label: 'Form No', key: 'formNo' },
    { label: 'Shipping Bill Date', key: 'shippingBillDate' },
    { label: 'Port Code', key: 'portCode' },
    { label: 'Bank Name', key: 'bankName' },
    { label: 'Invoice Count', key: 'invoiceCount' },
    { label: 'FOB Currency', key: 'fobCurrency' },
    { label: 'Export Bill Value', key: 'exportBillValue' },
    { label: 'Bill Outstanding Value', key: 'billOutstandingValue' },
    { label: 'Buyer Name', key: 'buyerName' },
    { label: 'Buyer Country Code', key: 'buyerCountryCode' },
    { label: 'Status', key: 'status' },
    ];

  const [availableColumns, setAvailableColumns] = useState([...defaultColumns]);
  const [selectedColumns, setSelectedColumns] = useState([]);

  // Move column to selected
  const selectColumn = (col) => {
    setSelectedColumns([...selectedColumns, col]);
    setAvailableColumns(availableColumns.filter((c) => c !== col));
  };

  // Remove column back to available
  const deselectColumn = (col) => {
    setAvailableColumns([...availableColumns, col]);
    setSelectedColumns(selectedColumns.filter((c) => c !== col));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(selectedColumns);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setSelectedColumns(newOrder);
  };

  const saveConfig = () => {
    localStorage.setItem(
    'sbSelectedColumns',
    JSON.stringify(selectedColumns.map(c => c.key))
    );
    toast.success('Configuration saved!');
    router.push('/'); // Back to SB Dashboard
  };

  const resetConfig = () => {
    setAvailableColumns([...defaultColumns]);
    setSelectedColumns([]);
    toast('Configuration reset!');
  };

  

  return (
    <div className="pl-14 pr-3 py-10 bg-white min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configure Columns</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Available Columns */}
        <div className="flex-1">
          <h2 className="font-semibold mb-2 text-black">Available Columns</h2>
          <div className="border rounded-md p-3 bg-gray-50">
            {availableColumns.map((col) => (
  <div
    key={col.key}
    onClick={() => selectColumn(col)}
    className="cursor-pointer px-3 py-2 rounded hover:bg-blue-100 mb-1 text-black"
  >
    {col.label} {/* use label */}
  </div>
))}

          </div>
        </div>

        {/* Right: Selected Columns */}
        <div className="flex-1">
          <h2 className="font-semibold mb-2 text-black">Selected Columns</h2>
          <DragDropContext onDragEnd={onDragEnd}>
  <Droppable droppableId="selectedColumns" direction="vertical">
    {(provided) => (
      <div
        {...provided.droppableProps}
        ref={provided.innerRef}
        className="border rounded-md p-3 bg-gray-50 min-h-[100px] flex flex-col gap-2"
      >
        {/* Selected Columns */}
{selectedColumns.map((col, idx) => (
  <Draggable key={col.key} draggableId={col.key} index={idx}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`flex items-center justify-between px-3 py-2 rounded bg-white shadow-sm cursor-move
          ${snapshot.isDragging ? 'bg-blue-100' : 'bg-white'}
        `}
      >
        <span className="text-black">{col.label}</span> {/* use label */}
        <button
          onClick={() => deselectColumn(col)}
          className="text-sm px-2 py-0.5 rounded border hover:bg-red-200"
        >
          ×
        </button>
      </div>
    )}
  </Draggable>
))}

        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>

        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={saveConfig}
          className="bg-[#4c94a6] hover:bg-[#417e8e] text-white px-5 py-2 rounded-md shadow font-medium"
        >
          Save Configuration
        </button>
        <button
          onClick={resetConfig}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-md shadow font-medium"
        >
          Reset
        </button>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md shadow font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
