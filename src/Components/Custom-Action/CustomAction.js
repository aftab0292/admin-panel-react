import React, { Component } from 'react';
import './CustomAction.css';

import { CreateUrl } from './../../Utils/generic.utils';

let customMethods = {};

let self = {};
export default class CustomAction extends Component {
    methods = {};
    constructor(props) {
        super(props);

        self = this;
        this.state = {
            actions: props.actions,
            genericData: props.genericData
        };
    }

    componentDidMount = () => {
        const { actions } = this.state
        this.registerMethod(actions);
        this.preSelectedMethods();
    }

    preSelectedMethods() {
        this.methods.redirect = (action, listing) => {
            const { history, genericData } = this.props;

            var url = CreateUrl({ url: action.parameter, obj: listing });
            // var urlParams;
            // var userQuery = 0;

            function createQueryUrl(url, restrictQuery, genericData) {

                var query = '';
                var orderMethod;

                // If query is present 
                // we add it ,
                // else we check if there is a filter in the url , 
                // then append the respective filter query 
                // if (urlParams.query) {
                //     query += urlParams.query;
                // } else {
                //     if (urlParams.filter) {
                //         var filter = this.props.genericData.userFilter.filter(function (userFilter) {
                //             return userFilter.id == urlParams.filter;
                //         })[0];

                //         query += filter.filter_query;
                //     }
                // }

                if (restrictQuery) {
                    if (query) {
                        query += restrictQuery;
                    } else {
                        query += restrictQuery.split('and ')[1];
                    }
                }

                if (query) {
                    query = '?redirectQuery=' + query;
                    orderMethod = '&';
                } else {
                    orderMethod = '?';
                }
                // if (urlParams.order) {
                //     url += query + orderMethod + "listingOrder=" + urlParams.order + ',' + (urlParams.sort || 'desc');
                // } else if (this.props.genericData.defaultOrder) {
                //     url += query + orderMethod + "listingOrder=" + this.props.genericData.defaultOrder;
                // } else {
                //     url += query;
                // }

                return url;
            }
            url = createQueryUrl(url, genericData.restrictQuery, genericData);

            history.push(url);
            // if (angular.isDefined(event)) {
            //     if (event.metaKey || event.ctrlKey) {
            //         window.open("#/" + url, "_blank");
            //     } else {
            // $location.url(url);
            // location.hash = "#/" + url;
            //     }
            // }
        };
    }


    // Register all the methods coming from db
    registerMethod(method) {
        for (var i in method) {
            var methodObj = method[i];
            if (methodObj.definition && typeof methodObj.definition == 'object' && methodObj.definition.script) {
                if (methodObj.dependency) {
                    customMethods[methodObj.name] = new Function("obj", "callback", methodObj.dependency, methodObj.definition.script);
                } else {
                    customMethods[methodObj.name] = new Function("obj", "callback", methodObj.definition.script);
                }
            }
        }
    }


    callFunction(action, listing) {
        console.log(action, listing);
        const args = [];
        if (typeof customMethods[action.name] == "function") {
            // var callback = action.callback ? (typeof customMethods[action.callback] == "function" ? customMethods[action.callback] : customMethods[action.callback]) : listing.callbackFunction.function;
            // // var args = convertDependencyInjectionToArgs(action.dependency);
            // args.reverse();
            // args.push(callback);
            // action.placement_id == 167 ? args.push(listing) : args.push("");
            // args.reverse();

            customMethods[action.name].apply(this, args);
        } else { // For add, edit,delete
            // action.callback = action.callback ? (typeof customMethods[action.callback] == "function" ? customMethods[action.callback] : listing.callbackFunction.function) : listing.callbackFunction.function;
            if (typeof this.methods[action.name] == "function") {
                this.methods[action.name](action, listing);
            }
        }
    }

    render() {
        const { actions = [], listingRow = [] } = this.props;
        return (
            <td className="custom-action action-column">
                {
                    actions.map((action, key) => (
                        <button onClick={() => { this.callFunction(action, listingRow) }} type="button" key={key} className="btn btn-sm btn-light">
                            <i className={`fas ${action.icon}`} ></i>
                        </button>
                    ))
                }
            </td>
        )
    }
}