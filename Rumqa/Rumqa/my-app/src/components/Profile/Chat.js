import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { getCookie } from '../../cookieOperations';
import { getBackend } from '../../utility';
import Chat from '../Main/Chat';
import Wrapper from '../Main/Wrapper';

class PrivateChat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chat_id: null,
      interlocutor: null,
      is_loading: true,
      error: null,
      redirected: false
    }
  }

  componentDidMount() {
    this.state.redirected = this.props.redirected;
    if (this.props.redirected)
      this.getInterlocutor();
    else
      this.get_personal_chat();
  }

  getInterlocutor = () => {
    var chat_id;
    if (!this.state.chat_id)
      try {
        chat_id = Number.parseInt(this.props.match.params.chat_id);
      } catch (err) {
        this.setState({ error: 404 });
        return;
      }
    else chat_id = this.state.chat_id;
    fetch(getBackend() + '/interlocutor/' + chat_id, {
      method: 'GET',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      }
    }).then(res => {
      if (res.status === 200) {
        res.json().then(res => {
          this.setState({ interlocutor: res, is_loading: false, chat_id: chat_id});
        });
      } else {
        this.setError(res.status);
      }
    }
    )
  }

  get_personal_chat = () => {
    var interlocutor;
    try {
      interlocutor = Number.parseInt(this.props.match.params.user_id);
    } catch (err) {
      this.setState({ error: 404 });
      return;
    }
    fetch(getBackend() + '/private_chat/' + interlocutor, {
      method: 'GET',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      }
    }).then(res => {
      if (res.status === 200)
        res.json().then((json) => this.setState({
          chat_id: json,
          redirected: true
        }));
      else this.setError(res.status);
    })
  }

  setError = (err_code) => {
    this.setState({ error: err_code });
  }

  componentDidUpdate() {
    if (!this.state.error && !this.state.interlocutor && this.state.redirected)
      this.getInterlocutor();
  }

  render() {
    if (this.props.redirected)
      return (
        <Wrapper is_loading={this.state.is_loading} error={this.state.error}>
          <Chat user={this.props.user} chat={this.state.chat_id} setError={this.setError} interlocutor={this.state.interlocutor} />
        </Wrapper>
      )
    else {
      if (this.state.chat_id)
        return <Redirect to={'/chat/' + this.state.chat_id} />;
      return <Wrapper is_loading={this.state.is_loading} error={this.state.error}></Wrapper>
    }
  }
}

export default PrivateChat;