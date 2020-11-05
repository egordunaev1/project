import React, { Component } from 'react';
import Error404 from '../Errors/404';
import ProfilePage from './ProfilePage'
import ProfileEdit from './ProfileEdit'
import Friends from './Friends'
import {
  Switch,
  Link,
  Route
} from "react-router-dom";
import {getCookie} from '../../cookieOperations';
import { getBackend } from '../../utility';


class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is_loading: true,
      user_data: null,
      errors: null,
    };
    this.getUser = this.getUser.bind(this);
  }

  componentDidMount() {
    this.getUser();
    this.props.update_pat(this.getAT());
  }

  componentDidUpdate() {
    if (this.props.active_tab !== this.getAT())
      this.props.update_pat(this.getAT());
    else if (!this.state.user_data || this.state.is_loading)
      return;
    else if (this.state.user_data.id !== Number.parseInt(this.props.match.params.id))
      this.getUser();
  }

  getAT = () => {
    let path = this.props.location.pathname;
    let strAT = path.match(/[a-z]+/g).pop();
    switch (strAT) {
      case 'friends':
        return 2;
      case 'edit':
        return 3;
      default:
        return 1;
    }
  }

  getUser(not_loading = false) {
    let id = Number.parseInt(this.props.match.params.id);
    if (id) {
      this.setState({ is_loading: !not_loading, id: id });
      let headers = {}
      if (getCookie('token')) {
        headers = { Authorization: `JWT ${getCookie('token')}` };
      }
      fetch(getBackend() + '/user_data/' + id, {
        headers: headers,
        method: 'get',
      }).then(res => {
        if (res.status === 200) {
          res.json().then(res => this.setState({ user_data: res, is_loading: false }));
        } else {
          this.setState({ errors: 404 });
        }
      });
    } else {
      this.setState({ errors: 404 });
    }
  }

  render() {
    return (
      <div>
        {
          !this.state.errors ? (
            <div className="body profile-body bg-white">
              {
                this.state.is_loading ? (
                  <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : (
                    < div >
                      <ul className="nav nav-tabs">
                        <li className="nav-item" >
                          <Link to={"/profile/" + Number.parseInt(this.props.match.params.id)} className={"nav-link" + (this.props.active_tab === 1 ? ' active' : '')} onClick={() => this.props.update_pat(1)}>Профиль</Link>
                        </li>
                        <li className="nav-item" onClick={() => this.props.update_pat(2)}>
                          <Link to={"/profile/" + Number.parseInt(this.props.match.params.id) + '/friends'} className={"nav-link" + (this.props.active_tab === 2 ? ' active' : '')} onClick={() => this.props.update_pat(2)}>Друзья</Link>
                        </li>
                        {this.props.user && Number.parseInt(this.props.match.params.id) === this.props.user.id ?
                          <li className="nav-item" onClick={() => this.props.update_pat(3)}>
                            <Link to={"/profile/" + Number.parseInt(this.props.match.params.id) + "/edit/"} className={"nav-link" + (this.props.active_tab === 3 ? ' active' : '')}>Редактировать</Link>
                          </li>
                          :
                          <li>
                            <Link to={"/chat/redirect/" + this.state.user_data.id} className="nav-link no-border">Личные сообщения</Link>
                          </li>
                          }
                      </ul>
                      <div id="profile-switch">
                        <Switch>
                          <Route exact path={'/profile/' + Number.parseInt(this.props.match.params.id)} render={(props) => <ProfilePage owner={this.state.user_data} user={this.props.user} getUser={this.getUser} />} />
                          <Route exact path={'/profile/' + Number.parseInt(this.props.match.params.id) + '/friends'} render={(props) => <Friends user={this.props.user} owner={this.state.user_data} getUser={this.getUser} getAT={this.getAT} />} />
                          {this.props.user && Number.parseInt(this.props.match.params.id) === this.props.user.id ? <Route exact path={'/profile/' + Number.parseInt(this.props.match.params.id) + '/edit'} render={(props) => <ProfileEdit user={this.state.user_data} updateUser={this.props.updateUser} updateUserData={this.getUser} />} /> : ''}
                          <Route path="/" component={Error404} />
                        </Switch>
                      </div>
                    </div>)}
            </div>) :
            <div className="alert alert-danger" role="alert">
              {this.state.errors ? <Error404 /> : ''}
            </div>
        }
      </div>
    )
  }
}

export default Profile;