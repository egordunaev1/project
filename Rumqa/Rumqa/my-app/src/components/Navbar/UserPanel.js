import React from 'react';
import LoginForm from './LoginForm';
import {
  Link
} from "react-router-dom";
import { getBackend } from '../../utility';
import Interweave from 'interweave';

class UserPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hidden: true, hidden_notif: true }
  }
  wrapper = React.createRef();
  wrapper_notif = React.createRef();

  componentWillUnmount() {
    this.removeOutsideClickListener();
  }

  addOutsideClickListener = which => {
    if (which === 1)
      document.addEventListener('click', this.handleDocumentClick1);
    else
      document.addEventListener('click', this.handleDocumentClick2);
  }

  removeOutsideClickListener = which => {
    if (which === 1)
      document.removeEventListener('click', this.handleDocumentClick1);
    else
      document.removeEventListener('click', this.handleDocumentClick2);
  }

  onShow = which => {
    this.addOutsideClickListener(which);
  }

  onHide = which => {
    this.removeOutsideClickListener(which);
  }

  onClickOutside = which => {
    if (which === 1)
      this.setState({ hidden: true });
    else
      this.setState({ hidden_notif: true });
    this.onHide(which);
  }

  handleDocumentClick1 = (e) => {
    let _w = this.wrapper;
    if (_w.current && !_w.current.contains(e.target)) {
      this.onClickOutside(1);
    }
  };

  handleDocumentClick2 = (e) => {
    let _w = this.wrapper_notif;
    if (_w.current && !_w.current.contains(e.target)) {
      this.onClickOutside(2);
    }
  };

  handleProfileHidden = () => {
    let hidden = this.state.hidden;
    !hidden ? this.onHide(1) : this.onShow(1);
    this.setState({ hidden: !hidden });
  }

  handleNotifHidden = () => {
    let hidden = this.state.hidden_notif;
    !hidden ? this.onHide(2) : this.onShow(2);
    this.setState({ hidden_notif: !hidden });
  }

  render() {
    if (this.props.logged_in)
      return (
        <div id="navbar-profile-panel" className="d-flex">
          <div ref={this.wrapper_notif} className="d-flex" style={{ height: 50 + 'px' }}>
            <img src={getBackend() + '/media/images/icons/' + (this.props.notifications.length ? 'notif_new.png' : 'notif.png')}
              width="40px" height="40px"
              className="cursor-pointer my-auto mr-2"
              onClick={this.handleNotifHidden}
            />
            <div className={this.state.hidden_notif ? 'hidden' : ''} id="nav-notif">
              {
                this.props.notifications.map((notif, ind) => (
                  <div className={'px-2' + (ind !== 0 ? ' pt-1': '')} key={ind+'a'}>
                    <div className="text-bold" key={ind+'b'}>{notif.title}</div>
                    <div className="nav-profile-sep mx-auto" key={ind+'c'}/>
                    {notif.content1}
                    <Link to={notif.link_to} key={ind+'d'}>
                      <span className="text-bold text-black" key={ind+'d'}>{notif.link_text}</span>
                    </Link>
                    {notif.content2}
                    <div className="nav-profile-sep mx-auto" key={ind+'f'}/>
                  </div>
                ))
              }
            </div>
          </div>
          <div ref={this.wrapper}>
            <div onClick={this.handleProfileHidden} id="logged-in-nav-panel">
              <div className="my-auto" id="navbar-username">{this.props.user.username}</div>
              <img alt="" className="my-auto cover-img" src={getBackend() + this.props.user.profile.cover} height="32px" width="32px" />
            </div>
            <div className={this.state.hidden ? 'hidden' : ''} id="nav-profile">
              <Link to={'/profile/' + this.props.user.id} className="nav-profile-item" id="nav-profile-name" onClick={() => this.props.update_pat(1)}>
                <img alt="" className="my-auto cover-img" src={getBackend() + this.props.user.profile.cover} height="32px" width="32px" />
                <div className="">{this.props.user.profile.first_name + ' ' + this.props.user.profile.last_name}</div>
              </Link>
              <div className="nav-profile-sep mx-auto" />
              <Link to={'/'} className="nav-profile-item">Мои комнаты</Link>
              <Link to={'/profile/' + this.props.user.id + '/friends'} className="nav-profile-item" onClick={() => this.props.update_pat(2)}>Друзья</Link>
              <Link to={'/profile/' + this.props.user.id + '/edit'} className="nav-profile-item" onClick={() => this.props.update_pat(3)}>Редактировать</Link>
              <div className="nav-profile-sep mx-auto" />
              <Link to="/Main" className="nav-profile-item" onClick={() => { this.handleProfileHidden(); this.props.handle_logout(); }} >Выйти</Link>
            </div>
          </div>
        </div>
      )
    else
      return (
        <div id="navbar-login-panel">
          <LoginForm
            handle_login={this.props.handle_login}
            isActive={this.props.isActive}
          />
        </div>
      )
  }
}

export default UserPanel;