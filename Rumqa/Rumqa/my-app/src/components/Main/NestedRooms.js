import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {getCookie} from '../../cookieOperations';
import { getBackend } from '../../utility';

function is_admin(user, admin_list) {
  if (!user)
    return false;

  for (let i = 0; i < admin_list.length; i++)
    if (user.username === admin_list[i].username) {
      return true;
    }

  return false;
}

function NRTopPanel(props) {
  return (
    <div className="container-fluid bg-primary text-white p-1 no-bb">
      <div className="row no-gutters">
        <div className="col-3">Название</div>
        <div className="col-6 col-md-7 col-lg-8 before-sep">Описание</div>
        <div className="col-3 col-md-2 col-lg-1 before-sep"><center>Участники</center></div>
      </div>
    </div>
  )
}

function NestedRoom(props) {
  let room = props.room;
  return (
    <div className="row no-gutters nested_room nested_room_bb p-1">
      <div className="col-3 nested_room_name">{room.name}</div>
      <div className="col-6 col-md-7 col-lg-8 pl-5px to-el">{room.description}</div>
      <div className="col-3 col-md-2 col-lg-1"><center>{room.allowed_users.length + room.admin_list.length}</center></div>
    </div>
  )
}

function AddRoom(props) {
  let _is_admin = is_admin(props.user, props.room.admin_list);
  if (_is_admin)
    return (
      <div className="p-1">
        <button className="btn-sm btn-primary mr-0" onClick={() => props.addRoom()}>
          Добавить комнату
        </button>
      </div>
    );
  else return '';
}

class NestedRooms extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nested_rooms: []
    }
  }

  componentDidMount() {
    this.getNestedRooms();
  }

  getNestedRooms = () => {
    var headers = (getCookie('token') ? { Authorization: `JWT ${getCookie('token')}` } : {});
    fetch(getBackend() + '/nested_rooms/' + this.props.room.id, {
      method: 'GET',
      headers: headers
    })
      .then(res => {
        if (res.status === 200)
          res.json().then(res => this.setState({ nested_rooms: res }));
        else this.props.setError(res.status);
      });
  }

  render() {
    let rooms = this.state.nested_rooms;
    return (
      <div className="body main-body">
        <NRTopPanel />
        <div className="container-fluid bg-white p-0">
          {!rooms.length &&
            <div className="p-1"><h5>Нет комнат</h5></div>}
          {
            rooms.map((room, ind) => (
              <div key={ind + 'div1'}>
                <Link to={room.path}><NestedRoom ind={ind} room={room} /></Link>
                <div className="sep-no-margin" key={ind + 'div2'}></div>
              </div>
            ))
          }
          <AddRoom addRoom={this.props.addRoom} user={this.props.user} room={this.props.room} admin_list={this.props.room.admin_list} />
        </div>
      </div>
    );
  }
}

export default NestedRooms;