import React, { Component } from 'react';
import Interweave from 'interweave';
import { Link } from 'react-router-dom';
import { getBackend } from '../../utility';

function BrowseText(props) {
  var block = props.block;
  return (
    <div className="mt-2">
      <Interweave content={block.value} />
    </div>
  )
}

class BrowseCode extends Component {
  code = React.createRef()

  copyCode = () => {
    var selection = window.getSelection();
    selection.selectAllChildren(this.code.current);
  }

  render() {
    var block = this.props.block;
    return (
      <div>
        <div className="d-flex">
          <a className="copy-code ml-auto" onClick={() => this.copyCode()}>Выделить код</a>
        </div>
        <style type="text/css">
          {block.value.css};
        </style>
        <div ref={this.code} style={{ borderRadius: '5px' }}><Interweave content={block.value.code} /></div>
      </div>
    )
  }
}

function BrowseImage(props) {
  var block = props.block;
  return (
    <div>
      {
        block.value.map((image, ind) => (
          <img alt="" className="b-image cursor-pointer mt-1" src={image} key={ind} onClick={() => props.openImage(image)} />
        ))
      }
    </div>
  )
}

function ChooseType(props) {
  var block = props.block;
  switch (block.type) {
    case 'code':
      return <BrowseCode block={block} />
    case 'text':
      return <BrowseText block={block} />
    case 'image':
      return <BrowseImage openImage={props.openImage} block={block} />
  }
}

function BrowseMessage(props) {
  var message = JSON.parse(props.message.chat_message_body.content);
  var sender = props.message.sender;
  return (
    <div className={"message my-1 p-1" + (props.user && sender.username === props.user.username ? " ml-2" : " message-not-my ml-auto mr-2")}>
      <div className="d-flex mes-sender">
        <div className="ml-1 d-flex">
          <Link to={'/profile/' + sender.id}>
            <img alt="" src={getBackend() + sender.profile.cover} className="cover-img" width="32px" height="32px" />
            <span className="mt-1 ml-1 text-black-50">{sender.profile.first_name} {sender.profile.last_name}</span>
          </Link>
        </div>
      </div>
      {
        message.map((block, ind) => (
          <div key={ind} className="block">
            <ChooseType key={'ct' + ind} block={block} openImage={props.openImage} />
          </div>
        ))
      }
    </div>
  )
}

class BrowseMessages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: null
    }
  }

  messages = React.createRef()

  openImage = (src) => {
    this.setState({ opened: src });
  }

  closeImage = () => {
    this.setState({ opened: null });
  }

  scrollBottom = () => {
    this.messages.current.scrollTop = this.messages.current.scrollTopMax;
    return true;
  }

  render() {
    return (
      <div className="messages" ref={this.messages}>
        {
          this.props.messages.map((message, ind) => (
            <div key={ind + 'd1'} >
              <BrowseMessage user={this.props.user} openImage={this.openImage} key={ind + 'bm'} message={message} />
            </div>
          ))
        }
        {
          this.state.opened &&
          <div className="opened cursor-pointer d-flex" onClick={() => this.closeImage()}>
            <center className="mx-auto my-auto">
              <img alt="" src={this.state.opened} style={{maxHeight: document.documentElement.clientHeight + 'px'}}/>
            </center>
          </div>
        }
      </div>
    )
  }
}

export default BrowseMessages;