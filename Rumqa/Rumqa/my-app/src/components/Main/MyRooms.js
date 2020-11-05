import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import CreateRoom from './CreateRoom';
import Wrapper from './Wrapper';
import { getCookie } from '../../cookieOperations';
import { getBackend } from '../../utility';

function MRTopPanel(props) {
  return (
    <div className="container-fluid bg-primary text-white p-1 no-bb">
      <div className="row no-gutters">
        <div className="col-4 col-sm-3">Мои комнаты</div>
        <div className="col-5 col-sm-6 col-md-7 col-lg-8 before-sep" style={{ marginLeft: -5 + 'px' }}>Описание</div>
        <div className="col-3 col-md-2 col-lg-1 before-sep"><center>Участники</center></div>
      </div>
    </div>
  )
}

function AddRoom(props) {
  return (
    <div className="p-1">
      <button className="btn-sm btn-primary mr-0" onClick={() => props.addRoom()}>
        Добавить корневую комнату
        </button>
    </div>
  )
}

function Room(props) {
  let room = props.room;
  return (
    <div className="nested_room_bb">
      <Link to={room.path}>
        <div className="row no-gutters nested_room p-1">
          <div className="col-4 col-sm-3 nested_room_name">{room.name}</div>
          <div className="col-5 col-sm-6 col-md-7 col-lg-8 to-el">{room.description}</div>
          <div className="col-3 col-md-2 col-lg-1"><center>{room.allowed_users.length + room.admin_list.length}</center></div>
        </div>
      </Link>
      {
        room.nested_rooms.map((room1, ind) => (
          <div key={ind + 0}>
            <Link to={room1.path}>
              <div key={ind + 1} className="row nested_room no-gutters p-1">
                <div key={ind + 2} className="col-4 col-sm-3 nested_room_name">&#11177;{room1.name}</div>
                <div key={ind + 3} className="col-5 col-sm-6 col-md-7 col-lg-8 to-el">{room1.description}</div>
                <div key={ind + 4} className="col-3 col-md-2 col-lg-1"><center>{room1.allowed_users.length + room1.admin_list.length}</center></div>
              </div>
            </Link>
            {
              room1.nested_rooms.map((room2, ind) => (
                <div key={ind + 9}>
                  <Link to={room2.path}>
                    <div key={ind + 5} className="row nested_room no-gutters p-1">
                      <div key={ind + 6} className="col-4 col-sm-3 pl-3 nested_room_name">&#11177;{room2.name}</div>
                      <div key={ind + 7} className="col-5 col-sm-6 col-md-7 col-lg-8 to-el">{room2.description}</div>
                      <div key={ind + 8} className="col-3 col-md-2 col-lg-1"><center>{room2.allowed_users.length + room2.admin_list.length}</center></div>
                    </div>
                  </Link>
                  {room2.nested_rooms.length !== 0 && <div key={ind + 9} className="no-gutters ml-4 pl-3">&#11177; ...</div>}
                </div>
              ))
            }
          </div>
        ))
      }
    </div>
  )
}

class MyRooms extends Component {
  constructor(props) {
    super(props);
    this.state = {
      my_rooms: null,
      is_loading: true,
      error: null,
      active_tab: 1
    };
  }

  componentDidMount() {
    this.getMyRooms();
  }

  getMyRooms = () => {
    this.setState({ is_loading: true });
    var headers = (getCookie('token') ? { Authorization: `JWT ${getCookie('token')}` } : {});
    fetch(getBackend() + '/my_rooms/', {
      method: 'GET',
      headers: headers
    }).then(res => {
      if (res.status === 200)
        res.json().then(res => this.setState({ my_rooms: res, is_loading: false }));
      else this.setState({ error: res.status });
    })
  }

  render() {
    let rooms = this.state.my_rooms;
    if (this.state.error == 401 && getCookie('token') && this.props.user) {
      this.setState({ error: null });
      this.getMyRooms();
    }
    if (this.state.active_tab === 1)
      return (
        <Wrapper is_loading={false} error={this.state.error}>
          <div className="body main-body bg-white">
            <MRTopPanel />
            {this.state.is_loading ?
              (
                <div className="d-flex py-2">
                  <div className="spinner-border mx-auto" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) :
              <div className="container-fluid p-0">
                {!rooms &&
                  <div className="p-1"><h5>Нет комнат</h5></div>}
                {
                  rooms.map((room, ind) => (
                    <div key={ind + 'div1'}>
                      <Room ind={ind} room={room} />
                      <div className="sep-no-margin" key={ind + 'div2'}></div>
                    </div>
                  ))
                }
                <AddRoom addRoom={() => this.setState({ active_tab: 2 })} user={this.props.user} />
              </div>
            }
          </div>
        </Wrapper>
      );
    else return <CreateRoom need_return_btn={true} getMyRooms={this.getMyRooms} edit={false} room={{ id: 18, name: '', allowed_users: [], admin_list: [] }} user={this.props.user} setError={(error) => this.setState({ error: error })} switchActiveTab={(a, at) => this.setState({ active_tab: at })} />
  }
}

export default MyRooms;