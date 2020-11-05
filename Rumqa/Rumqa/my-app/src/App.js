import React, { Component } from 'react';
import Navbar from './components/Navbar/Nav';
import Profile from './components/Profile/Profile';
import Reg from './components/Profile/Reg';
import Main from './components/Main/Main';
import MyRooms from './components/Main/MyRooms';
import PrivateChat from './components/Profile/Chat';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import { getCookie, deleteCookie, setCookie } from './cookieOperations';
import { getBackend } from './utility';
import Wrapper from './components/Main/Wrapper';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logged_in: false,
      user: null,
      profile_active_tab: 1,
      notifications: [],
      is_loading: true,
      error: null
    };
    this.updateUserData = this.updateUserData.bind(this);
    this.update_pat = this.update_pat.bind(this);
  }

  timerId;

  update_pat(num) {
    this.setState({ profile_active_tab: num });
  }

  updateUserData() {
    let logged_in = getCookie('token') ? true : false;
    if (this.state.logged_in || logged_in) {
      fetch(getBackend() + '/current-user/', {
        headers: {
          Authorization: `JWT ${getCookie('token')}`
        }
      })
        .then(response => {
          if (response.status !== 200) {
            deleteCookie('token');
            this.setState({ logged_in: false, user: null, is_loading: false, error: response.status });
          }
          else {
            response.json()
              .then(res => this.setState({
                user: res,
                logged_in: true,
                is_loading: false
              }));
          }
        }
        )
    } else this.setState({is_loading: false, logged_in: false});
  }

  getNotifications() {
    fetch(getBackend() + '/notifications/', {
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      }
    })
      .then(response => {
        if (response.status === 200)
          response.json().then(res => this.setState({ notifications: res }));
      }
      )
  }

  componentDidMount() {
    this.updateUserData();
    this.timerId = setInterval(() => { this.getNotifications(false); }, 2000);
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
  }

  handle_login = (e, data) => {
    e.preventDefault();
    fetch(getBackend() + '/token-auth/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(json => { setCookie('token', json.token, { 'max-age': 2592000, 'samesite': 'Lax' }); })
      .then(() => this.updateUserData());
  };

  handle_logout = () => {
    deleteCookie('token');
    this.setState({ logged_in: false, user: null });
  };


  render() {
    return (
      <Router>
        <div className="App">
          <Navbar
            logged_in={this.state.logged_in}
            handle_login={this.handle_login}
            user={this.state.user}
            handle_logout={this.handle_logout}
            update_pat={this.update_pat}
            notifications={this.state.notifications}
          />
          <Wrapper is_loading={this.state.is_loading} error={this.state.error}>
            <Switch>
              <Route exact path="/registration" render={(props) => <Reg {...props} updateUser={this.updateUserData} handle_signup={this.handle_signup} logged_in={this.state.logged_in} />} />
              <Route path="/profile/:id?" render={(props) => <Profile {...props} user={this.state.user} updateUser={this.updateUserData} update_pat={this.update_pat} active_tab={this.state.profile_active_tab} />} />
              <Route exact path="/chat/redirect/:user_id?" render={(props) => <PrivateChat {...props} user={this.state.user} redirected={false} />} />
              <Route exact path="/chat/:chat_id?" render={(props) => <PrivateChat {...props} redirected={true} user={this.state.user} private={true} />} />
              <Route exact path="/" render={(props) => <MyRooms {...props} user={this.state.user} />} />
              <Route path="/" render={(props) => <Main {...props} user={this.state.user} updateUser={this.updateUserData} />} />
            </Switch>
          </Wrapper>
        </div>
      </Router >
    );
  }
}

export default App;