import React from 'react';
import './Spots.css'; 

const Spots = () => {
  return (
    <>
      <div className="spot spot-top-left" data-speed="0" />
      <div className="spot spot-top-right" data-speed="0" />
      <div className="spot spot-bottom-left" data-speed="0" />
      <div className="spot spot-bottom-right" data-speed="0" />
    </>
  );
};

export default Spots;
