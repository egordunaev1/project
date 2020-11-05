import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {getCookie} from '../../cookieOperations';
import { getBackend } from '../../utility';

function BrowseMembers(props) {
  if (!props.member_list.length)
    return <div>Список пуст</div>
  return (
    <div className="row">
      {
        props.member_list.map((member, ind) => (
          <div key={ind + 'd1'} className="col-12 col-md-6 px-3 my-1">
            <div key={ind + 'd2'} className="p-member p-2 text-white d-flex">
              <Link key={ind + 'l1'} to={"profile/" + member.id}>
                <img alt=""  src={getBackend() + '' + member.profile.cover} className="cover-img" width="32px" height="32px" />
                <span className="ml-1">{member.profile.first_name} {member.profile.last_name} {'(' + member.username + ')'}</span>
              </Link>
              {
                props.is_admin ?
                  <div key={ind + 'd3'} className="ml-auto">
                    {
                      props.username !== member.username &&
                      <a key={ind + 'a1'} className="cursor-pointer">
                        {props.admin_list ?
                          <span onClick={() => props.change_status(member.username, 'member')} style={{color: 'orange'}}>Понизить</span>
                          :
                          <span onClick={() => props.change_status(member.username, 'admin')} className="text-success">Повысить</span>
                        }
                      </a>
                    }
                    <a key={ind + 'a2'} onClick={() => props.change_status(member.username, 'no')} className="ml-2 text-danger cursor-pointer">
                      {props.username === member.username ? 'Выйти' : 'Исключить'}
                    </a>
                  </div>
                  :
                  ''
              }
            </div>
          </div>
        ))
      }
    </div>
  )
}

class Members extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  change_status = (username, status) => {
    fetch(getBackend() + '/change_status/', {
      headers: { Authorization: `JWT ${getCookie('token')}` },
      method: 'POST',
      body: JSON.stringify({username: username, status: status, room: this.props.room.id})
    }).then(this.props.getRoom(true));
  }

  render() {
    var room = this.props.room;
    return (
      <div className="body main-body bg-white p-2">
        <div className="container-fluid">
          <h5 className="text-primary">Список администраторов</h5>
          <BrowseMembers change_status={this.change_status} member_list={room.admin_list} username={this.props.username} is_admin={this.props.is_admin} admin_list={true} />
          <h5 className="text-primary mt-3">Список участников</h5>
          <BrowseMembers change_status={this.change_status} member_list={room.allowed_users} username={this.props.username} is_admin={this.props.is_admin} admin_list={false} />
        </div>
      </div>
    )
  }
}

export default Members;