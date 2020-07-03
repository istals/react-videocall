import React from 'react';
import PropTypes from 'prop-types';

function MainWindow({robotId }) {
  return (
    <div className="container main-window">
      <div>
        <h3>Robot {robotId} Interface </h3>
      </div>
    </div>
  );
}

MainWindow.propTypes = {
  robotId: PropTypes.string.isRequired
};

export default MainWindow;
