'use client';

import React, { useState } from 'react';
import { PropertyTypesApi } from '@/types/propertyTypes';
import PropertyCard from './PropertyCard';
import ManagePropertySheet from './ManagePropertySheet';

interface ListingsClientProps {
  initialProperties: PropertyTypesApi[];
    availableTemplates: any[];
}

export default function ListingsClient({ initialProperties, availableTemplates }: ListingsClientProps) {
  // This state will eventually hold the selected property for our Manage Sheet!
  const [selectedProperty, setSelectedProperty] = useState<PropertyTypesApi | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleManageClick = (property: PropertyTypesApi) => {
    // For now, we just log it. In the next step, this will open the Slide-Sheet!
    // console.log("Opening manage sheet for:", property.title);
    setSelectedProperty(property);
    setIsSheetOpen(true);
  };

  return (
    <div className="w-full">
      
      {initialProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-white/50 text-center">
          <p className="text-lg font-bold text-foreground mb-1">No properties found</p>
          <p className="text-sm text-muted-foreground mb-4">Add your first property to start managing syncs and tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {initialProperties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              onManage={() => handleManageClick(property)} 
            />
          ))}
        </div>
      )}

      {/* Placeholder for the ManagePropertySheet we will build next */}
      <ManagePropertySheet 
          isOpen={isSheetOpen} 
          onOpenChange={setIsSheetOpen} 
          property={selectedProperty}
          availableTemplates={availableTemplates}
        /> 
     
    </div>
  );
}