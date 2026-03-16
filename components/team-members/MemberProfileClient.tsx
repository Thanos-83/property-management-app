'use client';

import React, { useState } from 'react';
import { MemberProfileDisplay } from './MemberProfileDisplay';
import { MemberProfileEdit } from './MemberProfileEdit';

interface MemberProfileClientProps {
  profile: any;
}

export function MemberProfileClient({ profile }: MemberProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Simple, elegant component swapping based on state!
  if (isEditing) {
    return (
      <MemberProfileEdit 
        profile={profile} 
        onCancel={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <MemberProfileDisplay 
      profile={profile} 
      onEdit={() => setIsEditing(true)} 
    />
  );
}