import React, { useState } from 'react';

function Test() {
  const [value, setValue] = useState('');
  
  return (
    <div>
      <select value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="">Wybierz...</option>
        <option value="test1">Test 1</option>
        <option value="test2">Test 2</option>
      </select>
      <p>Wybrano: {value}</p>

      
    </div>
  );
}

export default Test;