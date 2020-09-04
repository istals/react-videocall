import React, { Component } from 'react';
import _, { random } from 'lodash';

import socket from './socket';
import PeerConnection from './PeerConnection';
import MainWindow from './MainWindow';
import CallWindow from './CallWindow';
import CallModal from './CallModal';



class PROTOCOL_MAP {
  BUF_CRC_C = 0
  BUF_STEPPER_SECTOR = 1
  BUF_STEPPER_ANGLE = 2
  BUF_STEPPER_SPEED = 3
  BUF_H_SERVO_ANGLE = 4
  BUF_V_SERVO_ANGLE = 5
  BUF_HEAD_V_SERVO_ANGLE = 6
  BUF_PIN22_STATE = 7
  BUF_PIN23_STATE = 8
  BUF_PIN24_STATE = 9
  BUF_PIN25_STATE = 10
  BUF_PIN26_STATE = 11
  BUF_PIN27_STATE = 12
  BUF_PIN28_STATE = 13
  BUF_PIN29_STATE = 14
  BUF_PIN30_STATE = 15
  BUF_PIN31_STATE = 16
  BUF_PIN32_STATE = 17
  BUF_PIN33_STATE = 18
  BUF_PIN34_STATE = 19
  BUF_PIN35_STATE = 20
  BUF_PIN36_STATE = 21
  BUF_PIN37_STATE = 22
  BUF_PIN38_STATE = 23
  BUF_PIN39_STATE = 24
  BUF_PIN40_STATE = 25
  BUF_CRC_R = 26
  BUF_CRC_SUM = 27
}


class App extends Component {
  constructor() {
    super();
    this.state = {
      clientId: '',
      callWindow: '',
      callFrom: '',
      callTo: '',
      localSrc: null,
      peerSrc: null,
      robotsList: [],
    };

    this.sendData = false;
    this.protocol = [
      111,   //0 CRC - C
      0,     //1 sector 1 - 4
      0,     //2 degree 0 - 90,
      0,     //3 distance from center,
      90,    //4 h slider position 0 - 180
      90,    //5 v slider position 0 - 180,
      45,    //6 v slider position 0 - 180,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      7,
      0
    ]

    this.moveStepper = false
    this.stepperKeysDown = false;
    this.stepperJoystickDown = false

    this.pc = {};
    this.config = null;
    this.startCallHandler = this.startCall.bind(this);
    this.endCallHandler = this.endCall.bind(this);
    this.rejectCallHandler = this.rejectCall.bind(this);

    this.updateProtocolHandler = this.updateProtocol.bind(this);
    this.sendProtocolHandler = this.sendProtocol.bind(this);
    this.updateStateHandler = this.updateState.bind(this);
    this.updateStepperMoveHandler = this.updateStepperMove.bind(this);
  }

  updateStepperMove(status, controler) {
    switch(controler) {
      case 0:
        this.stepperJoystickDown = true;
        break
      case 1:
        this.stepperKeysDown = true;
        break
    }
    this.moveStepper = status

    console.log(this.protocol)
  }

  updateState(value) {
    this.sendData = value
  }

  updateProtocol(key, value) {
    this.protocol[key] = value
  }

  sendProtocol() {
    // setInterval(() => {
    //   const { callTo, sendData } = this.state;
    //   let data = {
    //     to: callTo,
    //     protocol: new Uint8Array(this.protocol)
    //   }
    //   if (sendData) {
    //     console.log('send protocol ', data)
    //     socket.emit('update_motors', data)
    //   }
    // }, 10)
  }

  componentDidMount() {
    socket
      .on('update_robot_list', ({ robots: robotsList }) => {
        this.setState({ robotsList });
      })
      .on('init', ({ id: clientId, robots: robotsList }) => {
        document.title = `${clientId} - VideoCall`;
        this.setState({ clientId, robotsList });
      })
      .on('request', ({ from: callFrom }) => {
        console.log(`request callFrom: `, callFrom)
        this.setState({ callModal: 'active', callFrom });
      })
      .on('call', (data) => {
        if (data.sdp) {
          this.pc.setRemoteDescription(data.sdp);
          if (data.sdp.type === 'offer') this.pc.createAnswer();
        } else this.pc.addIceCandidate(data.candidate);
      })
      .on('end', () => this.endCallHandler(false))
      .on('user_left', (data) => {
        const { callFrom, callTo } = this.state;
        console.log(`user_left ${callFrom} `, data)
        if (callFrom === data.id || callTo == data.id) {
          console.log('emit endCall')
          this.endCallHandler(false);
        }
      })
      .emit('init');

      setInterval(() => {
        const { callTo } = this.state;

        // if (this.stepperJoystickDown) this.sendData = true;
        // if (this.stepperKeysDown) this.sendData = true;

        if(this.moveStepper) {
          this.sendData = true;
        }

        if (this.sendData) {
          let crc_sum = this.protocol[0] + this.protocol[this.protocol.length - 2]
          this.protocol[this.protocol.length - 1] = crc_sum
          let data = {
            to: callTo,
            protocol: new Uint32Array(this.protocol)
          }
          // console.log('send protocol ', data)
          socket.emit('update_motors', data)
          this.updateState(false);
        }
      }, 10)
  }

  startCall(isCaller, robotID, config) {
    console.log(`startCall isCaller: ${isCaller}, robotId: ${robotID} `, config);
    this.config = config;
    this.pc = new PeerConnection(robotID)
      .on('localStream', (src) => {
        const newState = { callWindow: 'active', localSrc: src, callTo: robotID};
        this.setState(newState);
      })
      .on('peerStream', (src) => this.setState({ peerSrc: src, callTo: robotID }))
      .start(isCaller, config);
  }

  rejectCall() {
    const { callFrom } = this.state;
    socket.emit('end', { to: callFrom });
    this.setState({ callModal: '' });
  }

  endCall(isStarter) {
    console.log('endcall')
    if (_.isFunction(this.pc.stop)) {
      this.pc.stop(isStarter);
    }

    this.pc = {};
    this.config = null;
    this.setState({
      callWindow: '',
      callTo: '',
      localSrc: null,
      peerSrc: null
    });
  }

  render() {
    const { clientId, callFrom, callModal, callWindow, localSrc, peerSrc, robotsList } = this.state;
    return (
      <div>
        <MainWindow
          robotsList={robotsList}
          clientId={clientId}
          startCall={this.startCallHandler}
        />
        {!_.isEmpty(this.config) && (
          <CallWindow
            status={callWindow}
            localSrc={localSrc}
            peerSrc={peerSrc}
            config={this.config}
            mediaDevice={this.pc.mediaDevice}
            endCall={this.endCallHandler}
            updateProtocol={this.updateProtocolHandler}
            updateState={this.updateStateHandler}
            updateStepperMove={this.updateStepperMoveHandler}
          />
        ) }
        { !_.isEmpty(callModal) && (
          <CallModal
            status={callModal}
            startCall={this.startCallHandler}
            rejectCall={this.rejectCallHandler}
            callFrom={callFrom}
          />
        )}
      </div>
    );
  }
}

export default App;
