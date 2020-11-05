import React, { Component } from 'react';
import {getCookie} from '../../cookieOperations';
import { getBackend } from '../../utility';

function PEInput(props) {
  return (
    <div className="form-group">
      <label htmlFor={props.name}>{props.description}</label>
      <input type={props.type} className="form-control" id={props.name} name={props.name} value={props.value} onChange={props.handle_change} />
      {
        !props.has_changed ? '' :
          <div className={"text-" + (props.err ? 'danger' : 'success')}>
            {props.err ? 'Неправильный формат или пустой ввод' : 'Сохранено'}
          </div>
      }
    </div>
  )
}

class ProfileEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      first_name: this.props.user.profile.first_name,
      last_name: this.props.user.profile.last_name,
      status: this.props.user.profile.status,
      location: this.props.user.profile.location,
      birth_date: this.props.user.profile.date,
      cover: '',
      fn_err: false,
      ln_err: false,
      st_err: false,
      loc_err: false,
      has_changed: false
    };
    this.handle_submit = this.handle_submit.bind(this);
    this.handle_change = this.handle_change.bind(this);
  }

  handle_submit(e, data) {
    e.preventDefault();
    let formData = new FormData(e.target);
    fetch(getBackend() + '/profile_edit/', {
      method: 'PUT',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: formData
    })
      .then(res => res.json())
      .then(json => {
        this.setState({
          fn_err: json.first_name,
          ln_err: json.last_name,
          st_err: json.status,
          loc_err: json.location,
          has_changed: true
        });
        this.props.updateUser();
        this.props.updateUserData();
      });
  }

  handle_change = e => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState(prevstate => {
      const newState = { ...prevstate };
      newState[name] = value;
      return newState;
    });
  };


  add_friend(id) {
    fetch(getBackend() + '/update_friend_list/' + id, {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      }
    });
  }

  render() {
    return (
      <div id="profile-edit">
        <form onSubmit={e => this.handle_submit(e, this.state)} id="abcd">
          <PEInput has_changed={this.state.has_changed} err={this.state.fn_err} description="Имя" name="first_name" type="text" value={this.state.first_name} handle_change={this.handle_change} />
          <PEInput has_changed={this.state.has_changed} err={this.state.ln_err} description="Фамилия" name="last_name" type="text" value={this.state.last_name} handle_change={this.handle_change} />
          <PEInput has_changed={this.state.has_changed} err={this.state.st_err} description="Обо мне" name="status" type="text" value={this.state.status} handle_change={this.handle_change} />
          <PEInput has_changed={this.state.has_changed} err={this.state.loc_err} description="Город" name="location" type="text" value={this.state.location} handle_change={this.handle_change} />
          <PEInput has_changed={this.state.has_changed} description="День рождения" name="birth_date" type="date" value={this.state.birth_date} handle_change={this.handle_change} />
          <div className="form-group">
            <label htmlFor="cover" id="cover-edit-lable">Изображение профиля</label>
            <input name="cover" type="file"/>
          </div>
          <button type="submit" className="btn btn-primary">Сохранить</button>
        </form>
      </div>
    )
  }
}

export default ProfileEdit;