import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import JoyStick from 'react-joystick';
import Slider from '@material-ui/core/Slider';

import { PROTOCOL_MAP } from './Protocol'
import useKeyboardShortcut from './KeyBoardListener';

const KEY_MAP = {
    'PIN_22': { 'index': PROTOCOL_MAP.BUF_PIN22_STATE, 'value': 'r'},
    'PIN_23': { 'index': PROTOCOL_MAP.BUF_PIN23_STATE, 'value': 't'},
    'PIN_24': { 'index': PROTOCOL_MAP.BUF_PIN24_STATE, 'value': 'y'},
    'PIN_25': { 'index': PROTOCOL_MAP.BUF_PIN25_STATE, 'value': 'u'},
    'PIN_26': { 'index': PROTOCOL_MAP.BUF_PIN26_STATE, 'value': 'i'},
    'PIN_27': { 'index': PROTOCOL_MAP.BUF_PIN27_STATE, 'value': 'o'},
    'PIN_28': { 'index': PROTOCOL_MAP.BUF_PIN28_STATE, 'value': 'p'},
    'PIN_29': { 'index': PROTOCOL_MAP.BUF_PIN29_STATE, 'value': 'g'},
    'PIN_30': { 'index': PROTOCOL_MAP.BUF_PIN30_STATE, 'value': 'h'},
    'PIN_31': { 'index': PROTOCOL_MAP.BUF_PIN31_STATE, 'value': 'j'},
    'PIN_32': { 'index': PROTOCOL_MAP.BUF_PIN32_STATE, 'value': 'k'},
    'PIN_33': { 'index': PROTOCOL_MAP.BUF_PIN33_STATE, 'value': 'l'},
    'PIN_34': { 'index': PROTOCOL_MAP.BUF_PIN34_STATE, 'value': 'c'},
    'PIN_35': { 'index': PROTOCOL_MAP.BUF_PIN35_STATE, 'value': 'v'},
    'PIN_36': { 'index': PROTOCOL_MAP.BUF_PIN36_STATE, 'value': 'b'},
    'PIN_37': { 'index': PROTOCOL_MAP.BUF_PIN37_STATE, 'value': 'n'},
    'PIN_38': { 'index': PROTOCOL_MAP.BUF_PIN38_STATE, 'value': 'm'},
    'PIN_39': { 'index': PROTOCOL_MAP.BUF_PIN39_STATE, 'value': ','},
    'PIN_40': { 'index': PROTOCOL_MAP.BUF_PIN40_STATE, 'value': '.'},

}

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


function Controls({updateState, updateStepperMove, updateProtocol, updateProtocolFromTo}) {
  let previousDegree = 0;

  const keys = [
        KEY_MAP.PIN_22.value,
        KEY_MAP.PIN_23.value,
        KEY_MAP.PIN_24.value,
        KEY_MAP.PIN_25.value,
        KEY_MAP.PIN_26.value,
        KEY_MAP.PIN_27.value,
        KEY_MAP.PIN_28.value,
        KEY_MAP.PIN_29.value,
        KEY_MAP.PIN_30.value,
        KEY_MAP.PIN_31.value,
        KEY_MAP.PIN_32.value,
        KEY_MAP.PIN_33.value,
        KEY_MAP.PIN_34.value,
        KEY_MAP.PIN_35.value,
        KEY_MAP.PIN_36.value,
        KEY_MAP.PIN_37.value,
        KEY_MAP.PIN_38.value,
        KEY_MAP.PIN_39.value,
        KEY_MAP.PIN_40.value
    ]

  const handleKeyboardShortcut = useCallback(keys => {
    let pinStates = {}
    Object.keys(KEY_MAP).forEach((key, index) => {
      let key_name = KEY_MAP[key].value
      let protocol_index = KEY_MAP[key].index
      pinStates[protocol_index] = keys[key_name] ? 2: 1
    })
    updateProtocolFromTo(pinStates);
    updateState(true);
  })

  const handleStepper = (e) => {
    console.log(`code ${e.code} type: ${e.type} UP: ${SC_UP_ACTIVE} DOWN: ${SC_DOWN_ACTIVE} LEFT: ${SC_LEFT_ACTIVE} RIGHT ${SC_RIGHT_ACTIVE}`)
    if (SC_UP_ACTIVE) {
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SECTOR, 2)
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_ANGLE, 0)
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SPEED, 50)
    } else if (SC_DOWN_ACTIVE) {
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SECTOR, 4)
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_ANGLE, 0)
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SPEED, 50)
    } else if (SC_RIGHT_ACTIVE) {
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SECTOR, 1)
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_ANGLE, 0)
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SPEED, 50)
    } else if (SC_LEFT_ACTIVE) {
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SECTOR, 2)
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_ANGLE, 90)
      updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SPEED, 50)
    }
  }

  const managerListener = (manager) => {
    manager
      .on('move', (e, stick) => {

        let sector = parseInt(stick.angle.degree) / 90 + 1;
        updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SECTOR, parseInt(sector))
        updateProtocol(PROTOCOL_MAP.BUF_STEPPER_ANGLE, parseInt(stick.angle.degree % 90))
        updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SPEED, parseInt(stick.distance))

        updateStepperMove(true);

        let diff = Math.abs(previousDegree - stick.angle.degree);
        if (diff > 5) {
          previousDegree = stick.angle.degree
          updateState(true);
        }
      })
      .on('end', () => {
        updateState(false)
        updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SECTOR, 0)
        updateProtocol(PROTOCOL_MAP.BUF_STEPPER_ANGLE, 0)
        updateProtocol(PROTOCOL_MAP.BUF_STEPPER_SPEED, 0)
        updateStepperMove(false);
        console.log('I ended!')
      });
  };

  const hSliderListener = (e, value) => {
    updateProtocol(PROTOCOL_MAP.BUF_H_SERVO_ANGLE, parseInt(value))
    updateState(true);
  };

  const vSliderListener = (e, value) => {
    updateProtocol(PROTOCOL_MAP.BUF_V_SERVO_ANGLE, parseInt(value))
    updateState(true);
  };

  const headSliderListener = (e, value) => {
    updateProtocol(PROTOCOL_MAP.BUF_HEAD_V_SERVO_ANGLE, 90 - parseInt(value))
    updateState(true);
  };

  useKeyboardShortcut(keys, handleKeyboardShortcut)

  return (
    <>
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
    </>
  );
}

Controls.propTypes = {
  updateState: PropTypes.func.isRequired,
  updateStepperMove: PropTypes.func.isRequired,
  updateProtocol: PropTypes.func.isRequired,
  updateProtocolFromTo: PropTypes.func.isRequired,
};

export default Controls;
