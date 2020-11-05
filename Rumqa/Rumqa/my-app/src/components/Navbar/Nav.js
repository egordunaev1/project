import React from 'react';
import UserPanel from './UserPanel';
import {
    Link
} from "react-router-dom";

class Navbar extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hidden: true, isActive: false };
        this.handleNavTogglerClick = this.handleNavTogglerClick.bind(this);
    }
    wrapper = React.createRef();

    componentWillUnmount() {
        this.removeOutsideClickListener();
    }

    addOutsideClickListener() {
        document.addEventListener('click', this.handleDocumentClick);
    }

    removeOutsideClickListener() {
        document.removeEventListener('click', this.handleDocumentClick);
    }

    onShow() {
        this.addOutsideClickListener();
    }

    onHide() {
        this.removeOutsideClickListener();
    }

    onClickOutside() {
        this.setState({ isActive: false });
    }

    handleDocumentClick = e => {
        if (this.wrapper.current && !this.wrapper.current.contains(e.target)) {
            this.onClickOutside();
        }
    };

    toggleMenu = () => {
        let isActive = this.state.isActive;
        isActive ? this.onHide() : this.onShow();
        this.setState({ isActive: !isActive });
    };

    handleNavTogglerClick() {
        let isActive = this.state.isActive;
        isActive ? this.onHide() : this.onShow();
        this.setState({ isActive: !isActive });
    }

    render() {
        return (
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary" ref={this.wrapper}>
                <Link to="/Main" className="navbar-brand">Rumqa</Link>
                {
                    this.props.logged_in ?
                        <div className="" id="nav-my-rooms">
                            <Link className="nav-link text-white" to="/">Мои комнаты</Link>
                        </div>
                        :
                        <button className="navbar-toggler" type="button" onClick={this.handleNavTogglerClick}>
                            <span className="navbar-toggler-icon"></span>
                        </button>
                }
                {
                }
                <UserPanel
                    notifications={this.props.notifications}
                    user={this.props.user}
                    logged_in={this.props.logged_in}
                    handle_login={this.props.handle_login}
                    handle_logout={this.props.handle_logout}
                    isActive={this.state.isActive}
                    update_pat={this.props.update_pat} />
            </nav>
        );
    }
}

export default Navbar;