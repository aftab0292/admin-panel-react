// Higher Order Component
import React, { Component } from 'react';
import {
    Card, CardBody, Row, Col
} from 'reactstrap';
import { Get, Post } from './../../Utils/http.utils';
import SelectBox from './../../Components/Forms/Components/Select-Box/selectBox';
import { BuildUrlForGetCall, IsUndefined } from './../../Utils/common.utils';
import ModalManager from './../../Wrappers/Modal-Wrapper/modalManager';
import ToastNotifications from '../../Utils/toast.utils';
import './impersonateForm.css';


export default class ImpersonateFrom extends Component {

    constructor(props) {
        super(props);
        this.state = {
            userObject: []
        };
    }

    getInputRecord = async ({ input: val } = {}) => {
        if (val) {
            const options = {
                query: 'email like %22%25' + val + '%25%22 and admin=1'
            };
            let url = 'user';

            url = BuildUrlForGetCall(url, options);

            const result = await Get({ url });
            const userContent = result.response;
            return { options: userContent };
        }
    }

    convertToInputField = function ({ data, attr = 'inputField' }) {
        if (!IsUndefined(data)) {
            const { userObject } = this.state;
            userObject[attr] = data;
            this.setState({ userObject });
        }
    };

    submit = async () => {
        const { userObject = [] } = this.state;
        const result = await Post({ url: 'impersonateUser/' + userObject.selectValue.id });
        if (result.success) {
            ModalManager.closeModal({ impersonatedUser: result.response });
            ToastNotifications.success("You are now impersonating " + result.response.display_name)
            window.location.reload(true);
        }
    }

    closeModal = () => {
        ModalManager.closeModal();
    }


    render() {
        const { userObject = [] } = this.state;
        return (
            <div className="impersonate-form">
                <div className="modal-body whitesmoke-bg">
                    <Card>
                        <CardBody className="panel-body">
                            <div className="form-group">
                                <label className="control-label">Select User</label>
                                <SelectBox
                                    onChange={(data) => this.convertToInputField({ data, attr: 'selectValue' })}
                                    value={userObject.selectValue}
                                    field='email'
                                    placeholder="Search Admin Email"
                                    getOptions={(input) => this.getInputRecord({ input })}
                                />
                                <small className="form-text text-muted">Type to search for user</small>
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <div className="modal-actions">
                    <div className="impersonate-actions">
                        <button className="btn btn-secondary" onClick={this.closeModal}>Cancel</button>
                        <button className="btn btn-primary" onClick={this.submit}>Submit</button>
                    </div>
                </div>
            </div>
        )
    }
}