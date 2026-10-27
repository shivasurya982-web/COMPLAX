import React from 'react';

const PriorityBadge = ({ priority }) => {
  return (
    <span className={`badge badge-${priority.toLowerCase()}`}>
      {priority}
    </span>
  );
};

export default PriorityBadge;
