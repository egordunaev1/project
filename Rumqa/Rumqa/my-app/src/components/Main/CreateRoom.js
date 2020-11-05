import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import {getCookie} from '../../cookieOperations';
import { getBackend } from '../../utility';

function Member(props) {
  return (
    <div className={"member mt-2 d-flex pt-2 px-2" + (props.current ? ' choosen' : '')}>
      <img alt=""  className="cover-img" src={getBackend() + props.member.profile.cover} height="32px" width="32px" />
      <span className="ml-3">{props.member.profile.first_name + ' ' + props.member.profile.last_name + ' (' + props.member.username + ')'}</span>
      <div className="member-choose-status">
        <button className={"btn-sm btn-" + (!props.current || props.current.status !== 'admin' ? 'secondary' : 'success')} onClick={(e) => { e.preventDefault(); props.addMember('admin', props.member) }}>Админ</button>
        <button className={"btn-sm ml-1 btn-" + (!props.current || props.current.status !== 'member' ? 'secondary' : 'primary')} onClick={(e) => { e.preventDefault(); props.addMember('member', props.member) }}>Участник</button>
      </div>
    </div>
  )
}

function Members(props) {
  if (!props.members)
    return '';
  return (
    <div className="border border-primary add-members mt-2 p-2">
      {
        props.members.map((member, ind) => {
          let current = null;
          for (let i = 0; i < props.selected_members.length; i++)
            if (props.selected_members[i].username === member.username) {
              current = props.selected_members[i];
              break;
            }
          return (
            <div key={ind + 'd1'}>
              <Member member={member} addMember={props.addMember} current={current} key={ind + 'm1'} />
              <div className="sep mt-1" key={ind + 'd2'}></div>
            </div>
          )
        })
      }
    </div>
  )
}

class CreateRoom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      friends: this.del(this.props.user.profile.friends, this.props.room),
      name: props.edit ? props.room.name : '',
      name_err: '',
      description: props.edit ? props.room.description : '',
      description_err: '',
      members: [],
      search_value: '',
      edited: false
    };
  }

  getSearchResult = value => {
    let data = value;
    fetch(getBackend() + '/search_friends/', {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: JSON.stringify({ search: data, room: this.props.room.id })
    })
      .then(res => { return res.json(); })
      .then(json => {
        this.setState({
          friends: json.friends,
        });
      });
  };

  componentDidMount() {
    this.handleSearch(null);
  }

  addMember = (status, member) => {
    let members = this.state.members;
    for (let i = 0; i < this.state.members.length; i++)
      if (this.state.members[i].username === member.username) {
        if (this.state.members[i].status === status) {
          members.splice(i, 1);
          this.setState({ members: members });
          return;
        }
        members.splice(i, 1);
      }
    members.push({ username: member.username, status: status });
    this.setState({ members: members });
    return false;
  }

  del = (list, room) => {
    if (!room)
      return list;
    var del = room.allowed_users.concat(room.admin_list);
    var res = [];
    list.forEach(el1 => {
      var add = true;
      del.forEach(el2 => {
        if (el1.id === el2.id)
          add = false;
      });
      if (add)
        res.push(el1);
    });
    return res;
  }

  handleSearch = e => {
    const value = e ? e.target.value : '';
    this.setState({ search_value: value });
    this.getSearchResult(value);
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

  handleCreate = e => {
    e.preventDefault();
    fetch(getBackend() + '/create_room/', {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: JSON.stringify({
        edit: this.props.edit,
        name: this.state.name,
        description: this.state.description,
        members: this.state.members,
        room: this.props.room.id
      })
    })
      .then(res => {
        if (res.status === 200) {
          if (this.props.edit)
            res.json().then((res) => {
              if (this.props.room.path != res)
                this.setState({ redirect_path: res });
              this.props.switchActiveTab(null, 1);
            });
          else {
            if (this.props.getMyRooms)
              this.props.getMyRooms();
            this.props.switchActiveTab(null, 1);
          }
        }
        else if (res.status === 400) {
          res.json().then(res => this.setState({
            description_err: res.description ? res.description[0] : '',
            name_err: res.name ? res.name[0] : ''
          }))
        }
        else this.props.setError(res.status);
      })
      .catch(() => this.props.setError(500));
  }

  render() {
    if (this.state.redirect_path) {
      return <Redirect to={this.state.redirect_path} />
    }
    return (
      <div className="main-body body bg-white p-3">
        <form onSubmit={e => this.handleCreate(e)}>
          <div className="d-flex">
            {this.props.need_return_btn ? <a href="" onClick={(e) => { e.preventDefault(); return this.props.switchActiveTab(0, 1); }} className="p-a">Назад</a> : ''}
            <h4 className="mx-auto text-primary">{this.props.edit ? 'Редактирование' : 'Создание комнаты'}</h4>
          </div>
          <div>
            <label htmlFor="name">Название</label>
            <input type="text" className="form-control" name="name" value={this.state.name} onChange={this.handle_change} placeholder="Название" id="username" />
            <div className="reg_form_err">{this.state.name_err}</div>
          </div>
          <div className="mt-3">
            <label htmlFor="description">Описание</label>
            <textarea className="form-control" name="description" value={this.state.description} onChange={this.handle_change} placeholder="Описание" id="description" />
            <div className="reg_form_err">{this.state.description_err}</div>
          </div>
          <div className="mt-2">
            <label htmlFor="search">Добавить участников</label>
            <input id="search" value={this.state.search_value} type="search" placeholder="Поиск" onChange={this.handleSearch} className="form-control" />
            <Members members={this.state.friends} addMember={this.addMember} selected_members={this.state.members} />
          </div>
          <button
            className="mt-3 btn btn-success"
            type="submit">
            {this.props.edit ? "Сохранить" : "Создать"}
          </button>
        </form>
      </div >
    )
  }


}

export default CreateRoom;