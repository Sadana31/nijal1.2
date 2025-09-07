'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function IRMColumnConfig() {
  const router = useRouter();

  const defaultColumns = [
    'Remittance Ref No',
    'Bank Name',
    'IE Code',
    'Remittance Date',
    'Remittance Amount',
    'Outstanding Amount',
    'Remitter Name',
    'Status',
    'AD Code',
    'Purpose Code',
    'Remittance Currency',
    'Utilized Amount',
    'Remitter Address',
    'Remitter Country Code',
    'Remitter Bank',
    'Other Bank Ref Number',
  ];

  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('irmSelectedColumns');
    if (saved) {
      const savedColumns = JSON.parse(saved);
      setSelectedColumns(savedColumns);
      setAvailableColumns(defaultColumns.filter(col => !savedColumns.includes(col)));
    } else {
      setAvailableColumns([...defaultColumns]);
      setSelectedColumns([]);
    }
  }, []);

  const selectColumn = (col) => {
    setSelectedColumns([...selectedColumns, col]);
    setAvailableColumns(availableColumns.filter(c => c !== col));
  };

  const deselectColumn = (col) => {
    setAvailableColumns([...availableColumns, col]);
    setSelectedColumns(selectedColumns.filter(c => c !== col));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(selectedColumns);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setSelectedColumns(newOrder);
  };

  const saveConfig = () => {
    localStorage.setItem('irmSelectedColumns', JSON.stringify(selectedColumns));
    toast.success('Configuration saved!');
    router.push('/irm'); // Back to IRM dashboard
  };

  const resetConfig = () => {
    setAvailableColumns([...defaultColumns]);
    setSelectedColumns([]);
    localStorage.removeItem('irmSelectedColumns');
    toast('Configuration reset!');
  };

  return (
    <div className="pl-14 pr-3 py-10 bg-white min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configure IRM Columns</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Available Columns */}
        <div className="flex-1">
          <h2 className="font-semibold mb-2 text-black">Available Columns</h2>
          <div className="border rounded-md p-3 bg-gray-50">
            {availableColumns.map(col => (
              <div
                key={col}
                onClick={() => selectColumn(col)}
                className="cursor-pointer px-3 py-2 rounded hover:bg-blue-100 mb-1 text-black"
              >
                {col}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Columns */}
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
                  {selectedColumns.map((col, idx) => (
                    <Draggable key={col} draggableId={col} index={idx}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center justify-between px-3 py-2 rounded bg-white shadow-sm cursor-move
                            ${snapshot.isDragging ? 'bg-blue-100' : 'bg-white'}`}
                        >
                          <span className="text-black">{col}</span>
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
