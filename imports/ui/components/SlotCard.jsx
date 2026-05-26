import React from 'react';

export function SlotCard({ slot, onSelect, isSelected }) {
  return (
    <button
      onClick={() => onSelect(slot)}
      style={{
        padding: '12px 20px',
        borderRadius: 8,
        border: '2px solid',
        borderColor: isSelected ? '#6366f1' : '#e5e7eb',
        background: isSelected ? '#6366f1' : '#fff',
        color: isSelected ? '#fff' : '#1f2937',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: 16,
        transition: 'all 0.15s',
        minWidth: 100,
      }}
    >
      🕐 {slot.hour}
    </button>
  );
}
