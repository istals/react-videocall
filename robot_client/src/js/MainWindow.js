import React from 'react';
import PropTypes from 'prop-types';

function MainWindow({robotId, requestBT,  btConnectedStatus}) {

    /**
   * Start the call with or without video
   * @param {Boolean} video
   */
  const requestBTInline = () => {
    return () => requestBT()
  };


  return (
    <div className="container main-window">
      <div>
        <h3>Robot {robotId} Interface
        { !btConnectedStatus && (
          <>
            <button
              type="button"
              className="btn-action fa fa-bluetooth-b"
              onClick={requestBTInline()}
            />
          </>
        )}
        </h3>
      </div>
    </div>
  );
}

MainWindow.propTypes = {
  robotId: PropTypes.string.isRequired,
  requestBT: PropTypes.func.isRequired,
  btConnectedStatus: PropTypes.bool.isRequired
};

export default MainWindow;
