import React, { useState } from 'react';
import PropTypes from 'prop-types';

function MainWindow({ startCall, clientId, robotsList }) {
  const [friendID, setFriendID] = useState(null);

  /**
   * Start the call with or without video
   * @param {Boolean} video
   */
  const callWithVideo = (robotID, videoEnabled) => {
    console.log('callWithVideo')
    const config = { audio: true, video: videoEnabled };
    return () => robotID && startCall(true, robotID, config);
  };

  return (
    <div className="container main-window">
      <div>
        <h3>
          Hi, your ID is
          <input
            type="text"
            className="txt-clientId"
            defaultValue={clientId}
            readOnly
          />
        </h3>
        <h3>
          Robots list:
        </h3>
      </div>
      <div>
        {robotsList.map((value, index) => {
          const key = `robot-${index}`;
          return (
            <div key={key}>
              {value}
              <>
                <button
                  type="button"
                  className="btn-action fa fa-video-camera"
                  onClick={callWithVideo(value, true)}
                />
              </>
            </div>
          );
        })}
      </div>
    </div>
  );
}

MainWindow.propTypes = {
  robotsList: PropTypes.array.isRequired,
  clientId: PropTypes.string.isRequired,
  startCall: PropTypes.func.isRequired
};

export default MainWindow;
