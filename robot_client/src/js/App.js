import React, { Component } from 'react';
import _ from 'lodash';

import socket from './socket';
import PeerConnection from './PeerConnection';
import MainWindow from './MainWindow';
import CallWindow from './CallWindow';
import CallModal from './CallModal';
import Log from './Log';


class App extends Component {
  constructor() {
    super();
    this.state = {
      robotId: '',
      callWindow: '',
      callModal: '',
      callFrom: '',
      localSrc: null,
      peerSrc: null,
      btConnectedStatus: false
    };
    this.pc = {};
    this.config = null;
    this.startCallHandler = this.startCall.bind(this);
    this.endCallHandler = this.endCall.bind(this);
    this.rejectCallHandler = this.rejectCall.bind(this);

    this.sendProtocolHandler = this.sendProtocol.bind(this)

    this.handleBTHandler = this.handleBT.bind(this);
    this.onDisconnectedHandler = this.onDisconnected.bind(this);
    this.connectHandler = this.connect.bind(this);
    this.toTryHandler = this.toTry.bind(this);
    this.successHandler = this.success.bind(this);
    this.failHandler = this.fail.bind(this);
    this.sendBTMSGHandler = this.sendBTMSG.bind(this);
    this.BLEDevice = null;
    this.BLECharestic = null;
  }


  async sendBTMSG(data) {
    try {
      await this.BLECharestic.writeValue(new Uint8Array(data));
    } catch (error) {

    }
  }


  sendProtocol(protocol) {
    console.log('received protocol: ', protocol)
    let result = Object.keys(protocol).map(function (key) {
      return protocol[key];
    });
    console.log('mapped protocol: ', result)
    this.sendBTMSGHandler(result);
  }


  time(text) {
    console.log('[' + new Date().toJSON().substr(11, 8) + '] ' + text);
  }



  async handleBT() {
    this.BLEDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true
      // filters: [{services: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']}]
    })

    if (this.BLEDevice) {
      this.BLEDevice.addEventListener('gattserverdisconnected', this.onDisconnectedHandler)
      console.log(this.BLEDevice)
      this.connectHandler()
    }
  }

  toTry() {
    this.time('Connecting to Bluetooth Device... ');
    return this.BLEDevice.gatt.connect();
  }

  async success(server) {
    try {
      this.setState({ btConnectedStatus: true });
      console.log('> Bluetooth Device connected. Try disconnect it now.');
      const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');

      console.log('Getting Robot Control Point Characteristic...');
      this.BLECharestic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
    } catch(error) {
      console.log('Argh! ' + error);
    }
  }

  fail() {
    this.setState({ btConnectedStatus: false });
    this.time('Failed to reconnect.');
  }


  connect() {
    this.exponentialBackoff(3 /* max retries */, 2 /* seconds delay */,
      this.toTryHandler,
      this.successHandler,
      this.failHandler
    );
  }

  onDisconnected() {
    console.log('> Bluetooth Device disconnected');
    this.connect();
  }

  exponentialBackoff(max, delay, toTry, success, fail) {
    toTry().then(result => success(result))
    .catch(_ => {
      if (max === 0) {
        return fail();
      }
      this.time('Retrying in ' + delay + 's... (' + max + ' tries left)');
      setTimeout(() => {
        this.connect(--max, delay * 2, toTry, success, fail);
      }, delay * 1000);
    });
  }

  componentDidMount() {
      socket
      .on('init', ({ id: robotId }) => {
        document.title = `${robotId} - VideoCall`;
        this.setState({ robotId });
      })
      .on('request', ({ from: callFrom }) => {
        console.log('request from ', callFrom)
        const config = { audio: true, video: true };
        this.startCallHandler(false, callFrom, config);
        this.setState({ callFrom });
      })
      .on('call', (data) => {
        console.log('call ', data)
        if (data.sdp) {
          this.pc.setRemoteDescription(data.sdp);
          if (data.sdp.type === 'offer') this.pc.createAnswer();
        } else this.pc.addIceCandidate(data.candidate);
      })
      .on('end', this.endCallHandler(false))
      .on('user_left', (data) => {
        const { callFrom } = this.state;
        console.log(`user_left ${callFrom} `, data.id)
        if (callFrom === data.id) {
          console.log('emit endCall')
          this.endCallHandler(false);
        }
      })
      .on('update_motors', (data) => {
        console.log(data)
        this.sendProtocol(data.protocol)
      })
      .emit('init');
  }

  startCall(isCaller, friendID, config) {
    console.log('startCall ', isCaller, friendID, config)
    this.config = config;
    this.pc = new PeerConnection(friendID)
      .on('localStream', (src) => {
        console.log('localStream ', src)
        const newState = { callWindow: 'active', localSrc: src };
        if (!isCaller) newState.callModal = '';
        this.setState(newState);
      })
      .on('peerStream', (src) => this.setState({ peerSrc: src }))
      .start(isCaller, config);
  }

  rejectCall() {
    console.log('rejectCall')
    const { callFrom } = this.state;
    socket.emit('end', { to: callFrom });
    this.setState({ callModal: '' });
  }

  endCall(isStarter) {
    console.log('endcall');
    if (_.isFunction(this.pc.stop)) {
      this.pc.stop(isStarter);
    }

    this.pc = {};
    this.config = null;
    this.setState({
      callWindow: '',
      localSrc: null,
      peerSrc: null
    });
  }

  render() {
    const { robotId, callFrom, callModal, callWindow, localSrc, peerSrc, btConnectedStatus } = this.state;
    return (
      <div>
        <MainWindow
          robotId={robotId}
          startCall={this.startCallHandler}
          requestBT={this.handleBTHandler}
          btConnectedStatus={btConnectedStatus}
        />
        {!_.isEmpty(this.config) && (
          <CallWindow
            status={callWindow}
            localSrc={localSrc}
            peerSrc={peerSrc}
            config={this.config}
            mediaDevice={this.pc.mediaDevice}
            endCall={this.endCallHandler}
            sendProtocol={this.sendProtocolHandler}
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
