import React from 'react';
import {
  Link
} from "react-router-dom";

class LoginForm extends React.Component {
  state = {
    username: '',
    password: '',
    width: window.innerWidth,
    logged_in: false
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

  updateDimensions = () => {
    this.setState({ width: window.innerWidth });
  };
  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  render() {
    return (
      <form className={'form ' + (this.state.width >= 992 || this.props.isActive ? '' : 'hidden')} id="nav-login-form" onSubmit={e => this.props.handle_login(e, this.state)}>
        <input
          type="text"
          name="username"
          placeholder="Логин"
          value={this.state.username}
          onChange={this.handle_change}
          className={'ml-1 form-control' + (this.state.width < 992 ? '' : '-sm')}
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={this.state.password}
          onChange={this.handle_change}
          className={'ml-1 form-control' + (this.state.width < 992 ? '' : '-sm')}
        />
        <button
          className={'ml-1 btn btn-success btn' + (this.state.width < 992 ? '-md' : '-sm')}
          type="submit">
          Войти
        </button>
        <Link to="/registration"><button
          className={'ml-1 btn btn-secondary btn' + (this.state.width < 992 ? '-md' : '-sm')}
          type="submit">
          Регистрация
        </button></Link>
      </form>
    );
  }
}

export default LoginForm;