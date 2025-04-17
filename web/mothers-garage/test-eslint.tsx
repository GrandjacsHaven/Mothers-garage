import React from 'react';

export default function TestComponent() {
  return (
    <div>
      <p>
        This is a paragraph with a div inside, which is invalid HTML and causes hydration errors
        <div>This div is inside a paragraph</div>
      </p>
    </div>
  );
}