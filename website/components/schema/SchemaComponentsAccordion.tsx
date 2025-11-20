'use client';

import { useState } from 'react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  borderColor: string;
  bgColor: string;
}

function AccordionItem({ title, children, isOpen, onToggle, borderColor, bgColor }: AccordionItemProps) {
  return (
    <div className={`bg-white rounded-lg border-l-4 ${borderColor} shadow-md transition-all`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-200">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface SchemaComponentsAccordionProps {
  items: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
    borderColor: string;
  }>;
}

export function SchemaComponentsAccordion({ items }: SchemaComponentsAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set([items[0]?.id]));

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          title={item.title}
          isOpen={openItems.has(item.id)}
          onToggle={() => toggleItem(item.id)}
          borderColor={item.borderColor}
          bgColor="bg-white"
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

