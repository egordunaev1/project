import React, { Component } from 'react';
import {getCookie} from '../../cookieOperations';
import { getBackend } from '../../utility';

function PRow(props) {
  return (
    <div className="prow">
      <div className="pkey">{props.pkey}:</div>
      <div className="pvalue text-info">{props.pvalue}</div>
    </div>
  );
}

function AddFriendButton(props) {
  var disabled = (props.is_loading ? ' disabled' : '');
  switch (props.rel) {
    case 'none':
      return (
        ''
      );
    case 'friend':
      return (
        <div>
          <div className="sep" />
          <button className={'btn mt-1 btn-danger' + disabled} onClick={() => props.update_friend_list({ request: 'remove' })}>Удалить из друзей</button>
        </div>
      );
    case 'friend_inc':
      return (
        <div>
          <div className="sep" />
          <button className={'btn mt-1 btn-success' + disabled} onClick={() => props.update_friend_list({ request: 'accept' })}>Принять предложение</button>
          <button className={'btn mt-1 btn-danger ml-1' + disabled} onClick={() => props.update_friend_list({ request: 'deny' })}>Отклонить</button>
        </div>
      )
    case 'friend_out':
      return (
        <div>
          <div className="sep" />
          <button className={'btn mt-1 btn-primary' + disabled} disabled>Предложение отправлено</button>
        </div>
      )
    case 'stranger':
      return (
        <div>
          <div className="sep" />
          <button className={'btn mt-1 btn-primary' + disabled} onClick={() => props.update_friend_list({})}>Добавить в друзья</button>
        </div>
      )
    default:
      return ('')
  }
}

class ProfilePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is_loading: false
    };
    this.update_friend_list = this.update_friend_list.bind(this);
  }

  update_friend_list(data) {
    this.setState({is_loading: true});
    fetch(getBackend() + '/update_friend_list/' + this.props.owner.id + '/', {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: JSON.stringify({ data })
    }).then(() => {
      this.props.getUser(true);
      this.setState({is_loading: false});
    });
  }

  render() {
    return (
      <div className="pcontent">
        <div>
          <div className="media">
            <img alt=""  src={getBackend() + this.props.owner.profile.cover} className="mr-3 rounded" width="65px" height="65px" />
            <div className="media-body">
              <h5 className="mt-0 text-primary owner-select-none">{this.props.owner.profile.first_name + ' ' + this.props.owner.profile.last_name + ' (' + this.props.owner.username + ')'}</h5>
                Зарегистрирован: {this.props.owner.profile.reg_date.substring(0, 10)}
            </div>
          </div>
          <div className="sep" />
          <h5 className="text-primary mt-0">Обо мне</h5>
          <span className="lead">{this.props.owner.profile.status}</span>
          <div className="sep" />
          <h5 className="text-primary mt-0">Подробная информация</h5>
          <div>
            <PRow pkey="Город" pvalue={this.props.owner.profile.location} />
            <PRow pkey="День рождения" pvalue={this.props.owner.profile.birth_date ? this.props.owner.profile.birth_date : 'Не указан'} />
            <PRow pkey="Лучшие ответы" pvalue={this.props.owner.profile.best_answers} />
            <div className="prow">
              <div className="pkey ">Репутация:</div>
              <dt className={'pvalue text-' + (this.props.owner.profile.reputation < 0 ? 'danger' : 'success')}>{this.props.owner.profile.reputation}</dt>
            </div>
          </div>
          <AddFriendButton rel={this.props.owner.rel} is_loading={this.state.is_loading} update_friend_list={this.update_friend_list} />
        </div >
      </div >
    )
  }
}

export default ProfilePage;