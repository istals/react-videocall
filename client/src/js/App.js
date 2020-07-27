import React, { Component } from 'react';
import _, { random } from 'lodash';

import socket from './socket';
import PeerConnection from './PeerConnection';
import MainWindow from './MainWindow';
import CallWindow from './CallWindow';
import CallModal from './CallModal';


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
      111,   // CRC - C
      0,   // sector 1 - 4
      0,   // degree 0 - 90,
      0,   // distance from center,
      90,  // h slider position 0 - 180
      90,  // v slider position 0 - 180,
      45,
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
        const { callFrom } = this.state;
        console.log(`user_left ${callFrom} `, data.id)
        if (callFrom === data.id) {
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
        <CallModal
          status={callModal}
          startCall={this.startCallHandler}
          rejectCall={this.rejectCallHandler}
          callFrom={callFrom}
        />
      </div>
    );
  }
}

export default App;
