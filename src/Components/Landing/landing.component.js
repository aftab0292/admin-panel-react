import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Route, Switch, Redirect
} from 'react-router-dom';

/** Components */
import HomeScene from './../../Scenes/Home-Scene/home.scene';
import GenericListing from './../../Scenes/Generic-Listing/genericListing.scene';
// import GenericDetail from './../../Scenes/Generic-Detail/genericDetail.scene';
import SideNav from './../../Scenes/Side-Nav/sideNav.scene';
import Header from './../../Scenes/Header/header.scene';
// import BookingDetail from './../../Scenes/Booking-Detail/bookingDetail.scene';
// import UserDetail from './../../Scenes/User-Detail/userDetail.scene';
import ExpenseVoucherDetail from './../../Scenes/Expense-Voucher/expenseVoucherDetail.scene';
import UserLicense from './../../Scenes/User-License/userLicense.scene';
// import VehicleDetail from './../../Scenes/Vehicle-Detail/vehicleDetail.scene';

// import { Spotlight } from './../Components/Spotlight-Search/spotlightSearch.component';
import TicketDetail from './../../Scenes/Ticket-Detail/ticketDetail.scene';
import RosterTimeline from './../../Scenes/Roster-Timeline/rosterTimeline.scene';

import LoadAsyncComponent from './../../Async/async';

import './landing.component.css';

// const GenericListing = LoadAsyncComponent(() => import('./../../Scenes/Generic-Listing/genericListing.scene'));

export default class LandingApp extends Component {
    constructor(props) {
        super(props);

        this.state = {
            menus: this.props.menus,
            sideNavExpanded: false
        }

        this.loadedComponent = [];
    }

    componentDidUpdate = (prevProps) => {
        if (prevProps.menus != this.props.menus) {
            this.setState({ menus: this.props.menus });
        }
    }

    onCollapse = (sideNavExpanded) => {
        this.setState({ sideNavExpanded: !sideNavExpanded });
    }

    render() {
        const { menus = [], sideNavExpanded } = this.state;
        const { match, history } = this.props;
        const { loadedComponent } = this;

        // console.log(menus);
        return (
            <div className="page-container">
                <div className="landing-sidebar">
                    <SideNav visible={sideNavExpanded} onCollapse={this.onCollapse.bind(this)} menus={menus} />
                </div>
                <div className={`landing-wrapper ${sideNavExpanded ? 'sidenav-open' : 'sidenav-closed'}`} id="main" style={{ height: '100%' }}>
                    <Header className={`${sideNavExpanded ? 'expanded' : 'collapsed'}`} history={history} />
                    <div className="landing-body">
                        <Switch>
                            {
                                menus.map((menu, parentIndex) => {
                                    if (Array.isArray(menu.menus)) {
                                        return menu.menus.map((state, index) => {
                                            return (<Route key={state.url} path={`${match.path}${state.url}`} render={props => {
                                                if (!Array.isArray(this.loadedComponent[parentIndex])) {
                                                    // since in dynamic import, component gets remounted on every setState being happened in this level
                                                    // using this.loadedComponent to prevent from the same
                                                    this.loadedComponent[parentIndex] = [];
                                                }
                                                if (!loadedComponent[parentIndex][index]) {
                                                    this.loadedComponent[parentIndex][index] = LoadAsyncComponent(() => import(`./../../Scenes${state.component.path}`));
                                                }
                                                const GenericListing = this.loadedComponent[parentIndex][index];

                                                // const GenericListing = LoadAsyncComponent(() => import(`./../../Scenes${state.component.path}`));
                                                return <GenericListing {...props} menuId={state.id} />
                                            }}
                                            />)
                                            // return (<Route key={state.url} path={`${match.path}${state.url}`} render={props => <GenericListing {...props} menuId={state.id} />} />)


                                            // return (<Route key={state.url} path={`${match.path}${state.url.split('/')[1]}`} render={props => <GenericListing {...props} menuId={state.id} />} />)

                                            // if (typeof state.controller_path == 'string' && state.controller_path.indexOf('genericListingController.js') != -1) {
                                            //     return (<Route key={state.url} path={`${match.path}${state.url.split('/')[1]}`} render={props => <GenericListing {...props} menuId={state.id} />} />)
                                            // } else if (typeof state.controller_path == 'string' && state.controller_path.indexOf('genericDetailCtrl.js') != -1) {
                                            //     return (<Route key={state.url} path={state.url} render={props => <GenericDetail {...props} menuId={state.id} />} />)
                                            //     // return (<Route key={state.url} path={`${match.path}${state.url.split('/')[1]}`} render={props => <GenericDetail {...props} menuId={state.id} />} />)
                                            // } else {
                                            //     // return (<Route key={state.url} path={state.url} component={BookingDetail} />)
                                            // }
                                        })
                                    }
                                })
                            }
                            {/* <Route menuId="5" path={`${match.path}models`} component={GenericListing} /> */}
                            {/* <Route path={`${match.path}list/:page`} component={GenericListing} />
                            <Route path={`${match.path}detail/:page/:detailId`} component={GenericDetail} /> */}

                            {/* <Route exact path='/booking/:id' component={BookingDetail} /> */}
                            <Route exact path='/voucherDef/:voucherId' component={ExpenseVoucherDetail} />
                            <Route exact path='/userLicense/:userId' component={UserLicense} />
                            {/* <Spotlight ref={(elem) => SettingsUtil.registerModal(elem)} /> */}
                            <Route exact path='/ticket/:ticketId' component={TicketDetail} />
                            <Route exact path='/rosterTimeline' component={RosterTimeline} />
                            <Route exact path='/' component={HomeScene} />
                            {/* <Route exact path='/user/:userId' component={UserDetail} /> */}
                            {/* <Route exact path='/vehicle/:vehicleId' component={VehicleDetail} /> */}

                        </Switch>
                    </div>
                </div>
            </div>
        )
    }
}