import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import JoyStick from 'react-joystick';
import Slider from '@material-ui/core/Slider';
import { GlobalHotKeys } from "react-hotkeys";
import * as Mousetrap from 'mousetrap';



let SC_RIGHT_CODE = 'KeyD';
let SC_RIGHT_ACTIVE = false;

let SC_UP_CODE = 'KeyW';
let SC_UP_ACTIVE = false;

let SC_LEFT_CODE = 'KeyA';
let SC_LEFT_ACTIVE = false

let SC_DOWN_CODE = 'KeyS';
let SC_DOWN_ACTIVE = false;


const getButtonClass = (icon, enabled) => classnames(`btn-action fa ${icon}`, { disable: !enabled });

const joyOptions = {
  mode: 'semi',
  catchDistance: 28,
  color: 'white'
};

const containerStyle = {
  position: 'relative',
  height: '150px',
  width: '150px'
};

const containerStyle2 = {
  position: 'absolute',
  height: '150px',
  width: '150px',
  bottom: 0
};


function CallWindow({ peerSrc, localSrc, config, mediaDevice, status, endCall, updateProtocol,  updateStepperMove, updateState}) {
  const peerVideo = useRef(null);
  const localVideo = useRef(null);
  let previousDegree = 0;
  const [video, setVideo] = useState(config.video);
  const [audio, setAudio] = useState(config.audio);

  useEffect(() => {
    if (peerVideo.current && peerSrc) peerVideo.current.srcObject = peerSrc;
    if (localVideo.current && localSrc) localVideo.current.srcObject = localSrc;

    if (mediaDevice) {
      mediaDevice.toggle('Video', video);
      mediaDevice.toggle('Audio', audio);
    }
  });

  /**
   * Turn on/off a media device
   * @param {String} deviceType - Type of the device eg: Video, Audio
   */
  const toggleMediaDevice = (deviceType) => {
    if (deviceType === 'video') {
      setVideo(!video);
      mediaDevice.toggle('Video');
    }
    if (deviceType === 'audio') {
      setAudio(!audio);
      mediaDevice.toggle('Audio');
    }
  };

  const keyMap = {
    RIGHT_PRESS:  { name: 'Stepper Right Press', sequence: "d", action: 'keydown'},
    RIGHT_REALEASE:  { name: 'Stepper Right Release', sequence: "d", action: 'keyup'},

    UP_PRESS: { name: 'Stepper Up Press', sequence: "w", action: 'keydown'},
    UP_RELEASE: { name: 'Stepper Up Release', sequence: "w", action: 'keyup'},

    LEFT_PRESS: { name: 'Stepper Left Press', sequence: "a", action: 'keydown'},
    LEFT_RELEASE: { name: 'Stepper Left Release', sequence: "a", action: 'keyup'},

    DOWN_PRESS: { name: 'Stepper Left Press', sequence: "s", action: 'keydown'},
    DOWN_RELEASE: { name: 'Stepper Left Release', sequence: "s", action: 'keyup'},

    // UP_RIGHT_PRESS:  { name: 'Stepper UP Right Press', sequence: "w+d", action: 'keydown'},
    // UP_RIGHT_REALEASE:  { name: 'Stepper UP Right Release', sequence: "w+d", action: 'keyup'},

    // UP_LEFT_PRESS:  { name: 'Stepper UP Left Press', sequence: "w+a", action: 'keydown'},
    // UP_LEFT_REALEASE:  { name: 'Stepper UP Left Release', sequence: "w+a", action: 'keyup'},

    // DOWN_LEFT_PRESS:  { name: 'Stepper DOWN Left Press', sequence: "s+a", action: 'keydown'},
    // DOWN_LEFT_REALEASE:  { name: 'Stepper DOWN Left Release', sequence: "s+a", action: 'keyup'},

    // DOWN_RIGHT_PRESS:  { name: 'Stepper DOWN Right Press', sequence: "s+d", action: 'keydown'},
    // DOWN_RIGHT_REALEASE:  { name: 'Stepper DOWN Right Release', sequence: "s+d", action: 'keyup'}
  };

  const handlers = {
    RIGHT_PRESS: event => stepperHotKeyHandler(event),
    RIGHT_REALEASE: event => stepperHotKeyHandler(event),

    UP_PRESS: event => stepperHotKeyHandler(event),
    UP_RELEASE: event => stepperHotKeyHandler(event),

    LEFT_PRESS: event => stepperHotKeyHandler(event),
    LEFT_RELEASE: event => stepperHotKeyHandler(event),

    DOWN_PRESS: event => stepperHotKeyHandler(event),
    DOWN_RELEASE: event => stepperHotKeyHandler(event),

    // UP_RIGHT_PRESS: event => stepperHotKeyHandler(event),
    // UP_RIGHT_REALEASE: event => stepperHotKeyHandler(event),

    // UP_LEFT_PRESS: event => stepperHotKeyHandler(event),
    // UP_LEFT_REALEASE: event => stepperHotKeyHandler(event),

    // DOWN_LEFT_PRESS: event => stepperHotKeyHandler(event),
    // DOWN_LEFT_REALEASE: event => stepperHotKeyHandler(event),

    // DOWN_RIGHT_PRESS: event => stepperHotKeyHandler(event),
    // DOWN_RIGHT_REALEASE: event => stepperHotKeyHandler(event)
  };


  const stepperHotKeyHandler = (e) => {
    // console.log(e)
    let active = (e.type == "keydown") ? true:false;

    switch (e.code) {
      case SC_RIGHT_CODE:
        SC_RIGHT_ACTIVE = active
        break;
      case SC_UP_CODE:
        SC_UP_ACTIVE = active
        break;
      case SC_LEFT_CODE:
        SC_LEFT_ACTIVE = active
        break;
      case SC_DOWN_CODE:
        SC_DOWN_ACTIVE = active
        break;
    }

    handleStepper(e);

    if (active) {
      updateState(true);
      updateStepperMove(true);
    } else {
      updateStepperMove(false);
    }
  }

  const handleStepper = (e) => {
    console.log(`code ${e.code} type: ${e.type} UP: ${SC_UP_ACTIVE} DOWN: ${SC_DOWN_ACTIVE} LEFT: ${SC_LEFT_ACTIVE} RIGHT ${SC_RIGHT_ACTIVE}`)
    if (SC_UP_ACTIVE) {
      // if (SC_RIGHT_ACTIVE) {
      //   upRightHandler()
      // } else if (SC_LEFT_ACTIVE) {
      //   upLeftHandler()
      // } else {
      //   updateProtocol(1, 2)
      //   updateProtocol(2, 0)
      //   updateProtocol(3, 50)
      // }
      updateProtocol(1, 2)
      updateProtocol(2, 0)
      updateProtocol(3, 50)

    } else if (SC_DOWN_ACTIVE) {
      // if (SC_RIGHT_ACTIVE) {
      //   downRightHandler()
      // } else if (SC_LEFT_ACTIVE) {
      //   downLeftHandler()
      // } else {
      //   updateProtocol(1, 4)
      //   updateProtocol(2, 0)
      //   updateProtocol(3, 50)
      // }
      updateProtocol(1, 4)
      updateProtocol(2, 0)
      updateProtocol(3, 50)
    } else if (SC_RIGHT_ACTIVE) {
      updateProtocol(1, 1)
      updateProtocol(2, 0)
      updateProtocol(3, 50)
    } else if (SC_LEFT_ACTIVE) {
      updateProtocol(1, 2)
      updateProtocol(2, 90)
      updateProtocol(3, 50)
    }
  }


  const upRightHandler = () => {
    console.log('UP RIGHT')
    updateProtocol(1, 1)
    updateProtocol(2, 30)
    updateProtocol(3, 50)
  }

  const upLeftHandler = () => {
    console.log('UP LEFT')
    updateProtocol(1, 2)
    updateProtocol(2, 70)
    updateProtocol(3, 50)
  }

  const downRightHandler = () => {
    console.log('DOWN RIGHT')
    updateProtocol(1, 4)
    updateProtocol(2, 30)
    updateProtocol(3, 50)
  }

  const downLeftHandler = () => {
    console.log('DOWN LEFT')
    updateProtocol(1, 3)
    updateProtocol(2, 70)
    updateProtocol(3, 50)
  }



  const managerListener = (manager) => {
    manager
      .on('move', (e, stick) => {

        let sector = parseInt(stick.angle.degree) / 90 + 1;
        updateProtocol(1, parseInt(sector))
        updateProtocol(2, parseInt(stick.angle.degree % 90))
        updateProtocol(3, parseInt(stick.distance))

        updateStepperMove(true);

        let diff = Math.abs(previousDegree - stick.angle.degree);
        if (diff > 5) {
          previousDegree = stick.angle.degree
          updateState(true);
        }
      })
      .on('end', () => {
        updateState(false)
        updateProtocol(1, 0)
        updateProtocol(2, 0)
        updateProtocol(3, 0)
        updateStepperMove(false);
        console.log('I ended!')
      });
  };

  const hSliderListener = (e, value) => {
    updateProtocol(4, parseInt(value))
    updateState(true);
  };

  const vSliderListener = (e, value) => {
    updateProtocol(5, parseInt(value))
    updateState(true);
  };

  const headSliderListener = (e, value) => {
    updateProtocol(6, 90 - parseInt(value))
    updateState(true);
  };

  return (
      <div className={classnames('call-window', status)}>
        <GlobalHotKeys keyMap={keyMap} handlers={handlers} />
        <video id="localVideo" ref={localVideo} autoPlay muted />
        <div className="video-outer-overlay">
          <div className="video-inner-container">
            <div className="video-overlay">
              <div className="joystick" style={containerStyle2}>
                <JoyStick
                  joyOptions={joyOptions}
                  containerStyle={containerStyle}
                  managerListener={managerListener}
                />

              </div>
              <div className="h-slider">
                <Slider
                  defaultValue={90}
                  aria-labelledby="discrete-slider"
                  valueLabelDisplay="auto"
                  marks
                  min={0}
                  max={180}
                  step={10}
                  onChange={hSliderListener}
                />
              </div>
              <div className="v-slider">
                <Slider
                  orientation="vertical"
                  defaultValue={90}
                  aria-labelledby="vertical-slider"
                  valueLabelDisplay="auto"
                  marks
                  min={0}
                  max={180}
                  step={10}
                  onChange={vSliderListener}
                />
              </div>
              <div className="head-slider">
                <Slider
                  orientation="vertical"
                  defaultValue={45}
                  aria-labelledby="vertical-slider"
                  valueLabelDisplay="auto"
                  track="inverted"
                  marks
                  min={0}
                  max={90}
                  step={5}
                  onChange={headSliderListener}
                />
              </div>
            </div>
            <video id="peerVideo" ref={peerVideo} autoPlay />
          </div>
        </div>
        <div className="video-control">
          <button
            key="btnVideo"
            type="button"
            className={getButtonClass('fa-video-camera', video)}
            onClick={() => toggleMediaDevice('video')}
          />
          <button
            key="btnAudio"
            type="button"
            className={getButtonClass('fa-microphone', audio)}
            onClick={() => toggleMediaDevice('audio')}
          />
          <button
            type="button"
            className="btn-action hangup fa fa-phone"
            onClick={() => endCall(true)}
          />
        </div>
      </div>
  );
}

CallWindow.propTypes = {
  status: PropTypes.string.isRequired,
  localSrc: PropTypes.object, // eslint-disable-line
  peerSrc: PropTypes.object, // eslint-disable-line
  config: PropTypes.shape({
    audio: PropTypes.bool.isRequired,
    video: PropTypes.bool.isRequired
  }).isRequired,
  mediaDevice: PropTypes.object, // eslint-disable-line
  endCall: PropTypes.func.isRequired,
  updateProtocol: PropTypes.func.isRequired,
  updateState: PropTypes.func.isRequired,
  updateStepperMove: PropTypes.func.isRequired
};

export default CallWindow;
