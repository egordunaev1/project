import React, { Component, createRef } from 'react';
import BrowseMessages from './BrowseMessages';
import { getCookie } from '../../cookieOperations';
import Scrollbar from 'react-scrollbars-custom';
import CreateMessage from './CreateMessage';
import { getBackend } from '../../utility';
import { Link } from 'react-router-dom';

function TopPanel(props) {
  var interlocutor = props.interlocutor;
  return (
    <div className="container-fluid bg-primary p-1 border-rounded-top chat-top-panel">
      {interlocutor && <div className="text-white">Чат с <Link to={"/profile/" + interlocutor.id} className="text-white">{interlocutor.profile.first_name + ' ' + interlocutor.profile.last_name}</Link></div>}
    </div>
  )
}

class Chat extends Component {
  constructor(props) {
    super(props);
    this.code = {};
    this.style = {};
    this.lang = {};
    this.state = {
      nm_height: 140,
      height: 0,
      messages: [],
      mm: true,
      struct: [
        {
          type: 'text',
          value: ''
        }
      ]
    };
  }

  scrollbar = React.createRef();
  new_message = React.createRef();
  timerId;
  timeout = 250;

  get_nm_height = () => Math.min(this.new_message.current.scrollHeight, this.state.height - 181 - 50 - 100);

  componentDidUpdate(a, b, c) {
    if (this.get_nm_height() !== this.state.nm_height)
      this.setState({ nm_height: this.get_nm_height() });
  }


  componentDidMount() {
    this.getMessages();
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
    this.timerId = setInterval(() => { this.getMessages(false); }, 2000);
    if (this.new_message.current)
      this.new_message.current.addEventListener('resize', this.update_nm_height);
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
    clearInterval(this.timerId);
  }

  updateWindowDimensions = () => {
    this.setState({ height: window.innerHeight });
  }

  sendMessage = () => {
    fetch(getBackend() + '/send_message/', {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: JSON.stringify({
        chat: this.props.chat,
        struct: this.state.struct,
        type: 'message'
      })
    }).then(res => {
      if (res.status === 200) {
        this.setState({ struct: [{ type: 'text', value: '' }] });
        res.json().then(res => {
          var mes = this.state.messages;
          mes.push(res);
          this.setState({ messages: mes });
        });
      } else {
        if (res.status !== 400) {
          if (res.status === 401)
            alert('Необходима авторизация');
          else
            this.props.setError(res.status);
        }
      }
    })
  }

  getMessages = (last = true) => {
    var message;
    if (this.state.messages.length == 0)
      message = -1;
    else {
      if (!last)
        message = this.state.messages[this.state.messages.length - 1].id;
      else
        message = this.state.messages[0].id;
    }
    var token = getCookie('token');
    var headers = (token ? { Authorization: `JWT ${token}` } : {});
    if (this.state.mm || !last)
      fetch(getBackend() + '/more_messages/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          chat: this.props.chat,
          last_message: message,
          last: last
        })
      }).then(res => {
        if (res.status === 200)
          res.json().then(res => {
            let messages = this.state.messages;
            if (!last) {
              for (var i = 0; i < res.length; i++)
                for (var j = 0; j < messages.length; j++)
                  if (res[i].id == messages[j].id)
                    res.splice(i, 1);
            }
            if (last)
              messages = res.concat(messages);
            else messages = messages.concat(res);
            let mm = Boolean(res.length);
            if (!last)
              mm = this.state.mm;
            this.setState({ messages: messages, mm: mm });
          });
        else {
          if (res.status !== 400) {
            if (res.status === 401)
              alert('Необходима авторизация');
            else
              this.props.setError(res.status);

          }
        }
      })
  }

  scrollbot = 0;

  render() {
    var strh = 'calc(' + this.state.nm_height + 'px' + ' + .5rem)';
    return (
      <div className="body main-body bg-white">
        <TopPanel interlocutor={this.props.interlocutor} />
        <div className="chat d-flex flex-column" style={{ height: (this.state.height - (this.props.interlocutor ? 70 : 160) - 50) + 'px' }}>
          <Scrollbar
            onLoad={() => { var s = this.scrollbar.current; s.scrollTop = s.scrollHeight - this.scrollbot; }}
            onScrollStop={(s) => {
              !s.scrollTop && this.getMessages();
            }}
            onScroll={(s) => {
              this.scrollbot = s.scrollHeight - s.scrollTop;
            }}
            elementRef={(instance) => (instance && (this.scrollbar.current = instance.firstChild.firstChild))}
            style={{ height: this.state.height - (this.props.interlocutor ? 70 : 160) - 50 - this.state.nm_height }}>
            <BrowseMessages user={this.props.user} messages={this.state.messages} />
          </Scrollbar>
          <Scrollbar style={{ height: strh, width: '100%', borderTop: '2px solid #cdd1d5' }}>
            <div className="new-message mt-auto container-fluid p-2" ref={this.new_message}>
              {this.props.user ? <CreateMessage setStruct={(struct) => this.setState({ struct: struct })} struct={this.state.struct} sendMessage={this.sendMessage} /> : ''}
            </div>
          </Scrollbar>
        </div>
      </div>
    )
  }
}

export default Chat;
