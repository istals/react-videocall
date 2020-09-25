import React, { Component } from 'react';
import _, { random } from 'lodash';

import socket from './socket';
import PeerConnection from './PeerConnection';
import MainWindow from './MainWindow';
import CallWindow from './CallWindow';
import CallModal from './CallModal';
import { PROTOCOL_MAP } from './Protocol';


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
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      7,
      0
    ]

    this.updatePinStates = 1000
    this.moveStepper = false
    this.stepperKeysDown = false;
    this.stepperJoystickDown = false

    this.pc = {};
    this.config = null;
    this.startCallHandler = this.startCall.bind(this);
    this.endCallHandler = this.endCall.bind(this);
    this.rejectCallHandler = this.rejectCall.bind(this);

    this.updateProtocolFromToHandler = this.updateProtocolFromTo.bind(this)
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

  updateProtocolFromTo(values) {
    let changed = false;
    Object.keys(values).forEach((val, index) => {
      if (this.protocol[val] != values[val]) {
        this.protocol[val] = values[val]
        changed = true
      }
    })
    return changed
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

        let pinStates = this.protocol.slice(PROTOCOL_MAP.BUF_PIN22_STATE, PROTOCOL_MAP.BUF_PIN40_STATE)
        // console.log('pinStates', pinStates)
        if (this.updatePinStates == 0 && pinStates.some((state) =>  state == 2)) {
          this.updateState(true);
          console.log('pinActive')
          this.updatePinStates = 1000
        }

        if(this.moveStepper) {
          this.sendData = true;
        }

        if (this.sendData) {
          let crc_sum = this.protocol[0] + this.protocol[this.protocol.length - 2]
          this.protocol[this.protocol.length - 1] = crc_sum
          console.log(this.protocol)
          let data = {
            to: callTo,
            protocol: new Uint32Array(this.protocol)
          }
          // console.log('send protocol ', data)
          socket.emit('update_motors', data)
          this.updateState(false);
          this.updatePinStates = 1000
        }

        this.updatePinStates = this.updatePinStates - 10
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
            updateProtocolFromTo={this.updateProtocolFromToHandler}
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
