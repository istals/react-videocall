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
      peerSrc: null
    };
    this.pc = {};
    this.config = null;
    this.startCallHandler = this.startCall.bind(this);
    this.endCallHandler = this.endCall.bind(this);
    this.rejectCallHandler = this.rejectCall.bind(this);
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
    const { robotId, callFrom, callModal, callWindow, localSrc, peerSrc } = this.state;
    return (
      <div>
        <MainWindow
          robotId={robotId}
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
