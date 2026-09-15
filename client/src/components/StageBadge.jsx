/**
 * components/StageBadge.jsx
 * 
 * Renders a color-coded status badge for conversion pipeline stages.
 */

import React from 'react';

const STAGE_CONFIG = {
  PENDING: { label: 'Pending', icon: '⏳' },
  TEXT_EXTRACTION: { label: 'Text Extracted', icon: '📄' },
  BRAILLE_TRANSLATION: { label: 'Braille Translated', icon: '⠿' },
  PROOFREADING: { label: 'Proofreading', icon: '✏️' },
  EMBOSSING: { label: 'In Print Queue', icon: '🖨️' },
  DONE: { label: 'Completed', icon: '✅' }
};

export const StageBadge = ({ stage }) => {
  const config = STAGE_CONFIG[stage] || { label: stage, icon: '•' };

  return (
    <span className={`stage-badge stage-${stage}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default StageBadge;
