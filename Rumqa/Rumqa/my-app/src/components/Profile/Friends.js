import React, { Component } from 'react'
import { Link } from "react-router-dom";
import {getCookie} from '../../cookieOperations';
import { getBackend } from '../../utility';

class Friends extends Component {
  constructor(props) {
    super(props);
    this.state = {
      friends: this.props.owner.profile.friends,
      search_results: [],
      search_value: ''
    }
  }

  getSearchResult(value) {
    let data = value;
    fetch(getBackend() + '/search_friends/', {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: JSON.stringify({ search: data })
    })
      .then(res => { return res.json(); })
      .then(json => {
        this.setState({
          friends: json.friends,
          search_results: json.not_friends
        });
      });
  };

  handle_change = e => {
    const value = e.target.value;
    if (!value) {
      this.setState({
        friends: this.props.owner.profile.friends,
        search_results: null,
        search_value: ''
      });
    } else {
      this.setState({ search_value: value });
      this.getSearchResult(value);
    }
  };

  render() {
    return (
      <div className="container">
        <form className={'row' + (!this.props.user || this.props.owner.id !== this.props.user.id ? ' hidden' : '')} id="form-friend-search" onSubmit={e => e.preventDefault()}>
          <input className="col-12" value={this.state.search_value} id="friend-search" type="search" placeholder="Поиск друзей" aria-label="Search" onChange={this.handle_change} />
        </form>
        {this.props.user && this.props.owner.id === this.props.user.id && this.props.user.profile.incoming_friend_requests.length ?
          <div>
            <h5 className="text-primary mt-2">Приглашения в друзья</h5>
            {this.props.user.profile.incoming_friend_requests.map((friend, ind) => (
              <div key={ind + '1'} className="friend pt-2">
                <div key={ind + '2'} className="media">
                  <Link key={ind + '3'} to={'/profile/' + friend.id} onClick={() => this.props.getUser()}><img alt=""  key={ind + '4'} src={getBackend() + friend.profile.cover} className="mr-3 rounded-max" width="80px" height="80px" /></Link>
                  <div key={ind + '5'} className="media-body">
                    <h5 key={ind + '6'} className="mt-3 text-primary"><Link key={ind + '7'} to={'/profile/' + friend.id} onClick={() => this.props.getUser()}>{friend.profile.first_name + ' ' + friend.profile.last_name + ' (' + friend.username + ')'}</Link></h5>
                    <div key={ind + '8'} className="mt-2">{friend.profile.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div> : ''
        }
        <h5 className="text-primary mt-2">Друзья</h5>
        {!this.state.friends.length ?
          <div className="pb-2 no-friends friend" style={{height: "auto"}}>Не найдено ни одного друга</div>
          :
          <div>
            {this.state.friends.map((friend, ind) => (
              <div key={ind + '1'} className="friend pt-2">
                <div key={ind + '2'} className="media">
                  <Link key={ind + '3'} to={'/profile/' + friend.id} onClick={() => this.props.getUser()}><img alt=""  key={ind + '4'} src={getBackend() + friend.profile.cover} className="mr-3 rounded-max" width="80px" height="80px" /></Link>
                  <div key={ind + '5'} className="media-body">
                    <h5 key={ind + '6'} className="mt-3 text-primary"><Link key={ind + '7'} to={'/profile/' + friend.id} onClick={() => this.props.getUser()}>{friend.profile.first_name + ' ' + friend.profile.last_name + ' (' + friend.username + ')'}</Link></h5>
                    <div key={ind + '8'} className="mt-2">{friend.profile.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
        {!this.state.search_results || !this.state.search_results.length ? '' :
          <div>
            <h5 className="text-primary mt-3">Другие пользователи</h5>
            {this.state.search_results.map((result, ind) => (
              <div key={ind + 'f'} className="friend pt-2">
                <div key={ind + 'm'} className="media">
                  <Link key={ind + 'l'} to={'/profile/' + result.id}><img alt=""  src={getBackend() + result.profile.cover} className="mr-3 rounded-max" width="80px" height="80px" /></Link>
                  <div key={ind + 'mb'} className="media-body">
                    <h5 key={ind + 'h'} className="mt-3 text-primary"><Link to={'/profile/' + result.id}>{result.profile.first_name + ' ' + result.profile.last_name + ' (' + result.username + ')'}</Link></h5>
                    <div key={ind + 's'} className="mt-2">{result.profile.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    )
  }
}

export default Friends;