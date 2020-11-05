import React, { Component } from 'react';
import NestedRooms from './NestedRooms';
import Navigation from './Navigation';
import BreadCrumb from './BreadCrumb';
import QuestionPage from './QuestionPage';
import Wrapper from './Wrapper';
import CreateRoom from './CreateRoom';
import Chat from './Chat';
import Members from './Members';
import CreateQuestion from './CreateQuestion';
import {getCookie} from '../../cookieOperations';
import { getBackend } from '../../utility';

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      room: null,
      active_tab: 1,
      is_loading: true,
      errors: null
    };
  }

  getRoom = (not_loading = false) => {
    this.setState({ is_loading: !not_loading });
    let headers = {}
    if (getCookie('token')) {
      headers = { Authorization: `JWT ${getCookie('token')}` };
    }
    fetch(getBackend() + '/room_data' + this.props.location.pathname, {
      headers: headers,
      method: 'GET',
    }).then(res => {
      if (res.status === 200) {
        res.json().then(res => this.setState({ room: res, is_loading: false, errors: null }));
      } else {
        this.setState({ errors: res.status, is_loading: false });
      }
    })
      .catch(() => this.setState({ errors: 500, is_loading: false }));
  }

  switchActiveTab = (e, tab_num) => {
    if (e)
      e.preventDefault();
    this.setState({ active_tab: tab_num });
    this.getRoom();
  }

  getTab = () => {
    var is_admin = false;
    if (this.state.room && this.props.user)
      this.state.room.admin_list.forEach(element => {
        if (element.username === this.props.user.username)
          is_admin = true;
      });
    switch (this.state.active_tab) {
      case 1:
        return <NestedRooms setError={this.setError} room={this.state.room} user={this.props.user} addRoom={() => this.switchActiveTab(0, 5)} />;
      case 2:
        return <QuestionPage setState={(state) => this.setState(state)} switchActiveTab={this.switchActiveTab} room={this.state.room} getRoom={this.getRoom} location={this.props.location} setError={this.setError} user={this.props.user} />
      case 3:
        return <Chat user={this.props.user} chat={this.state.room.chat.id} setError={this.setError} />
      case 4:
        return <Members getRoom={this.getRoom} is_admin={is_admin} room={this.state.room} username={this.props.user ? this.props.user.username : null} />
      default:
        return '';
      }
  }

  componentDidMount() {
    this.getRoom();
  }

  componentDidUpdate() {
    let local_path = this.props.location.pathname;
    if (local_path.endsWith('/'))
      local_path = local_path.substr(0, local_path.length - 1)
    if (this.state.is_loading) {
      return;
    }
    else if (this.state.errors) {
      return;
    }
    else if (!this.state.room) {
      this.getRoom();
    }
    else if (this.state.room.path !== local_path) {
      this.getRoom();
    }
  }

  setError = (err_code) => {
    this.setState({ errors: err_code });
  }

  render() {
    var is_admin = false;
    if (this.state.room && this.props.user)
      this.state.room.admin_list.forEach(element => {
        if (element.username === this.props.user.username)
          is_admin = true;
      });
    return (
      <div>
        <div className="body main-body">
          <BreadCrumb can_edit={is_admin} active_tab={this.state.active_tab} switchActiveTab={this.switchActiveTab} location={this.props.location} />
        </div>
        {
          this.state.active_tab < 5 && (
            <div>
              <div className="body main-body">
                <Navigation location={this.props.location} active_tab={this.state.active_tab} switchActiveTab={this.switchActiveTab} />
              </div>
              <Wrapper is_loading={this.state.is_loading} error={this.state.errors}>
                {this.getTab()}
              </Wrapper>
            </div>
          )
        }
        {
          (this.state.active_tab === 5 || this.state.active_tab === 6) && (
            <Wrapper is_loading={this.state.is_loading} error={this.state.errors}>
              <CreateRoom edit={this.state.active_tab === 6} room={this.state.room} user={this.props.user} location={this.props.location} setError={this.setError} switchActiveTab={this.switchActiveTab} />;
            </Wrapper>
          )
        }
        {
          this.state.active_tab === 7 && (
            <Wrapper is_loading={this.state.is_loading} error={this.state.errors}>
              <CreateQuestion room={this.state.room} user={this.props.user} location={this.props.location} setError={this.setError} switchActiveTab={this.switchActiveTab} />;
            </Wrapper>
          )
        }
      </div>
    )
  }
}

export default Main;