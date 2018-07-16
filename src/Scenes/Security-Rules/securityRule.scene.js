import React, { Component } from 'react';
import { GetUrlParams, Location } from './../../Utils/location.utils';
import { Get, Put } from './../../Utils/http.utils';

import { SecurityRuleEndPoint } from './../../Constants/api.constants';
import { ROUTE_URL } from './../../Constants/global.constants';

import './securityRule.scene.css';

export default class SecurityRule extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...GetUrlParams(this.props), // params, queryString
            rule: {}
        };

    }

    componentDidMount() { 
        this.getSecurityDetail();
    }

    getSecurityDetail = async () => {
        const { id } = this.state.params;
        const url = SecurityRuleEndPoint + id;
        const result = await Get({ url, urlPrefix: ROUTE_URL });
        if (result.success && result.response) {
            const { response } = result;
            this.setState({ rule: response });
        }
    }

    render() {
        console.log(this.state);
        const { name = '', script: scriptObj = {} } = this.state.rule;
        const { script } = scriptObj;

        return (
            <div className='security-rule-container'>
                {/* <div className="page-bar">
                    <div className="search-bar">
                        Security Rule
                    </div>
                </div> */}

                <div className='body'>
                    <form name='securityRule'>
                        <div className='form-row'>
                            <div className='form-group'>
                                <label>Name</label>

                                <input className='form-control' value={name} disabled />
                            </div>
                        </div>
                    </form>
                </div>
            </div>

        )
    }
}