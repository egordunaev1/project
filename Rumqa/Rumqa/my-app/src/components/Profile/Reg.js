import React from 'react';
import {
  Redirect
} from "react-router-dom";
import {getCookie} from '../../cookieOperations';
import { getBackend } from '../../utility';

class Reg extends React.Component {
  state = {
    username: '',
    username_err: '',
    password: '',
    password_err: '',
    width: window.innerWidth
  };

  handle_change = e => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState(prevstate => {
      const newState = { ...prevstate };
      newState[name] = value;
      return newState;
    });
  };

  handle_signup = (e, data) => {
    e.preventDefault();
    fetch(getBackend() + '/create_user/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(res => {
        if (res.status < 200 || res.status > 300) {
          res.json().then(r => {
            this.setState({
              password_err: r.password,
              username_err: r.username
            })
          }
          );
        }
        else
          res.json()
            .then(json => localStorage.setItem('token', json.token))
            .then(() => this.props.updateUser());
      })
  }

  render() {
    if (!this.props.logged_in)
      return (
        <div className="profile-body body bg-white p-3">
          <form onSubmit={e => this.handle_signup(e, this.state)}>
            <h4 className="d-flex justify-content-center text-primary">Добро пожаловать в Rumqa!</h4>
            <div>
              <label htmlFor="username">Логин</label>
              <input type="text" className="form-control" name="username" value={this.state.username} onChange={this.handle_change} placeholder="Логин" id="username" />
              <div className="reg_form_err">{this.state.username_err}</div>
            </div>
            <div className="mt-3">
              <label htmlFor="password">Пароль</label>
              <input type="password" className="form-control" name="password" value={this.state.password} onChange={this.handle_change} placeholder="Пароль" id="password" />
              <div className="reg_form_err">{this.state.password_err}</div>
            </div>
            <div className="mt-3">
              <label htmlFor="repeat_password">Повторите пароль</label>
              <input type="password" className="form-control" name="repeat_password" value={this.state.repeat_password} onChange={this.handle_change} placeholder="Повторите пароль" id="repeat_password" />
            </div>
            <button
              className="mt-3 btn btn-success"
              type="submit">
              Зарегистрироваться
          </button>
          </form>
        </div >
      );
    else return (<Redirect to="/Main" />);
  }
}


export default Reg;